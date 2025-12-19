// src/store/RequestsProvider.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initSocket, registerMechanic, on, off, emit } from '../services/socketClient';

const RequestsContext = createContext(null);
const STORAGE_KEY = 'mechanic_requests_v1';
const keyOf = (jobId, attemptIndex) => `${jobId}:${attemptIndex}`;

export function RequestsProvider({ mechanicId, serverUrl, children }) {
  const [items, setItems] = useState([]);
  const socketReadyRef = useRef(false);
  const tickRef = useRef(null);

  // ---------------- LOAD FROM STORAGE ----------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const now = Date.now();
      const restored = parsed
        .map(it => ({
          ...it,
          remaining: Math.max(0, Math.ceil((it.endTs - now) / 1000))
        }))
        .filter(it =>
          it.status === 'pending'
            ? it.endTs > now
            : true
        );

      setItems(restored);
    } catch {}
  }, []);

  // ---------------- SAVE TO STORAGE ----------------
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // ---------------- SOCKET INITIALIZATION ----------------
  useEffect(() => {
    if (!mechanicId || socketReadyRef.current) return;

    const socket = initSocket(serverUrl, { mechanicId });

    socket.on('connect', () => {
      registerMechanic(mechanicId).then(() => {
        socketReadyRef.current = true;
      });
    });

    const handleJobAlert = (p) => {
      const key = keyOf(p.jobId, p.attemptIndex);

      // Compute expiry
      const endTs = p.expiresAt
        ? new Date(p.expiresAt).getTime()
        : Date.now() + (p.slaSeconds || 120) * 1000;

      setItems(prev => {
        if (prev.some(x => x.key === key)) return prev;

        return [
          {
            key,
            jobId: p.jobId,
            attemptIndex: p.attemptIndex,
            issue: p.issue || p.ticketSummary || 'New Request',
            eta: p.eta || '—',
            customerName: p.vehicleNumber || '',
            customerPhone: p.customerPhone || '',
            vehicleType: p.vehicleType || '',
            endTs,
            remaining: Math.max(0, Math.ceil((endTs - Date.now()) / 1000)),
            status: 'pending'
          },
          ...prev
        ];
      });
    };

    const handleExpired = (p) => {
      const key = keyOf(p.jobId, p.attemptIndex);
      setItems(prev => prev.filter(it => it.key !== key));
    };

    on('job_alert', handleJobAlert);
    on('job_alert_expired', handleExpired);

    return () => {
      off('job_alert', handleJobAlert);
      off('job_alert_expired', handleExpired);
      socket.off('connect');
    };
  }, [mechanicId, serverUrl]);

  // ---------------- GLOBAL TIMER (every 1s) ----------------
  useEffect(() => {
    tickRef.current = setInterval(() => {
      const now = Date.now();
      setItems(prev => {
        const next = [];
        for (const it of prev) {
          if (it.status !== 'pending') {
            next.push(it);
            continue;
          }

          const remaining = Math.max(0, Math.ceil((it.endTs - now) / 1000));

          if (remaining <= 0) {
            // auto-remove
            continue;
          }

          next.push({ ...it, remaining });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, []);

  // ---------------- NEW ACCEPT / REJECT LOGIC ----------------
  

  const accept = (item, cb) => {
  emit(
    "job_response",
    { jobId: item.jobId, attemptIndex: item.attemptIndex, response: "accept" },
    (ack) => {
      // Remove immediately from UI
      setItems((prev) => prev.filter((x) => x.key !== item.key));

      if (cb) cb(ack); // pass ack up to UI
    }
  );
};

const reject = (item, cb) => {
  emit(
    "job_response",
    { jobId: item.jobId, attemptIndex: item.attemptIndex, response: "reject" },
    (ack) => {
      setItems((prev) => prev.filter((x) => x.key !== item.key));

      if (cb) cb(ack);
    }
  );
};


  // ---------------- TIME FORMATTER ----------------
  const formatRemaining = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <RequestsContext.Provider
      value={{
        items,
        accept,
        reject,
        format: formatRemaining
      }}
    >
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error('useRequests must be used inside RequestsProvider');
  return ctx;
}
