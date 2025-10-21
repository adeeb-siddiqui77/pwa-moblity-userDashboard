// src/components/MechanicAlertModal.jsx
import React, { useEffect, useState, useRef } from 'react';
import { initSocket, registerMechanic, getSocket, on, off, emit } from '../services/socketClient';

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  card: { width: 360, background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 6px 18px rgba(0,0,0,0.2)' },
  header: { fontSize: 18, fontWeight: 700, marginBottom: 8 },
  timer: { fontSize: 24, fontWeight: 800, textAlign: 'center', margin: '12px 0' },
  buttons: { display: 'flex', gap: 10, justifyContent: 'center' },
  btn: { padding: '10px 16px', fontSize: 14, borderRadius: 6, cursor: 'pointer' }
};

export default function MechanicAlertModal({ mechanicId, serverUrl }) {
  const [connected, setConnected] = useState(false);
  const [alert, setAlert] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [responding, setResponding] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!mechanicId) {
      console.warn('MechanicAlertModal: mechanicId not provided');
      return;
    }

    console.log('MechanicAlertModal: initSocket with mechanicId=', mechanicId, 'serverUrl=', serverUrl);
    const socket = initSocket(serverUrl, { mechanicId });

    // wait until socket connects, then register
    const onConnect = () => {
      setConnected(true);
      console.log('MechanicAlertModal: socket connected, registering mechanic', mechanicId);
      registerMechanic(mechanicId).then((ack) => {
        console.log('MechanicAlertModal: registerMechanic ack ->', ack);
      }).catch(err => {
        console.error('MechanicAlertModal: register failed', err);
      });
    };
    const onDisconnect = () => {
      setConnected(false);
      console.log('MechanicAlertModal: socket disconnected');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    const handleJobAlert = (payload) => {
      console.log('MechanicAlertModal: job_alert received', payload);
      setAlert(payload);
      const endTs = payload.expiresAt ? new Date(payload.expiresAt).getTime() : (Date.now() + (payload.slaSeconds || 120) * 1000);
      setRemaining(Math.max(0, Math.ceil((endTs - Date.now()) / 1000)));

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const newRem = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
        setRemaining(newRem);
        if (newRem <= 0 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }, 1000);
    };

    const handleExpired = (p) => {
      console.log('MechanicAlertModal: job_alert_expired', p);
      if (alert && p.jobId === alert.jobId && p.attemptIndex === alert.attemptIndex) {
        setAlert(null);
        setRemaining(0);
      }
    };

    on('job_alert', handleJobAlert);
    on('job_alert_expired', handleExpired);

    return () => {
      off('job_alert', handleJobAlert);
      off('job_alert_expired', handleExpired);
      try {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
      } catch (e) {}
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mechanicId, serverUrl]);

  if (!alert) return null;

  const formatRemaining = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(Math.floor(s % 60)).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleResponse = (resp) => {
    if (!alert || responding) return;
    setResponding(true);
    emit('job_response', { jobId: alert.jobId, attemptIndex: alert.attemptIndex, response: resp }, (ack) => {
      console.log('MechanicAlertModal: job_response ack', ack);
      setResponding(false);
      setAlert(null);
      setRemaining(0);
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>New Job Alert</div>
        <div><strong>Issue:</strong> {alert.issue || alert.ticketSummary}</div>
        <div><strong>ETA:</strong> {alert.eta || 'N/A'}</div>
        <div style={styles.timer}>{formatRemaining(remaining)}</div>

        <div style={styles.buttons}>
          <button disabled={responding || remaining <= 0} style={{ ...styles.btn, background: '#0b8457', color: '#fff', border: 'none' }} onClick={() => handleResponse('accept')}>
            {responding ? 'Processing...' : 'Accept'}
          </button>
          <button disabled={responding || remaining <= 0} style={{ ...styles.btn, background: '#fff', color: '#333', border: '1px solid #ccc' }} onClick={() => handleResponse('reject')}>
            {responding ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
