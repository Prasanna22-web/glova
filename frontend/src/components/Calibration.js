import React, { useState, useRef } from 'react';

export default function Calibration({ onCalibrated }){
  const [running, setRunning] = useState(false);
  const samplesRef = useRef([]);

  function startCalibration(){
    samplesRef.current = [];
    setRunning(true);
    // Parent Home will push samples by calling window.__focusguard_cal_push({ear,mor})
    window.__focusguard_cal_push = (s) => samplesRef.current.push(s);
    // Stop after 3.5s
    setTimeout(()=> stopCalibration(), 3500);
  }

  function stopCalibration(){
    setRunning(false);
    const samples = samplesRef.current;
    delete window.__focusguard_cal_push;
    if (!samples.length){ alert('No samples collected'); return; }
    const ears = samples.map(s=>s.ear).filter(Boolean);
    const mors = samples.map(s=>s.mor).filter(Boolean);
    const mean = arr=> arr.reduce((a,b)=>a+b,0)/arr.length;
    const earMean = ears.length ? mean(ears) : 0.25;
    const morMean = mors.length ? mean(mors) : 0.02;
    // thresholds: drowsy if EAR < 75% of baseline, yawn if MOR > 180% of baseline
    const thresholds = { earBaseline: earMean, morBaseline: morMean, earThreshold: earMean*0.75, morThreshold: morMean*1.8 };
    localStorage.setItem('focusguard_calibration', JSON.stringify(thresholds));
    onCalibrated && onCalibrated(thresholds);
  }

  return (
    <div style={{marginTop:12}}>
      <button onClick={startCalibration} disabled={running}>{running ? 'Calibrating...' : 'Calibrate (3s)'}</button>
      <small style={{display:'block',marginTop:6}}>Calibration captures a short baseline for EAR and MOR.</small>
    </div>
  );
}
