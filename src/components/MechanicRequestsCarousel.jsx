import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useRequests } from '../store/RequestsProvider';
import toast from "react-hot-toast";


import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

// simple inline styles so you don't need extra CSS files
const sheetWrap = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  background: 'linear-gradient(180deg, #FFFFFF 0%, #FFD39F 100%)',
  boxShadow: '0 -8px 24px rgba(0,0,0,0.2)',
  padding: '12px'
};
const headerRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 4px 10px 4px'
};
const closeBtn = {
  height: 32,
  width: 32,
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: '#4B5563',
  fontSize: 18,
  lineHeight: 1,
};
const footerRow = {
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
const pagerText = { fontWeight: 700, color: '#1F2937' };

export default function MechanicRequestsCarousel() {
  const { items, accept, reject, format, removeItem } = useRequests();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);
  const ringerRef = useRef(null);

  // open/close when items change
  useEffect(() => {
    if (items.length > 0) {
      setOpen(true);
      tryPlayRinger();

      console.log("items", items)
    } else {
      setOpen(false);
      stopRinger();
      setActiveIndex(0);
      console.log("items", items)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const tryPlayRinger = () => {
    if (!ringerRef.current) {
      ringerRef.current = new Audio('/ringtones/alert.mp3');
      ringerRef.current.loop = true;
      ringerRef.current.volume = 0.7;
    }
    ringerRef.current.play().catch(() => { });
  };

  const stopRinger = () => {
    if (!ringerRef.current) return;
    try { ringerRef.current.pause(); ringerRef.current.currentTime = 0; } catch { }
  };

  const autoNextAfterRemove = () => {
    // Swiper recalculates slides; slide to a valid index next tick
    setTimeout(() => {
      if (!swiperRef.current) return;
      const totalAfterRemoval = items.length - 1;
      const target = Math.min(activeIndex, Math.max(0, totalAfterRemoval - 1));
      swiperRef.current.slideTo(target);
      setActiveIndex(target);
    }, 0);
  };

  if (!open) return null;

  return (
    <div style={sheetWrap}>
      {/* Header */}
      <div style={headerRow}>
        <div style={{ fontWeight: 700, color: '#1F2937' }}>Requests</div>
        <button aria-label="Close" style={closeBtn} onClick={() => setOpen(false)}>✕</button>
      </div>

      {/* Carousel */}
      <div style={{ padding: '0 4px 8px 4px' }}>
        <Swiper
          onSwiper={(s) => (swiperRef.current = s)}
          onSlideChange={(s) => setActiveIndex(s.activeIndex)}
          slidesPerView={1}
          spaceBetween={16}
        >
          {items.map((a) => (
            <SwiperSlide key={a.key}>
              <RequestCard
                data={a}
                format={format}
                stopRinger = {stopRinger}
                onAccept={() =>
                  accept(a, (ack) => {
                    autoNextAfterRemove();
                    if (ack?.ok) {
                      toast.success("Request accepted successfully");
                    } else {
                      toast.error(ack?.message || "Failed to accept request");
                    }
                  })
                }
                onReject={() =>
                  reject(a, (ack) => {
                    autoNextAfterRemove();
                    if (ack?.ok) {
                      toast.success("Request rejected");
                    } else {
                      toast.error(ack?.message || "Failed to reject request");
                    }
                  })
                }


              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Footer (arrows + pagination) */}
      <div style={footerRow}>
        <button
          aria-label="Prev"
          style={navBtn}
          onClick={() => swiperRef.current && swiperRef.current.slidePrev()}
        > <ArrowBackIcon /> </button>

        <div style={pagerText}>
          {items.length ? `${activeIndex + 1}/${items.length}` : '0/0'}
        </div>

        <button
          aria-label="Next"
          style={navBtn}
          onClick={() => swiperRef.current && swiperRef.current.slideNext()}
        > <ArrowForwardIcon /> </button>
      </div>
    </div>
  );
}

/* ---------------- Card (pure CSS styles inline) ---------------- */

const cardWrap = {
  background: '#fff',
  borderRadius: 12,
  padding: 14,
  boxShadow: '0 10px 24px rgba(0,0,0,0.15)'
};
const cardHeader = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8
};
const cardTitle = { fontWeight: 800, fontSize: 18, color: '#111827' };
const timerPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 20,
  background: '#F5F5F7',
  fontWeight: 700,
  fontSize: 14,
  color: '#111827'
};
const etaRow = { margin: '4px 0 10px 0' };
const etaLabel = { color: '#B22222', fontWeight: 700, marginRight: 6 };
const etaText = { fontWeight: 600 };
const infoRow = { margin: '6px 0', fontSize: 14, color: '#111827' };
const infoMuted = { color: '#6B7280' };
const ctaRow = { display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' };
const btn = {
  flex: 1,
  border: 'none',
  borderRadius: 8,
  padding: '5px',
  fontSize: 12,
  fontWeight: 100,
  cursor: 'pointer',
  transition: 'transform .05s ease, box-shadow .1s ease, opacity .2s ease'
};
const btnReject = { ...btn, background: '#A10F0F', color: '#fff' };
const btnAccept = { ...btn, background: '#268F00', color: '#fff' };
const btnDisabled = { opacity: 0.6, cursor: 'not-allowed', boxShadow: 'none' };


function Spinner({ size = 18 }) {
  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
  };
  return <div style={style} />;
}

// Add global keyframe on first load
if (typeof document !== 'undefined' && !document.getElementById('carousel-spinner-style')) {
  const style = document.createElement('style');
  style.id = 'carousel-spinner-style';
  style.innerHTML = `
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}


function RequestCard({ data, format, onAccept, onReject , stopRinger  }) {
  const [processing, setProcessing] = useState(false);
  const disabled = processing || Number(data.remaining || 0) <= 0;

  const handleAccept = () => {
    if (disabled) return;
    setProcessing(true);
    stopRinger();

    // pass a wrapped callback to restore UI if needed
    onAccept({
      onFail: () => setProcessing(false),
    });
  };

  const handleReject = () => {
    if (disabled) return;
    stopRinger();
    setProcessing(true);

    onReject({
      onFail: () => setProcessing(false),
    });
  };

  return (
    <div style={cardWrap}>
      <div style={cardHeader}>
        <div style={cardTitle}>{data.issue || 'Request'}</div>

        <div style={timerPill}>
          <span aria-hidden>⏱</span>
          {format(data.remaining)}
        </div>
      </div>

      <div style={etaRow}>
        <span style={etaLabel}>ETA :</span>
        <span style={etaText}>{data.eta || '—'} min</span>
      </div>

      {data.customerName && (
        <div style={infoRow}><span style={infoMuted}>Vehicle Number :</span> <strong>{data.customerName}</strong></div>
      )}

      {data.customerPhone && (
        <div style={infoRow}>
          <span style={infoMuted}>Mobile No. :</span>
          <strong style={{ marginLeft: 6 }}>{data.customerPhone}</strong>
        </div>
      )}

      {data.vehicleType && (
        <div style={infoRow}>
          <span style={infoMuted}>Vehicle Type :</span>
          <strong style={{ marginLeft: 6 }}>{data.vehicleType}</strong>
        </div>
      )}

      {/* CTA Buttons */}
      <div style={ctaRow}>

        {/* Reject Button */}
        <button
          onClick={handleReject}
          disabled={disabled}
          style={disabled ? { ...btnReject, ...btnDisabled } : btnReject}
        >
          {processing ? (
            <Spinner size={14} />
          ) : (
            <CloseIcon />
          )}
        </button>

        {/* Accept Button */}
        <button
          onClick={handleAccept}
          disabled={disabled}
          style={disabled ? { ...btnAccept, ...btnDisabled } : btnAccept}
        >
          {processing ? (
            <Spinner size={14} />
          ) : (
            <DoneIcon />
          )}
        </button>
      </div>
    </div>
  );
}

