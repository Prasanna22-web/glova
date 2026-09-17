import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../services/socket';
import { getSessions } from '../services/api';
import Calibration from '../components/Calibration';
import SessionChart from '../components/SessionChart';

function dist(a,b){return Math.hypot(a.x-b.x, a.y-b.y);} 

function eyeAspectRatio(landmarks, leftIdx, rightIdx){
  try{
    const leftEAR = (dist(landmarks[leftIdx[1]],landmarks[leftIdx[5]]) + dist(landmarks[leftIdx[2]],landmarks[leftIdx[4]])) / (2.0 * dist(landmarks[leftIdx[0]],landmarks[leftIdx[3]]));
    const rightEAR= (dist(landmarks[rightIdx[1]],landmarks[rightIdx[5]]) + dist(landmarks[rightIdx[2]],landmarks[rightIdx[4]])) / (2.0 * dist(landmarks[rightIdx[0]],landmarks[rightIdx[3]]));
    return (leftEAR+rightEAR)/2.0;
  }catch(e){return null}
}

function mouthOpening(landmarks, top,bottom){ try{ return dist(landmarks[top], landmarks[bottom]); }catch(e){return null} }

function estimateHeadPose(landmarks){
  try{
    const nose = landmarks[1];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const eyeMid = { x: (leftEye.x + rightEye.x)/2, y: (leftEye.y + rightEye.y)/2 };
    const dx = nose.x - eyeMid.x; // left/right
    const dy = nose.y - eyeMid.y; // up/down
    // Approximate yaw/pitch in degrees
    const yaw = Math.atan2(dx, 0.5) * (180/Math.PI);
    const pitch = Math.atan2(dy, 0.5) * (180/Math.PI);
    return { yaw, pitch };
  }catch(e){ return { yaw:0, pitch:0 }; }
}

export default function Home({ user, onLogout, settings={} }){
  const videoRef = useRef(null);
  // audio element used as fallback if WebAudio context fails
  const [audioInitialized] = useState(() => {
    const a = document.createElement('audio');
    a.id = 'focusguard-alert';
    // tiny 100ms sine beep encoded as WAV (generated offline)
    a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YYQAAABZj5XZ';
    document.body.appendChild(a);
    return true;
  });
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false); // Ref to track running state immediately
  const bufferRef = useRef([]);
  const cameraRef = useRef(null);
  const [thresholds, setThresholds] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('focusguard_calibration')) || null; }catch(e){return null}
  });
  const [points, setPoints] = useState([]); // for chart: {t,score}
  const [sessionResult, setSessionResult] = useState(null); // verification after session ends
  const [alert, setAlert] = useState(null); // {type,msg,t}
  const alertCooldownRef = useRef({}); // per-type last alert timestamp
  const [alertsHistory, setAlertsHistory] = useState([]); // {t,type,msg}

  // Update ref whenever running state changes
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  // request notification permission when the component loads so alerts
  // appear even if the page is minimized or not focused
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default'){
      Notification.requestPermission();
    }
  }, []);

  useEffect(()=>{
    const faceMesh = new window.FaceMesh({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
    faceMesh.setOptions({maxNumFaces:1,refineLandmarks:true, minDetectionConfidence:0.5, minTrackingConfidence:0.5});
    faceMesh.onResults(onResults);

    if (videoRef.current){
      // Use global Camera from the CDN-loaded Mediapipe camera_utils
      cameraRef.current = new window.Camera(videoRef.current, { onFrame: async ()=> await faceMesh.send({image: videoRef.current}), width:640, height:480 });
      cameraRef.current.start();
    }

    // Listen for saved session confirmation
    socket.on('saved', async (data)=> {
      console.log('Session saved:', data);
      setSessionResult({msg: 'Session saved successfully', sessionId: data.session_id});
      // Fetch and display the saved session details
      try {
        const sessions = await getSessions(user.id);
        if (sessions.length > 0) {
          const latestSession = sessions[0];
          setSessionResult(prev => ({...prev, sessionData: latestSession}));
        }
      } catch(e) { console.error('Error fetching session:', e); }
    });

    return ()=> { 
      cameraRef.current && cameraRef.current.stop();
      socket.off('saved');
    };
  },[running, thresholds, user.id]);

  // Play a short beep using WebAudio for attention. amplitude bumped and
  // fallback to <audio> element if AudioContext is suspended when backgrounded.
  function playBeep(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.value = 0.001;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      // ramp up to a louder level so it's audible even when tab isn't focused
      g.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
      setTimeout(()=>{ o.stop(); ctx.close(); }, 500);
    }catch(e){
      console.warn('beep error', e);
      // fallback: try playing an <audio> element if created
      const audio = document.getElementById('focusguard-alert');
      if (audio){ audio.play().catch(()=>{}); }
    }
  }

// Show a system notification (works when app is backgrounded) and request
  // permission if needed.  Permission is requested by effect on mount below.
  function showSystemNotification(title, body){
    if (!('Notification' in window)) return;
    try{
      const create = ()=>{
        try{
          // requireInteraction keeps it on screen until clicked/dismissed
          const n = new Notification(title, { body, silent: false, requireInteraction: true });
          n.onclick = ()=>{ window.focus && window.focus(); try{ n.close(); }catch(e){} };
        }catch(e){ console.warn('notification create failed', e); }
      };
      if (Notification.permission === 'granted') {
        create();
      } else if (Notification.permission === 'default') {
        // ask once more
        Notification.requestPermission().then(p => { if (p === 'granted') create(); });
      }
    }catch(e){ console.warn('notification error', e); }
  }

  function onResults(results){
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length===0) return;
    const lm = results.multiFaceLandmarks[0];
    const ear = eyeAspectRatio(lm, [33,160,158,133,153,144], [362,385,387,263,373,380]);
    const mor = mouthOpening(lm, 13,14);
    const pose = estimateHeadPose(lm);
    const t = Date.now();
    const record = {t, ear, mor, yaw: pose.yaw, pitch: pose.pitch};

    // If calibration running, Calibration component will push samples via global
    if (window.__focusguard_cal_push) window.__focusguard_cal_push({ear,mor});

    if (runningRef.current){
      bufferRef.current.push(record);
      socket.emit('session_event', {user_id: user.id || null, timestamp: t, ear, mor, yaw: pose.yaw, pitch: pose.pitch});

      // compute a simple focus score and detection thresholds using settings
      const earBaseline = thresholds?.earBaseline ?? (thresholds?.earThreshold ?? 0.24);
      const morBaseline = thresholds?.morBaseline ?? (thresholds?.morThreshold ?? 0.02);
      const earTh = (thresholds?.earThreshold) ?? (earBaseline * (settings.earMultiplier ?? 0.75));
      const morTh = thresholds?.morThreshold ?? morBaseline;
      const morYawnTh = morBaseline * (settings.morMultiplier ?? 1.8);
      const yawAlert = settings.yawThreshold ?? 25; // degrees
      const alertWindowMs = settings.alertWindowMs ?? 1100; // sustained duration to trigger alert
      const now = Date.now();

      // Detection state refs stored on window to allow Calibration pushing and visibility during dev
      window.__fg_last = window.__fg_last || {};

      // Drowsiness detection (eyes closed)
      if (ear && ear < earTh){
        if (!window.__fg_last.closedStart) window.__fg_last.closedStart = now;
      } else { window.__fg_last.closedStart = null; }

      // Yawn detection (mouth opening)
      if (mor && mor > morYawnTh){
        if (!window.__fg_last.yawnStart) window.__fg_last.yawnStart = now;
      } else { window.__fg_last.yawnStart = null; }

      // Looking away detection (yaw)
      if (Math.abs(pose.yaw) > yawAlert){
        if (!window.__fg_last.awayStart) window.__fg_last.awayStart = now;
      } else { window.__fg_last.awayStart = null; }

      // Helper to trigger alert once per cooldown
      function tryTrigger(type, msg){
        const last = alertCooldownRef.current[type] || 0;
        const cooldown = 8000; // 8s cooldown per alert type
        if (now - last < cooldown) return;
        alertCooldownRef.current[type] = now;
        if (!settings.alertsEnabled) return; // respect user toggle
        const a = {type, msg, t: now};
        setAlert(a);
        setAlertsHistory(prev => [...prev, a].slice(-200));
        try{ socket.emit('distraction_alert', {user_id: user.id || null, type, timestamp: now}); }catch(e){}
        playBeep();
        // show system notification if enabled in settings
        if (settings.systemNotifications){
          try{ 
            const titleMap = { drowsy: '😴 Drowsiness Detected', yawn: '😪 Yawning Detected', away: '📴 Looking Away', posture: '🧍 Bad Posture' };
            showSystemNotification(titleMap[type] || 'Alert', msg); 
          }catch(e){console.warn(e)}
        }
      }

      // Check sustained conditions
      if (window.__fg_last.closedStart && (now - window.__fg_last.closedStart) > alertWindowMs){
        tryTrigger('drowsy', 'Your eyes look closed — please focus');
        window.__fg_last.closedStart = null; // reset so we don't retrigger immediately
      }

      if (window.__fg_last.yawnStart && (now - window.__fg_last.yawnStart) > alertWindowMs){
        tryTrigger('yawn', 'You appear to be yawning — take a short break');
        window.__fg_last.yawnStart = null;
      }

      if (window.__fg_last.awayStart && (now - window.__fg_last.awayStart) > alertWindowMs){
        tryTrigger('away', 'You are looking away — please return your gaze');
        window.__fg_last.awayStart = null;
      }

      // Head tilt attention detection (forward/backward lean)
      // Forward pitch < -15° means head is leaning down (not attentive)
      // Backward pitch > 15° means head is leaning back (not attentive)
      const attentivePitchMin = -15;
      const attentivePitchMax = 15;
      if (pose.pitch < attentivePitchMin || pose.pitch > attentivePitchMax){
        if (!window.__fg_last.badPostureStart) window.__fg_last.badPostureStart = now;
      } else { window.__fg_last.badPostureStart = null; }

      if (window.__fg_last.badPostureStart && (now - window.__fg_last.badPostureStart) > alertWindowMs){
        const postureMsg = pose.pitch < attentivePitchMin 
          ? 'Your head is tilted down — maintain upright posture' 
          : 'Your head is tilted back — sit upright';
        tryTrigger('posture', postureMsg);
        window.__fg_last.badPostureStart = null;
      }

      let score = 100;
      if (ear && ear < earTh) score -= 35; // drowsy penalty
      if (mor && mor > morTh) score -= 20; // yawning penalty
      if (Math.abs(pose.yaw) > 25) score -= 15; // looking away
      if (pose.pitch < attentivePitchMin || pose.pitch > attentivePitchMax) score -= 10; // bad posture
      score = Math.max(0, Math.min(100, score));

      setPoints(prev => {
        const nxt = [...prev, {t, score}].slice(-200);
        return nxt;
      });
    }
  }

  function start(){ 
    setRunning(true); 
    bufferRef.current = []; 
    setPoints([]); 
    setSessionResult(null); 
  }
  
  function end(){ 
    setRunning(false); 
    const metricsToSave = bufferRef.current;
    const startTime = metricsToSave.length > 0 ? metricsToSave[0].t : Date.now();
    const endTime = Date.now();
    bufferRef.current = [];
    // Emit session_end with saved metrics and timestamps
    setTimeout(() => {
      socket.emit('session_end', {user_id: user.id || null, metrics: metricsToSave, start_time: startTime, end_time: endTime});
    }, 100);
  }

  function handleCalibrated(cal){ setThresholds(cal); }

  return (
    <div style={{display:'flex',height:'100%',gap:16,padding:16,backgroundColor:'#f8f9fa'}}>
      {/* Left panel: Camera */}
      <div style={{width:'45%',display:'flex',flexDirection:'column',gap:12}}>
        <div style={{background:'white',borderRadius:12,padding:16,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          <h4 style={{marginTop:0,marginBottom:12}}>📹 Live Camera</h4>
          <video ref={videoRef} autoPlay muted playsInline style={{width:'100%',borderRadius:8,border:'2px solid #667eea'}} />
        </div>
        
        <div style={{background:'white',borderRadius:12,padding:16,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          <h4 style={{marginTop:0,marginBottom:12}}>⚙️ Session Controls</h4>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={start} style={{flex:1,background:'linear-gradient(135deg, #0f0 0%, #0a8 100%)',padding:10}}>▶ Start</button>
            <button onClick={end} style={{flex:1,background:'linear-gradient(135deg, #f44 0%, #c22 100%)',padding:10}}>⏹ End</button>
          </div>
          <div style={{marginTop:12}}>
            <small style={{display:'block',marginBottom:4}}>Status: {running ? '🔴 Recording' : '⚫ Idle'}</small>
            <small style={{display:'block',marginBottom:4}}>Points: {bufferRef.current.length}</small>
            <small style={{display:'block'}}>Socket: {socket.connected ? '✅ Connected' : '❌ Disconnected'}</small>
          </div>
        </div>

        <div style={{background:'white',borderRadius:12,padding:16,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          <Calibration onCalibrated={handleCalibrated} />
          <div style={{marginTop:12}}>
            <small><strong>Calibration:</strong></small>
            <small style={{display:'block',marginTop:4}}>{thresholds ? `✅ EAR: ${thresholds.earThreshold.toFixed(3)}, MOR: ${thresholds.morThreshold.toFixed(4)}` : '❌ Not calibrated'}</small>
          </div>
        </div>
      </div>

      {/* Right panel: Metrics & Chart */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:12}}>
        <div style={{position:'relative'}}>
          <div style={{background:'white',borderRadius:12,padding:16,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
            <h4 style={{marginTop:0,marginBottom:12}}>📊 Focus Score Over Time</h4>
            <div style={{position:'relative',minHeight:300,paddingBottom:24}}>
              <SessionChart points={points} alerts={alertsHistory} />

              {alert && (
                <div style={{position:'absolute',right:12,bottom:12,zIndex:999,background:'#fff6f6',border:'1px solid #ffd6d6',padding:12,borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',width:320}}>
                  <div style={{fontWeight:700,color:'#c0392b'}}>{alert.type === 'drowsy' ? '😴 Drowsiness' : alert.type === 'yawn' ? '😪 Yawning' : alert.type === 'posture' ? '🧍 Posture Alert' : '📴 Distraction'}</div>
                  <div style={{marginTop:6}}>{alert.msg}</div>
                  <div style={{marginTop:8,display:'flex',gap:8,justifyContent:'flex-end'}}>
                    <button onClick={()=>{ setAlert(null); }} style={{padding:'6px 10px'}}>Dismiss</button>
                    <button onClick={()=>{ const snoozeMs = 60*1000; alertCooldownRef.current[alert.type] = Date.now() + snoozeMs; setAlert(null); }} style={{padding:'6px 10px'}}>Snooze 1m</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {sessionResult && (
          <div style={{background:'linear-gradient(135deg, #0f0 0%, #0a8 100%)',borderRadius:12,padding:16,color:'white',boxShadow:'0 4px 12px rgba(0,170,136,0.3)'}}>
            <h4 style={{marginTop:0,color:'white'}}>✅ {sessionResult.msg}</h4>
            {sessionResult.sessionId && <small style={{display:'block'}}>Session ID: <strong>{sessionResult.sessionId}</strong></small>}
            {sessionResult.sessionData && (
              <div style={{marginTop:8}}>
                <small style={{display:'block'}}>📈 Metrics: {sessionResult.sessionData.metrics ? `${JSON.parse(sessionResult.sessionData.metrics).length} points` : 'N/A'}</small>
                <small style={{display:'block'}}>📅 Time: {sessionResult.sessionData.start_time ? new Date(sessionResult.sessionData.start_time).toLocaleString() : 'N/A'}</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
