// src/components/RequestTilesInline.jsx
import React from 'react';
import './RequestTilesInline.css';
import { useRequests } from '../store/RequestsProvider';

export default function RequestTilesInline() {
  const { items, accept, reject, format } = useRequests();

  return (
    <div className="rq-tiles">
      {items.length === 0 && (
        <div className="rq-empty">No incoming requests.</div>
      )}

      <div className="rq-grid">
        {items.map((it) => {
          const disabled = it.remaining <= 0;
          return (
            <div key={it.key} className="rq-tile">
              <div className="rq-top">
                <div className="rq-title">{it.issue}</div>
                <div className="rq-timer">
                  <span className="rq-clock" aria-hidden>⏱</span>
                  {format(it.remaining)}
                </div>
              </div>

              <div className="rq-eta">
                <span>ETA :</span> <strong>{it.eta}</strong>
              </div>

              {it.customerName && <div className="rq-info"><strong>{it.customerName}</strong></div>}
              {it.customerPhone && (
                <div className="rq-info"><span className="rq-muted">Mobile No. :</span> <strong>{it.customerPhone}</strong></div>
              )}
              {it.vehicleType && (
                <div className="rq-info"><span className="rq-muted">Vehicle Type :</span> <strong>{it.vehicleType}</strong></div>
              )}

              <div className="rq-actions">
                <button
                  className="rq-btn rq-btn-reject"
                  disabled={disabled}
                  onClick={() => reject(it)}
                >
                  Reject
                </button>
                <button
                  className="rq-btn rq-btn-accept"
                  disabled={disabled}
                  onClick={() => accept(it)}
                >
                  Accept
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
