import React, { useState, useEffect } from 'react'
import JobCard from '../components/JobCard'

export default function Home(){
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    let userId = "";
    try {
      userId = stored ? JSON.parse(stored).id : "";
    } catch {}
    if (!userId) {
      setError("No user ID found in local storage");
      setLoading(false);
      return;
    }
    const fetchTickets = async () => {
      try {
        const res = await fetch(`https://pwa-connect-api.jktyre.co.in/api/zoho/tickets/mechanic/${userId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setTickets(data.tickets || []);
      } catch (err) {
        setError(err.message || "Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className='container'>
      <div className='row' style={{gap:8, marginBottom: 16}}>
        <div className='card' style={{flex:1, padding:12}}>
          <div className='caption-text'>Open Jobs</div>
          <div className='bold-text' style={{fontSize: '18px'}}>20</div>
        </div>
        <div className='card' style={{flex:1, padding:12}}>
          <div className='caption-text'>Pending Payments</div>
          <div className='bold-text' style={{fontSize: '18px'}}>10</div>
        </div>
      </div>

      <h3>Upcoming Jobs Today</h3>
      <div className='list'>
        {loading && <div className='caption-text'>Loading...</div>}
        {error && <div style={{color:'red'}} className='text-field'>{error}</div>}
        {!loading && !error && tickets.map(t => (
          <JobCard
            key={t._id}
            job={{
              id: t._id,
              vehicle: t.zohoTicketId,
              customer: t.subject,
              mobile: t.phone,
              issue: t.status,
              time: new Date(t.createdAt).toLocaleTimeString()
            }}
          />
        ))}
        {!loading && !error && tickets.length === 0 && <div className='caption-text'>No tickets found.</div>}
      </div>
    </div>
  )
}
