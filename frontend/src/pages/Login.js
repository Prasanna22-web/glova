import React, { useState } from 'react';
import { register, login } from '../services/api';

export default function Login({ onLogin }){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [err, setErr] = useState(null);

  async function submit(e){
    e.preventDefault();
    try{
      const res = mode==='login' ? await login(username,password) : await register(username,password);
      if (res.msg === 'ok'){
        onLogin(res.user || {username});
      } else { setErr(JSON.stringify(res)); }
    }catch(e){
      const msg = String(e);
      // convert generic fetch failure into something user-friendly
      if (msg.includes('NetworkError')) {
        setErr('Unable to reach the server. Please make sure the backend is running and try again.');
      } else {
        setErr(msg);
      }
    }
  }

  return (
    <div className="login-container">
      <form className="login-card" onSubmit={submit}>
        {/* FocusGuard Branding */}
        <div className="login-brand">
          <div style={{fontSize:40,marginBottom:12}}>👁️</div>
          <h1>FocusGuard</h1>
          <p>Stay focused, stay aware</p>
        </div>

        {/* Form Title */}
        <h2 className="login-title">{mode==='login' ? 'Welcome Back' : 'Create Your Account'}</h2>

        {/* Username Field */}
        <div className="login-field" style={{marginBottom:20}}>
          <label>Username</label>
          <input
            placeholder='Enter your username'
            value={username}
            onChange={e=>setUsername(e.target.value)}
            required
          />
        </div>

        {/* Password Field */}
        <div className="login-field" style={{marginBottom:28}}>
          <label>Password</label>
          <input
            placeholder='Enter your password'
            type='password'
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
        </div>

        {/* Submit Button */}
        <button type='submit' className="login-submit">{mode==='login' ? 'Login' : 'Register'}</button>

        {/* Toggle Mode Button */}
        <div className="login-toggle">
          <button type='button' onClick={()=>setMode(mode==='login'?'register':'login')}>
            {mode==='login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>

        {/* Error Message */}
        {err && <div className="login-error">{err}</div>}
      </form>
    </div>
  );
}
