import React, { useState, useEffect } from 'react'
import JobCard from '../components/JobCard'

export default function Home(){
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'completed'

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
        setFilteredTickets(data.tickets || []);
      } catch (err) {
        setError(err.message || "Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Filter tickets based on selected filter
  useEffect(() => {
    if (filter === 'all') {
      setFilteredTickets(tickets);
    } else if (filter === 'open') {
      setFilteredTickets(tickets.filter(ticket => 
        ticket.status && ticket.status.toLowerCase() !== 'completed'
      ));
    } else if (filter === 'completed') {
      setFilteredTickets(tickets.filter(ticket => 
        ticket.status && ticket.status.toLowerCase() === 'completed'
      ));
    }
  }, [filter, tickets]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <div className='container'>
      <div className='row' style={{gap:8, marginBottom: 16}}>
        <div className='card' style={{flex:1, padding:12}}>
          <div className='caption-text'>Open Jobs</div>
          <div className='bold-text' style={{fontSize: '18px'}}>
            {tickets.filter(t => t.status && t.status.toLowerCase() !== 'completed').length}
          </div>
        </div>
        <div className='card' style={{flex:1, padding:12}}>
          <div className='caption-text'>Completed Jobs</div>
          <div className='bold-text' style={{fontSize: '18px'}}>
            {tickets.filter(t => t.status && t.status.toLowerCase() === 'completed').length}
          </div>
        </div>
      </div>

      <h3>Jobs</h3>
      
      {/* Filter Buttons */}
      <div className='row' style={{gap:8, marginBottom: 16}}>
        <button 
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => handleFilterChange('all')}
          style={{flex: 1}}
        >
          All ({tickets.length})
        </button>
        <button 
          className={filter === 'open' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => handleFilterChange('open')}
          style={{flex: 1}}
        >
          Open ({tickets.filter(t => t.status && t.status.toLowerCase() !== 'completed').length})
        </button>
        <button 
          className={filter === 'completed' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => handleFilterChange('completed')}
          style={{flex: 1}}
        >
          Completed ({tickets.filter(t => t.status && t.status.toLowerCase() === 'completed').length})
        </button>
      </div>

      <div className='list'>
        {loading && <div className='caption-text'>Loading...</div>}
        {error && <div style={{color:'red'}} className='text-field'>{error}</div>}
        {!loading && !error && filteredTickets.map(t => (
          <JobCard
            key={t._id}
            job={{
              id: t._id,
              vehicle: t.zohoTicketId,
              customer: t.subject,
              mobile: t.phone,
              email: t.email,
              issue: t.status,
              priority: t.priority,
              category: t.category,
              dueDate: t.dueDate,
              time: new Date(t.createdAt).toLocaleTimeString()
            }}
            fullTicket={t}
            showPriority={true}
            showCategory={true}
          />
        ))}
        {!loading && !error && filteredTickets.length === 0 && <div className='caption-text'>No tickets found.</div>}
      </div>
    </div>
  )
}
