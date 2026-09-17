import React from 'react';

export default function CameraPreview({ videoRef }){
  return (
    <div>
      <video ref={videoRef} autoPlay muted playsInline style={{width:'100%'}} />
    </div>
  );
}
