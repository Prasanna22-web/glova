import React, { useEffect, useState } from 'react';
import { getUser, updateUser } from '../services/api';

export default function Profile({ user, onLogout }){
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    course: '',
    bio: '',
    profile_picture: null
  });
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(()=>{
    const fetchUser = async () => {
      try {
        const data = await getUser(user.id);
        setProfileData(data);
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          course: data.course || '',
          bio: data.bio || '',
          profile_picture: data.profile_picture || null
        });
      } catch(e) {
        console.error('Error fetching user:', e);
      }
      setLoading(false);
    };
    fetchUser();
  }, [user.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({...prev, profile_picture: event.target.result}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      const res = await updateUser(user.id, formData);
      if (res.msg === 'ok') {
        setProfileData(res.user);
        setEditing(false);
        setMessage('Profile updated successfully! ✅');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch(e) {
      console.error('Error updating profile:', e);
      setMessage('Error updating profile ❌');
    }
  };

  if (loading) {
    return <div style={{padding:32,textAlign:'center'}}>Loading profile...</div>;
  }

  return (
    <div style={{padding:32,maxWidth:700,margin:'0 auto'}}>
      <h2 style={{marginTop:0,marginBottom:32}}>👤 Student Profile</h2>

      <div style={{background:'white',borderRadius:16,padding:32,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',marginBottom:24}}>
        {/* Profile Picture */}
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:140,height:140,borderRadius:'50%',margin:'0 auto 16px',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',border:'4px solid white',boxShadow:'0 4px 12px rgba(102,126,234,0.3)'}}>
            {formData.profile_picture ? (
              <img src={formData.profile_picture} alt="Profile" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            ) : (
              <div style={{fontSize:60,color:'white'}}>📸</div>
            )}
          </div>
          {editing && (
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              style={{padding:'8px 16px',border:'2px dashed #667eea',borderRadius:8,cursor:'pointer',display:'block',margin:'0 auto'}}
            />
          )}
        </div>

        {/* Form Fields */}
        <div style={{marginBottom:24}}>
          <label style={{display:'block',color:'#666',fontSize:12,marginBottom:6,textTransform:'uppercase',fontWeight:600}}>Username</label>
          <input type="text" value={user.username} disabled style={{background:'#f5f5f5',cursor:'not-allowed'}} />
        </div>

        <div style={{marginBottom:24}}>
          <label style={{display:'block',color:'#666',fontSize:12,marginBottom:6,textTransform:'uppercase',fontWeight:600}}>Full Name</label>
          <input 
            type="text" 
            name="full_name"
            value={formData.full_name} 
            onChange={handleInputChange}
            disabled={!editing}
            style={{background: editing ? 'white' : '#f5f5f5', cursor: editing ? 'text' : 'not-allowed'}}
            placeholder="Enter your full name"
          />
        </div>

        <div style={{marginBottom:24}}>
          <label style={{display:'block',color:'#666',fontSize:12,marginBottom:6,textTransform:'uppercase',fontWeight:600}}>Email</label>
          <input 
            type="email" 
            name="email"
            value={formData.email} 
            onChange={handleInputChange}
            disabled={!editing}
            style={{background: editing ? 'white' : '#f5f5f5', cursor: editing ? 'text' : 'not-allowed'}}
            placeholder="your.email@university.edu"
          />
        </div>

        <div style={{marginBottom:24}}>
          <label style={{display:'block',color:'#666',fontSize:12,marginBottom:6,textTransform:'uppercase',fontWeight:600}}>Course/Major</label>
          <input 
            type="text" 
            name="course"
            value={formData.course} 
            onChange={handleInputChange}
            disabled={!editing}
            style={{background: editing ? 'white' : '#f5f5f5', cursor: editing ? 'text' : 'not-allowed'}}
            placeholder="e.g., Computer Science, Engineering"
          />
        </div>

        <div style={{marginBottom:24}}>
          <label style={{display:'block',color:'#666',fontSize:12,marginBottom:6,textTransform:'uppercase',fontWeight:600}}>Bio</label>
          <textarea 
            name="bio"
            value={formData.bio} 
            onChange={handleInputChange}
            disabled={!editing}
            style={{background: editing ? 'white' : '#f5f5f5', cursor: editing ? 'text' : 'not-allowed', minHeight:100, fontFamily:'inherit'}}
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Buttons */}
        <div style={{display:'flex',gap:12,marginTop:28}}>
          {!editing ? (
            <>
              <button onClick={() => setEditing(true)} style={{flex:1,background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',padding:14}}>✏️ Edit Profile</button>
              <button onClick={() => {onLogout();}} style={{flex:1,background:'linear-gradient(135deg, #f44 0%, #c22 100%)',padding:14}}>🚪 Logout</button>
            </>
          ) : (
            <>
              <button onClick={handleSave} style={{flex:1,background:'linear-gradient(135deg, #0f0 0%, #0a8 100%)',padding:14}}>💾 Save Changes</button>
              <button onClick={() => {setEditing(false); setFormData({...profileData})}} style={{flex:1,background:'linear-gradient(135deg, #f99 0%, #d66 100%)',padding:14}}>✕ Cancel</button>
            </>
          )}
        </div>

        {message && (
          <div style={{marginTop:16,padding:12,background:message.includes('Error')?'#ffe6e6':'#e6ffe6',color:message.includes('Error')?'#d32f2f':'#2e7d32',borderRadius:8,textAlign:'center',fontWeight:500}}>
            {message}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div style={{background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',borderRadius:12,padding:24,color:'white'}}>
        <h4 style={{marginTop:0,color:'white'}}>About FocusGuard</h4>
        <p style={{lineHeight:1.6,marginBottom:12}}>
          FocusGuard is an AI-powered student attentiveness monitor that helps you maintain deep focus during self-study sessions.
        </p>
        <h4 style={{color:'white',marginBottom:8}}>Key Features:</h4>
        <ul style={{lineHeight:1.8,paddingLeft:20}}>
          <li>🚨 Nap & Drowsiness Detection</li>
          <li>👀 Attentiveness Tracking</li>
          <li>😴 Fatigue Analysis</li>
          <li>📊 Personalized Analytics</li>
        </ul>
      </div>
    </div>
  );
}
