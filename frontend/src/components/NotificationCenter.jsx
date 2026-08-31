import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { createSocket } from '../services/socket.js';

export function NotificationCenter({ canSend=false }) {
  const [alerts,setAlerts]=useState([]),[message,setMessage]=useState(''),[error,setError]=useState(''),[sent,setSent]=useState('');
  const load=()=>api.get('/announcements').then(response=>setAlerts(response.data.data.announcements)).catch(requestError=>setError(requestError.response?.data?.message??'Unable to load alerts.'));
  useEffect(()=>{const socket=createSocket();socket.on('announcement:new',alert=>setAlerts(current=>[{...alert,is_read:false},...current.filter(item=>item.id!==alert.id)]));load();return()=>socket.disconnect();},[]);
  const markRead=async(id)=>{try{await api.post(`/announcements/${id}/read`);setAlerts(current=>current.map(alert=>alert.id===id?{...alert,is_read:true}:alert));}catch(requestError){setError(requestError.response?.data?.message??'Could not mark alert as read.');}};
  const send=async(event)=>{event.preventDefault();try{const response=await api.post('/announcements',{message});const alert=response.data.data.announcement;setAlerts(current=>[{...alert,is_read:false},...current.filter(item=>item.id!==alert.id)]);setMessage('');setSent('Alert sent.');}catch(requestError){setError(requestError.response?.data?.message??'Could not send alert.');}};
  const unread=alerts.filter(alert=>!alert.is_read).length;
  return <section className="notification-center"><details><summary>View received alerts {unread>0&&<b className="notification-count">{unread} new</b>}</summary><div className="notification-list">{alerts.length?alerts.map(alert=><article className={alert.is_read?'read-alert':'unread-alert'} key={alert.id}><div><b>{alert.bus_number?`${alert.bus_number} · `:'Transport office · '}</b>{alert.message}<small>{alert.author_name} · {new Date(alert.created_at).toLocaleString()}</small></div>{!alert.is_read&&<button type="button" className="text" onClick={()=>markRead(alert.id)}>Mark read</button>}</article>):<p>No alerts yet.</p>}</div></details>{canSend&&<details><summary>Send an alert</summary><form className="notification-send" onSubmit={send}><textarea required minLength="3" maxLength="500" value={message} onChange={event=>setMessage(event.target.value)} placeholder="Describe the delay, cancellation, or other important update."/><button>Send alert</button>{sent&&<p className="success">{sent}</p>}</form></details>}{error&&<p className="error">{error}</p>}</section>;
}
