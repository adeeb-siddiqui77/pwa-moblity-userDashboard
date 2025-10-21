// src/components/MechanicAlertsCenter.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { initSocket, registerMechanic, on, off, emit } from '../services/socketClient';

const wrapKey = (jobId, attemptIndex) => `${jobId}:${attemptIndex}`;

export default function MechanicAlertsCenter({ mechanicId, serverUrl }) {
  const [alerts, setAlerts] = useState([]); // [{key, jobId, attemptIndex, issue, eta, expiresAt, slaSeconds}]
  const intervalsRef = useRef(new Map());   // key -> intervalId
  const ringerRef = useRef(null);

  // Init socket & register mechanic
  useEffect(() => {
    if (!mechanicId) {
      console.warn('MechanicAlertsCenter: mechanicId missing');
      return;
    }
    const socket = initSocket(serverUrl, { mechanicId });
    const onConnect = () => {
      registerMechanic(mechanicId).then(ack => {
        console.log('[alerts] register ack:', ack);
      });
    };
    socket.on('connect', onConnect);

    const handleJobAlert = (payload) => {
      // payload: { jobId, attemptIndex, issue, eta, expiresAt, slaSeconds }
      const key = wrapKey(payload.jobId, payload.attemptIndex);
      setAlerts((prev) => {
        if (prev.some(a => a.key === key)) return prev; // dedupe
        const endTs = payload.expiresAt ? new Date(payload.expiresAt).getTime() : (Date.now() + (payload.slaSeconds || 120) * 1000);
        return [
          {
            ...payload,
            key,
            endTs,
            remaining: Math.max(0, Math.ceil((endTs - Date.now()) / 1000)),
            status: 'pending'
          },
          ...prev
        ];
      });
      tryPlayRinger();
      startTimer(key, payload);
    };

    const handleExpired = (p) => {
      // p: { jobId, attemptIndex }
      const key = wrapKey(p.jobId, p.attemptIndex);
      clearTimer(key);
      setAlerts(prev => prev.filter(a => a.key !== key));
    };

    on('job_alert', handleJobAlert);
    on('job_alert_expired', handleExpired);

    return () => {
      off('job_alert', handleJobAlert);
      off('job_alert_expired', handleExpired);
      socket.off('connect', onConnect);
      // clear all timers
      for (const id of intervalsRef.current.values()) clearInterval(id);
      intervalsRef.current.clear();
    };
  }, [mechanicId, serverUrl]);

  // Timer per alert
  const startTimer = (key, payload) => {
    clearTimer(key);
    const endTs = payload.expiresAt ? new Date(payload.expiresAt).getTime() : (Date.now() + (payload.slaSeconds || 120) * 1000);
    const id = setInterval(() => {
      setAlerts(prev => {
        const next = prev.map(a => {
          if (a.key !== key) return a;
          const remaining = Math.max(0, Math.ceil((endTs - Date.now()) / 1000));
          return { ...a, remaining };
        });
        return next;
      });
    }, 1000);
    intervalsRef.current.set(key, id);
  };

  const clearTimer = (key) => {
    const id = intervalsRef.current.get(key);
    if (id) clearInterval(id);
    intervalsRef.current.delete(key);
  };

  // Ringer helpers
  const tryPlayRinger = () => {
    if (!ringerRef.current) {
      ringerRef.current = new Audio('/ringtones/alert.mp3'); // put a file here or change path
      ringerRef.current.loop = true;
      ringerRef.current.volume = 0.7;
    }
    ringerRef.current.play().catch(() => {
      // likely blocked until user interacts — that’s OK
    });
  };
  const stopRingerIfNoAlerts = () => {
    setTimeout(() => {
      if (alerts.length === 0 && ringerRef.current) {
        try { ringerRef.current.pause(); ringerRef.current.currentTime = 0; } catch {}
      }
    }, 10);
  };

  // Accept/Reject handlers
  const respond = (a, response) => {
    emit('job_response', { jobId: a.jobId, attemptIndex: a.attemptIndex, response }, (ack) => {
      console.log('[alerts] job_response ack:', ack);
      // always clear timer and remove card (server will move to next if needed)
      clearTimer(a.key);
      setAlerts(prev => prev.filter(x => x.key !== a.key));
      stopRingerIfNoAlerts();
      if (!ack?.ok) {
        // optionally show a toast
        // alert(`Server: ${ack?.message || 'Response not accepted'}`);
      }
    });
  };

  // Simple stack UI
  return (
    <div style={containerStyle}>
      {alerts.map((a) => (
        <AlertCard
          key={a.key}
          alert={a}
          onAccept={() => respond(a, 'accept')}
          onReject={() => respond(a, 'reject')}
        />
      ))}
    </div>
  );
}

// ---------------- UI bits ----------------

const containerStyle = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  zIndex: 9999,
  maxWidth: 380
};

function AlertCard({ alert, onAccept, onReject }) {
  const remaining = Number(alert.remaining || 0);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const disabled = remaining <= 0;

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>New Job Alert</div>
      <div style={{ marginBottom: 4 }}>
        <strong>Issue:</strong> {alert.issue || alert.ticketSummary || 'N/A'}
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>ETA:</strong> {alert.eta || 'N/A'}
      </div>

      <div style={timerStyle}>
        {mm}:{ss}
      </div>

      <div style={buttonsRow}>
        <button
          onClick={onAccept}
          disabled={disabled}
          style={{ ...btnStyle, background: '#0b8457', color: '#fff', border: 'none' }}
        >
          Accept
        </button>
        <button
          onClick={onReject}
          disabled={disabled}
          style={{ ...btnStyle, background: '#fff', color: '#333', border: '1px solid #ccc' }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  borderRadius: 10,
  padding: 14,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
};

const timerStyle = {
  fontSize: 22,
  fontWeight: 800,
  textAlign: 'center',
  margin: '10px 0'
};

const buttonsRow = {
  display: 'flex',
  gap: 10,
  justifyContent: 'center'
};

const btnStyle = {
  padding: '10px 16px',
  fontSize: 14,
  borderRadius: 8,
  cursor: 'pointer'
};
