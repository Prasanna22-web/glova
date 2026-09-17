import React, { useState } from 'react';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export default function App(){
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [settings, setSettings] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem('focusguard_settings')) || { alertsEnabled: true, systemNotifications: true, earMultiplier: 0.75, morMultiplier: 1.8, yawThreshold: 25, alertWindowMs: 1100 } }catch(e){ return { alertsEnabled: true, systemNotifications: true, earMultiplier: 0.75, morMultiplier: 1.8, yawThreshold:25, alertWindowMs:1100 } }
  });

  if (!user) return <Login onLogin={setUser} />;

  const navItems = [
    { id: 'home', label: '🏠 Home' },
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'profile', label: '👤 Profile' },
    { id: 'settings', label: '⚙️ Settings' }
  ];

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      {/* Nav bar */}
      <div className='navbar'>
        <div style={{display:'flex',gap:12,flex:1}}>
          {navItems.map(item => (
            <button 
              key={item.id}
              onClick={()=>setPage(item.id)} 
              className={page === item.id ? 'active' : ''}
              style={{background: page === item.id ? 'linear-gradient(135deg, #06f 0%, #0a8 100%)' : 'rgba(255,255,255,0.2)'}}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Page content */}
      <div style={{flex:1,overflow:'auto',background:'#f8f9fa'}}>
        {page==='home' && <Home user={user} onLogout={()=>setUser(null)} settings={settings} />}
        {page==='dashboard' && <Dashboard user={user} />}
        {page==='profile' && <Profile user={user} onLogout={()=>{setUser(null);setPage('home');}} />}
        {page==='settings' && <Settings settings={settings} onSave={(s)=>{ setSettings(s); localStorage.setItem('focusguard_settings', JSON.stringify(s)); }} />}
      </div>
    </div>
  );
}
