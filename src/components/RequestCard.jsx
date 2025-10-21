// src/components/RequestCard.jsx
import React from 'react';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

export default function RequestCard({
  title,
  eta,
  customerName,
  customerPhone,
  vehicleType,
  timer,
  disabled,
  onAccept,
  onReject
}) {
  return (
    <div style={card}>
      <div style={headerRow}>
        <div style={titleStyle}>{title || 'Request'}</div>
        <div style={timerPill}>
          <span role="img" aria-label="timer" style={{ marginRight: 6 }}>⏱</span>
          {timer || '02:00'}
        </div>
      </div>

      <div style={subRow}>
        <span style={etaLabel}>ETA :</span>
        <span style={etaText}>{eta || '—'}</span>
      </div>

      {customerName ? (
        <div style={infoRow}><strong>{customerName}</strong></div>
      ) : null}

      {customerPhone ? (
        <div style={infoRow}>
          <span style={{ opacity: 0.7 }}>Mobile No. :</span> <strong style={{ marginLeft: 6 }}>{customerPhone}</strong>
        </div>
      ) : null}

      {vehicleType ? (
        <div style={infoRow}>
          <span style={{ opacity: 0.7 }}>Vehicle Type :</span> <strong style={{ marginLeft: 6 }}>{vehicleType}</strong>
        </div>
      ) : null}

      <div style={ctaRow}>
        <button
          onClick={onReject}
          disabled={disabled}
          style={{ ...btn, background: '#A10F0F', color: '#fff', opacity: disabled ? 0.6 : 1 }}
        >
          <CloseIcon />
        </button>
        <button
          onClick={onAccept}
          disabled={disabled}
          style={{ ...btn, background: '#38c106f2', color: '#fff', opacity: disabled ? 0.6 : 1 }}
        >
          <DoneIcon />
        </button>
      </div>
    </div>
  );
}

/* ---------------- styles ---------------- */

const card = {
  background: '#fff',
  borderRadius: 12,
  padding: 14,
  boxShadow: '0 10px 24px rgba(0,0,0,0.15)'
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8
};

const titleStyle = {
  fontWeight: 800,
  fontSize: 18
};

const timerPill = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 20,
  background: '#F5F5F7',
  fontWeight: 700,
  fontSize: 14
};

const subRow = {
  margin: '4px 0 10px 0'
};

const etaLabel = {
  color: '#B22222',
  fontWeight: 700,
  marginRight: 6
};

const etaText = {
  fontWeight: 600
};

const infoRow = {
  margin: '6px 0',
  fontSize: 14
};

const ctaRow = {
  display: 'flex',
  gap: 10,
  marginTop: 14
};

const btn = {
  flex: 1,
  border: 'none',
  borderRadius: 10,
  padding: '5px',
  fontSize: 2,
  fontWeight: 100,
  cursor: 'pointer'
};
