import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend } from 'chart.js';

Chart.register(LineElement, PointElement, CategoryScale, LinearScale, TimeScale, Tooltip, Legend);

export default function SessionChart({ points, alerts=[] }){
  const labels = points.map(p=>new Date(p.t).toLocaleTimeString());
  // main score dataset
  const scoreData = points.map(p=>p.score);
  // alert points: place a point where an alert timestamp matches the point timestamp (within 500ms)
  const alertData = points.map(p=> {
    const a = alerts.find(x => Math.abs(x.t - p.t) < 500);
    return a ? p.score : null;
  });

  const data = {
    labels,
    datasets: [
      { label: 'Focus Score', data: scoreData, borderColor: '#06f', tension: 0.2, fill:false, pointRadius: 2 },
      { label: 'Alerts', data: alertData, borderColor: '#e74c3c', backgroundColor: '#e74c3c', pointRadius: 6, showLine:false }
    ]
  };
  const opts = { plugins:{legend:{display:true}}, scales:{y:{min:0,max:100}} };
  return <div style={{height:300}}><Line data={data} options={opts} /></div>;
}
