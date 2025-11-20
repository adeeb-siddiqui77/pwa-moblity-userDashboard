
import React, { useState, useEffect } from 'react'
import JobCard from '../components/JobCard'

export default function Jobs() {
  const [tab, setTab] = useState('open')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredTickets, setFilteredTickets] = useState([]);

  const API_BASE = (import.meta.env.VITE_API_BASE) || ''

  useEffect(() => {
    const stored = localStorage.getItem("user");
    let userId = "";
    try {
      userId = stored ? JSON.parse(stored).id : "";
    } catch { }
    if (!userId) {
      setError("No user ID found in local storage");
      setLoading(false);
      return;
    }
    const fetchTickets = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/zoho/tickets/mechanic/${userId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();

        // Transform API data to match our component structure
        const transformedTickets = (data.tickets || []).map(ticket => ({
          ...ticket,
          id: ticket._id,
          vehicle: ticket.zohoTicketId,
          customer: ticket.subject || 'No Subject',
          mobile: ticket.phone || 'No Phone',
          issue: ticket.status || 'Unknown',
          createdAt: ticket.createdAt, // Add createdAt for time formatting
          paymentStatus: ticket.paymentStatus || (ticket.status === 'Completed' ? 'paid' : 'pending')
        }));

        // console.log('Sample transformed ticket from Home:', transformedTickets[0])

        setTickets(transformedTickets);
        setFilteredTickets(transformedTickets);
      } catch (err) {
        setError(err.message || "Failed to fetch tickets");
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // // Filter tickets based on search term
  // const filteredTickets = tickets.filter(ticket =>
  //   ticket.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   ticket.mobile.toLowerCase().includes(searchTerm.toLowerCase())
  // )

  // Separate open and closed tickets (assuming 'Open' status means open jobs)
  const openTickets = filteredTickets.filter(ticket => ticket.issue === 'Open')
  const closedTickets = filteredTickets.filter(ticket => ticket.issue !== 'Open')

  const src = tab === 'open' ? openTickets : closedTickets

  return (
    <div className='container'>
      <div className='row' style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className='row' style={{ gap: 8 }}>
          <button className='btn' style={{ background: tab === 'open' ? 'var(--brand)' : '#e5e7eb', color: tab === 'open' ? '#fff' : '#111', width: 'auto', maxWidth: 'none' }} onClick={() => setTab('open')}>
            Open Jobs ({openTickets.length})
          </button>
          <button className='btn' style={{ background: tab === 'closed' ? 'var(--brand)' : '#e5e7eb', color: tab === 'closed' ? '#fff' : '#111', width: 'auto', maxWidth: 'none' }} onClick={() => setTab('closed')}>
            Closed Jobs ({closedTickets.length})
          </button>
        </div>
        <div className='search' style={{ flex: 1, minWidth: 200 }}>
          <input
            className='input'
            placeholder='Search by Ticket ID, Subject, Phone'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className='card' style={{ padding: 20, textAlign: 'center' }}>
          <div className='caption-text'>Loading tickets...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='card' style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ color: 'red' }} className='text-field'>{error}</div>
        </div>
      )}

      {/* Tickets List */}
      <div className='list'>
        {loading && <div className='caption-text'>Loading...</div>}
        {error && <div style={{ color: 'red' }} className='text-field'>{error}</div>}
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
              createdAt: t.createdAt,
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
