// src/components/MechanicAlertsCenter.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { initSocket, registerMechanic, on, off, emit } from '../services/socketClient';

const wrapKey = (jobId, attemptIndex) => `${jobId}:${attemptIndex}`;

export default function MechanicAlertsCenter({ mechanicId, serverUrl }) {
  const [alerts, setAlerts] = useState([]); // [{key, jobId, attemptIndex, issue, eta, endTs, slaSeconds, remaining, status}]
  const intervalsRef = useRef(new Map());   // key -> intervalId
  const ringerRef = useRef(null);
  const alertsRef = useRef([]); // keep latest alerts for sync in callbacks

  // keep alertsRef in sync with alerts state
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

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
      // payload: { jobId, attemptIndex, issue, eta, expiresAt, slaSeconds, serverTime }
      const key = wrapKey(payload.jobId, payload.attemptIndex);

      // compute corrected endTs using serverTime to avoid clock skew
      const clientNow = Date.now();
      const serverNow = payload.serverTime ? Date.parse(payload.serverTime) : null;
      const rawEndTs = payload.expiresAt ? Date.parse(payload.expiresAt) : (clientNow + (payload.slaSeconds || 120) * 1000);
      const correctedEndTs = serverNow ? (rawEndTs - (clientNow - serverNow)) : rawEndTs;

      setAlerts((prev) => {
        if (prev.some(a => a.key === key)) return prev; // dedupe
        const newAlert = {
          ...payload,
          key,
          endTs: correctedEndTs,
          remaining: Math.max(0, Math.ceil((correctedEndTs - Date.now()) / 1000)),
          status: 'pending'
        };
        return [ newAlert, ...prev ];
      });

      tryPlayRinger();
      startTimer(key, correctedEndTs);
    };

    const handleExpired = (p) => {
      const key = wrapKey(p.jobId, p.attemptIndex);
      clearTimer(key);
      setAlerts(prev => {
        const next = prev.filter(a => a.key !== key);
        // stop ringer if none left (use alertsRef after state update via setTimeout)
        setTimeout(() => {
          if (!alertsRef.current || alertsRef.current.length === 0) stopRinger();
        }, 0);
        return next;
      });
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
      stopRinger();
    };
  }, [mechanicId, serverUrl]);

  // Timer per alert
  const startTimer = (key, endTs) => {
    clearTimer(key);
    const id = setInterval(() => {
      setAlerts(prev => {
        const next = prev.map(a => {
          if (a.key !== key) return a;
          const remaining = Math.max(0, Math.ceil((a.endTs - Date.now()) / 1000));
          // if expired, we can optionally clear timer and remove; but let server emit expired
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
      ringerRef.current = new Audio('/ringtones/alert.mp3'); // change path if needed
      ringerRef.current.loop = true;
      ringerRef.current.volume = 0.7;
    }
    // Browser may block autoplay; ignore rejection
    ringerRef.current.play().catch(() => {});
  };
  const stopRinger = () => {
    if (ringerRef.current) {
      try { ringerRef.current.pause(); ringerRef.current.currentTime = 0; } catch {}
    }
  };

  // Accept/Reject handlers
  const respond = (a, response) => {
    emit('job_response', { jobId: a.jobId, attemptIndex: a.attemptIndex, response }, (ack) => {
      console.log('[alerts] job_response ack:', ack);
      // always clear timer and remove card (server will move to next if needed)
      clearTimer(a.key);
      setAlerts(prev => {
        const next = prev.filter(x => x.key !== a.key);
        // stop ringer if no alerts left
        setTimeout(() => {
          if (!alertsRef.current || alertsRef.current.length === 0) stopRinger();
        }, 0);
        return next;
      });
      if (!ack?.ok) {
        // optionally show a toast or alert here
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
