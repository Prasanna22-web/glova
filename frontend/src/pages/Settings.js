import React, { useState } from 'react';

export default function Settings({ settings, onSave }){
  const [local, setLocal] = useState(()=> ({
    alertsEnabled: settings?.alertsEnabled ?? true,
    systemNotifications: settings?.systemNotifications ?? true,
    earMultiplier: settings?.earMultiplier ?? 0.75,
    morMultiplier: settings?.morMultiplier ?? 1.8,
    yawThreshold: settings?.yawThreshold ?? 25,
    alertWindowMs: settings?.alertWindowMs ?? 1100
  }));

  function update(k,v){ setLocal(prev=> ({...prev,[k]:v})); }

  function save(){
    onSave && onSave(local);
    alert('Settings saved');
  }

  return (
    <div style={{padding:24}}>
      <h2>Settings</h2>
      <div style={{background:'white',padding:16,borderRadius:8,maxWidth:720}}>
        <label style={{display:'block',marginBottom:8}}>
          <input type='checkbox' checked={local.alertsEnabled} onChange={e=>update('alertsEnabled', e.target.checked)} /> Enable distraction alerts
        </label>

        <div style={{marginTop:12}}>
          <label>Eye sensitivity (EAR multiplier): {local.earMultiplier.toFixed(2)}</label>
          <input type='range' min='0.5' max='0.95' step='0.01' value={local.earMultiplier} onChange={e=>update('earMultiplier', parseFloat(e.target.value))} style={{width:'100%'}} />
        </div>

        <div style={{marginTop:12}}>
          <label style={{display:'block',marginBottom:8}}>
            <input type='checkbox' checked={local.systemNotifications} onChange={e=>update('systemNotifications', e.target.checked)} /> Enable system notifications (show when app is backgrounded)
          </label>
        </div>

        <div style={{marginTop:12}}>
          <label>Mouth sensitivity (MOR multiplier): {local.morMultiplier.toFixed(2)}</label>
          <input type='range' min='1.0' max='3.0' step='0.05' value={local.morMultiplier} onChange={e=>update('morMultiplier', parseFloat(e.target.value))} style={{width:'100%'}} />
        </div>

        <div style={{marginTop:12}}>
          <label>Yaw threshold (degrees): {local.yawThreshold}</label>
          <input type='range' min='10' max='60' step='1' value={local.yawThreshold} onChange={e=>update('yawThreshold', parseInt(e.target.value))} style={{width:'100%'}} />
        </div>

        <div style={{marginTop:12}}>
          <label>Alert window (ms): {local.alertWindowMs}</label>
          <input type='range' min='400' max='3000' step='100' value={local.alertWindowMs} onChange={e=>update('alertWindowMs', parseInt(e.target.value))} style={{width:'100%'}} />
        </div>

        <div style={{marginTop:16,display:'flex',gap:8}}>
          <button onClick={save} style={{padding:'8px 12px'}}>Save</button>
        </div>
      </div>
    </div>
  );
}
