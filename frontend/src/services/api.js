// use a relative path by default so CRA's dev server proxy can forward requests
// and avoid CORS/network errors. In production set REACT_APP_API_URL if needed.
const BASE = process.env.REACT_APP_API_URL || '/api';

async function doFetch(url, opts){
  try{
    const res = await fetch(url, opts);
    if (!res.ok){
      let body;
      try{ body = await res.json(); }catch(_){ body = await res.text(); }
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${JSON.stringify(body)}`);
    }
    return res.json();
  }catch(e){
    // normalize network failures into a friendlier error message
    const msg = e.message || String(e);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      throw new Error('Unable to connect to server. Please make sure the backend is running.');
    }
    throw new Error(`NetworkError: ${msg}`);
  }
}

export async function register(username, password){
  return doFetch(`${BASE}/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password})});
}

export async function login(username, password){
  return doFetch(`${BASE}/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username,password})});
}

export async function getSessions(userId){
  return doFetch(`${BASE}/sessions/${userId}`);
}

export async function getUser(userId){
  return doFetch(`${BASE}/user/${userId}`);
}

export async function updateUser(userId, data){
  return doFetch(`${BASE}/user/${userId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)});
}
