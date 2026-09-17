import React, { useEffect, useState } from 'react';
import { getSessions } from '../services/api';

export default function Dashboard({ user }){
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const fetchSessions = async ()=> {
      try {
        const data = await getSessions(user.id);
        setSessions(data);
      } catch(e) {
        console.error('Error fetching sessions:', e);
      }
      setLoading(false);
    };
    fetchSessions();
  }, [user.id]);

  return (
    <div style={{padding:32,maxWidth:1200,margin:'0 auto'}}>
      <h2 style={{marginTop:0,marginBottom:8}}>📊 Session Dashboard</h2>
      <p style={{color:'#666',marginBottom:24}}>User: <strong>{user.username}</strong> | View all your past focus sessions</p>
      
      {loading ? (
        <div style={{background:'white',borderRadius:12,padding:40,textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          <p style={{fontSize:16}}>⏳ Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{background:'white',borderRadius:12,padding:40,textAlign:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
          <p style={{fontSize:16}}>📭 No sessions yet</p>
          <small style={{color:'#666'}}>Start a new session from the Home page to see results here</small>
        </div>
      ) : (
        <div style={{background:'white',borderRadius:12,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',color:'white'}}>
                <th style={{textAlign:'left',padding:16,fontWeight:600}}>ID</th>
                <th style={{textAlign:'left',padding:16,fontWeight:600}}>Start Time</th>
                <th style={{textAlign:'left',padding:16,fontWeight:600}}>Duration</th>
                <th style={{textAlign:'left',padding:16,fontWeight:600}}>Metrics Points</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s,idx) => {
                const metrics = s.metrics ? JSON.parse(s.metrics) : [];
                const startTime = s.start_time ? new Date(s.start_time) : null;
                const endTime = s.end_time ? new Date(s.end_time) : null;
                const duration = (startTime && endTime) ? endTime - startTime : 0;
                const mins = Math.floor(duration/60000);
                const secs = Math.floor((duration%60000)/1000);
                return (
                  <tr key={s.id} style={{borderBottom:'1px solid #f0f0f0',transition:'background 0.2s'}} onMouseEnter={e=>e.currentTarget.style.background='#f8f9fa'} onMouseLeave={e=>e.currentTarget.style.background='white'}>
                    <td style={{padding:16,fontWeight:600,color:'#667eea'}}>#{s.id}</td>
                    <td style={{padding:16}}>{s.start_time ? new Date(s.start_time).toLocaleString() : 'N/A'}</td>
                    <td style={{padding:16}}>{duration > 0 ? `${mins}m ${secs}s` : 'N/A'}</td>
                    <td style={{padding:16}}><span style={{background:'#e8f0ff',color:'#667eea',padding:'4px 8px',borderRadius:6,fontWeight:500}}>{metrics.length}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
