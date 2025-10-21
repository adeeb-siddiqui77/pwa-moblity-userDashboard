// src/components/MechanicRequestsCarousel.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { initSocket, registerMechanic, on, off, emit } from '../services/socketClient';
import RequestCard from './RequestCard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const wrapKey = (jobId, attemptIndex) => `${jobId}:${attemptIndex}`;

export default function MechanicRequestsCarousel({ mechanicId, serverUrl }) {
  const [alerts, setAlerts] = useState([]); // [{key, jobId, attemptIndex, issue, eta, endTs, remaining, customer, phone, vehicle}]
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const tickRef = useRef(null);
  const swiperRef = useRef(null);
  const ringerRef = useRef(null);

  // init socket + register mechanic
  useEffect(() => {
    if (!mechanicId) return;
    const socket = initSocket(serverUrl, { mechanicId });

    const onConnect = () => {
      registerMechanic(mechanicId).then((ack) => {
        console.log('[carousel] registered:', ack);
      });
    };
    socket.on('connect', onConnect);

    const handleJobAlert = (payload) => {
      // allow additional fields for UI (customer/phone/vehicle) if you include them in payload
      // payload: { jobId, attemptIndex, issue, eta, expiresAt, slaSeconds, customerName, customerPhone, vehicleType }
      const key = wrapKey(payload.jobId, payload.attemptIndex);
      const endTs = payload.expiresAt
        ? new Date(payload.expiresAt).getTime()
        : Date.now() + (payload.slaSeconds || 120) * 1000;

      setAlerts((prev) => {
        if (prev.some((a) => a.key === key)) return prev; // dedupe
        const item = {
          key,
          jobId: payload.jobId,
          attemptIndex: payload.attemptIndex,
          issue: payload.issue || payload.ticketSummary || 'New Request',
          eta: payload.eta || '—',
          endTs,
          remaining: Math.max(0, Math.ceil((endTs - Date.now()) / 1000)),
          customerName: payload.customerName || '',
          customerPhone: payload.customerPhone || '',
          vehicleType: payload.vehicleType || ''
        };
        const next = [item, ...prev];
        return next;
      });
      setOpen(true);
      tryPlayRinger();
    };

    const handleExpired = (p) => {
      const key = wrapKey(p.jobId, p.attemptIndex);
      setAlerts((prev) => prev.filter((a) => a.key !== key));
    };

    on('job_alert', handleJobAlert);
    on('job_alert_expired', handleExpired);

    return () => {
      off('job_alert', handleJobAlert);
      off('job_alert_expired', handleExpired);
      socket.off('connect', onConnect);
    };
  }, [mechanicId, serverUrl]);

  // global tick for all countdowns
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setAlerts((prev) => {
        if (prev.length === 0) return prev;
        const now = Date.now();
        return prev.map((a) => ({
          ...a,
          remaining: Math.max(0, Math.ceil((a.endTs - now) / 1000))
        }));
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  // auto-close the sheet when empty
  useEffect(() => {
    if (alerts.length === 0) {
      setOpen(false);
      stopRinger();
      setActiveIndex(0);
    } else {
      setOpen(true);
    }
  }, [alerts.length]);

  // ringer helpers
  const tryPlayRinger = () => {
    if (!ringerRef.current) {
      ringerRef.current = new Audio('/ringtones/alert.mp3');
      ringerRef.current.loop = true;
      ringerRef.current.volume = 0.7;
    }
    ringerRef.current.play().catch(() => {});
  };
  const stopRinger = () => {
    if (ringerRef.current) {
      try {
        ringerRef.current.pause();
        ringerRef.current.currentTime = 0;
      } catch {}
    }
  };

  const formatRemaining = (s) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const onAccept = (a) => {
    emit('job_response', { jobId: a.jobId, attemptIndex: a.attemptIndex, response: 'accept' }, (ack) => {
      console.log('[carousel] accept ack', ack);
      removeAndAdvance(a.key);
    });
  };

  const onReject = (a) => {
    emit('job_response', { jobId: a.jobId, attemptIndex: a.attemptIndex, response: 'reject' }, (ack) => {
      console.log('[carousel] reject ack', ack);
      removeAndAdvance(a.key);
    });
  };

  const removeAndAdvance = (key) => {
    setAlerts((prev) => {
      const idx = prev.findIndex((x) => x.key === key);
      const next = prev.filter((x) => x.key !== key);
      // auto-next logic: if we removed the active slide,
      // keep the same index (which now points to the next item),
      // or clamp to last item if needed
      if (idx === activeIndex && swiperRef.current) {
        const s = swiperRef.current;
        // move to same index (now new item), or previous if out of range
        const target = Math.min(activeIndex, Math.max(0, next.length - 1));
        setTimeout(() => s.slideTo(target), 0);
        setActiveIndex(target);
      }
      return next;
    });
  };

  if (!open) return null;

  return (
    <div style={sheetWrap}>
      <div style={sheetHeader}>
        <div style={{ fontWeight: 700 }}>Requests</div>
        <button onClick={() => setOpen(false)} style={xBtn}>✕</button>
      </div>

      <div style={sheetBody}>
        <Swiper
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          slidesPerView={1}
          spaceBetween={16}
        >
          {alerts.map((a) => (
            <SwiperSlide key={a.key}>
              <RequestCard
                title={a.issue}
                eta={a.eta}
                timer={formatRemaining(a.remaining)}
                customerName={a.customerName}
                customerPhone={a.customerPhone}
                vehicleType={a.vehicleType}
                disabled={a.remaining <= 0}
                onAccept={() => onAccept(a)}
                onReject={() => onReject(a)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* footer strip with arrows + pagination  */}
      <div style={footerWrap}>
        <button
          onClick={() => swiperRef.current && swiperRef.current.slidePrev()}
          style={navBtn}
          aria-label="Prev"
        >
          <ArrowBackIcon />
        </button>

        <div style={pagerText}>
          {alerts.length ? `${activeIndex + 1}/${alerts.length}` : '0/0'}
        </div>

        <button
          onClick={() => swiperRef.current && swiperRef.current.slideNext()}
          style={navBtn}
          aria-label="Next"
        >
          <ArrowForwardIcon />
        </button>
      </div>
    </div>
  );
}

/* ---------------- styles (inline to keep it self-contained) ---------------- */

const sheetWrap = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(180deg, #fff 0%, #FFD39F 100%)',
  boxShadow: '0 -8px 24px rgba(0,0,0,0.2)',
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: '12px 12px 12px',
  zIndex: 9999
};

const sheetHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 6px 10px 6px'
};

const xBtn = {
  background: 'transparent',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  lineHeight: 1
};

const sheetBody = {
  padding: '0 4px 8px 4px'
};

const footerWrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
  paddingBottom: 6
};

const navBtn = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: '#fff',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  fontSize: 20,
  cursor: 'pointer'
};

const pagerText = {
  fontWeight: 700
};
