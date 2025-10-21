// src/components/MechanicSocket.jsx
import React, { useEffect, useState } from 'react';
import { initSocket, getSocket, on, off, emit } from '../services/socketClient';

export default function MechanicSocket({ mechanicId }) {
  const [alerts, setAlerts] = useState([]);
  const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

  useEffect(() => {
    if (!mechanicId) {
      console.warn('MechanicSocket: mechanicId is required');
      return;
    }

    // init socket singleton
    initSocket(serverUrl, { mechanicId });

    const handleJobAlert = (payload) => {
      console.log('job_alert', payload);
      setAlerts(prev => [payload, ...prev]);
    };

    on('job_alert', handleJobAlert);

    // cleanup
    return () => {
      off('job_alert', handleJobAlert);
      // do not disconnect here if socket shared across app
    };
  }, [mechanicId, serverUrl]);

  const accept = (job) => {
    emit('job_response', { jobId: job.jobId, attemptIndex: job.attemptIndex, response: 'accept' }, (ack) => {
      console.log('accept ack', ack);
    });
  };

  const reject = (job) => {
    emit('job_response', { jobId: job.jobId, attemptIndex: job.attemptIndex, response: 'reject' }, (ack) => {
      console.log('reject ack', ack);
    });
  };

  return (
    <div>
      <h4>MechanicSocket — {mechanicId}</h4>
      <ul>
        {alerts.map((a, i) => (
          <li key={i}>
            <pre style={{ display: 'inline' }}>{JSON.stringify(a)}</pre>
            <button onClick={() => accept(a)}>Accept</button>
            <button onClick={() => reject(a)}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
