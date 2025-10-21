// src/store/RequestsProvider.jsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { initSocket, registerMechanic, on, off, emit } from '../services/socketClient';

const RequestsContext = createContext(null);
const keyOf = (jobId, attemptIndex) => `${jobId}:${attemptIndex}`;
const STORAGE_KEY = 'mechanic_requests_v1';

export function RequestsProvider({ mechanicId, serverUrl, children }) {
  const [items, setItems] = useState([]); // [{key, jobId, attemptIndex, issue, eta, endTs, remaining, status, ...}]
  const socketReadyRef = useRef(false);
  const tickRef = useRef(null);

  // load from localStorage on mount (drop expired)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const now = Date.now();
        const restored = (parsed || [])
          .map(it => ({
            ...it,
            remaining: Math.max(0, Math.ceil((it.endTs - now) / 1000))
          }))
          .filter(it => it.status === 'pending' ? it.endTs > now : true); // drop pending that are already past
        setItems(restored);
      }
    } catch {}
  }, []);

  // persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // init socket + register + listeners (once)
  useEffect(() => {
    if (!mechanicId || socketReadyRef.current) return;
    const socket = initSocket(serverUrl, { mechanicId });

    const onConnect = () => {
      registerMechanic(mechanicId).then(() => {
        socketReadyRef.current = true;
      });
    };
    socket.on('connect', onConnect);

    const handleJobAlert = (p) => {
      const k = keyOf(p.jobId, p.attemptIndex);
      const endTs = p.expiresAt
        ? new Date(p.expiresAt).getTime()
        : Date.now() + (p.slaSeconds || 120) * 1000;

      setItems(prev => {
        if (prev.some(x => x.key === k)) return prev; // dedupe
        const item = {
          key: k,
          jobId: p.jobId,
          attemptIndex: p.attemptIndex,
          issue: p.issue || p.ticketSummary || 'New Request',
          eta: p.eta || '—',
          customerName: p.customerName || '',
          customerPhone: p.customerPhone || '',
          vehicleType: p.vehicleType || '',
          endTs,
          remaining: Math.max(0, Math.ceil((endTs - Date.now()) / 1000)),
          status: 'pending'
        };
        return [item, ...prev];
      });
    };

    const handleExpired = (p) => {
      const k = keyOf(p.jobId, p.attemptIndex);
      setItems(prev => prev.filter(it => it.key !== k)); // remove expired from list
    };

    on('job_alert', handleJobAlert);
    on('job_alert_expired', handleExpired);

    return () => {
      off('job_alert', handleJobAlert);
      off('job_alert_expired', handleExpired);
      socket.off('connect', onConnect);
    };
  }, [mechanicId, serverUrl]);

  // global 1s tick to update remaining & auto-expire locally (in case missed server event)
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
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
            // auto-remove when expired
            continue;
          }
          next.push({ ...it, remaining });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, []);

  // actions
  const accept = (item, cb) => {
    emit('job_response', { jobId: item.jobId, attemptIndex: item.attemptIndex, response: 'accept' }, (ack) => {
      // remove on any ack; server is source of truth
      setItems(prev => prev.filter(x => x.key !== item.key));
      if (cb) cb(ack);
    });
  };
  const reject = (item, cb) => {
    emit('job_response', { jobId: item.jobId, attemptIndex: item.attemptIndex, response: 'reject' }, (ack) => {
      // remove on any ack; server will advance to next
      setItems(prev => prev.filter(x => x.key !== item.key));
      if (cb) cb(ack);
    });
  };

  const value = {
    items,                 // array of current visible requests (pending until accept/reject/expire)
    accept,
    reject,
    format: (s) => {
      const mm = String(Math.floor(s / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      return `${mm}:${ss}`;
    }
  };

  return (
    <RequestsContext.Provider value={value}>
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const ctx = useContext(RequestsContext);
  if (!ctx) throw new Error('useRequests must be used within RequestsProvider');
  return ctx;
}
