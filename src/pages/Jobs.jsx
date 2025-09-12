
import React, { useState, useEffect } from 'react'
import JobCard from '../components/JobCard'

export default function Jobs(){
  const [tab, setTab] = useState('open')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        
        // Get user ID from localStorage
        const stored = localStorage.getItem("user")
        let userId = ""
        try {
          userId = stored ? JSON.parse(stored).id : ""
        } catch {}
        
        if (!userId) {
          setError("No user ID found in local storage")
          setLoading(false)
          return
        }

        // Call the API with dynamic user ID
        const response = await fetch(`https://pwa-connect-api.jktyre.co.in/api/zoho/tickets/mechanic/${userId}`)
        
        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || `HTTP ${response.status}`)
        }
        
        const data = await response.json()
        console.log('API Response:', data)
        
        // Transform API data to match our component structure
        const transformedTickets = data.tickets.map(ticket => ({
          id: ticket._id,
          vehicle: ticket.zohoTicketId,
          customer: ticket.subject || 'No Subject',
          mobile: ticket.phone || 'No Phone',
          issue: ticket.status || 'Unknown',
          time: new Date(ticket.createdAt).toLocaleTimeString(),
          priority: ticket.priority,
          category: ticket.category,
          dueDate: ticket.dueDate,
          assigneeId: ticket.assigneeId,
          email: ticket.email,
          originalTicket: ticket // Keep original data for reference
        }))
        
        setTickets(transformedTickets)
      } catch (err) {
        console.error('Error fetching tickets:', err)
        setError(err.message || "Failed to fetch tickets")
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // Filter tickets based on search term
  const filteredTickets = tickets.filter(ticket => 
    ticket.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.mobile.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Separate open and closed tickets (assuming 'Open' status means open jobs)
  const openTickets = filteredTickets.filter(ticket => ticket.issue === 'Open')
  const closedTickets = filteredTickets.filter(ticket => ticket.issue !== 'Open')
  
  const src = tab === 'open' ? openTickets : closedTickets

  return (
    <div className='container'>
      <div className='row' style={{justifyContent:'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12}}>
        <div className='row' style={{gap:8}}>
          <button className='btn' style={{background: tab==='open'?'var(--brand)':'#e5e7eb', color: tab==='open'?'#fff':'#111', width: 'auto', maxWidth: 'none'}} onClick={()=>setTab('open')}>
            Open Jobs ({openTickets.length})
          </button>
          <button className='btn' style={{background: tab==='closed'?'var(--brand)':'#e5e7eb', color: tab==='closed'?'#fff':'#111', width: 'auto', maxWidth: 'none'}} onClick={()=>setTab('closed')}>
            Closed Jobs ({closedTickets.length})
          </button>
        </div>
        <div className='search' style={{flex: 1, minWidth: 200}}>
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
        <div className='card' style={{padding: 20, textAlign: 'center'}}>
          <div className='caption-text'>Loading tickets...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className='card' style={{padding: 20, textAlign: 'center'}}>
          <div style={{color: 'red'}} className='text-field'>{error}</div>
        </div>
      )}

      {/* Tickets List */}
      {!loading && !error && (
        <div className='list'>
          {src.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              showPriority={true}
              showCategory={true}
            />
          ))}
          
          {src.length === 0 && (
            <div className='card' style={{padding: 20, textAlign: 'center'}}>
              <div className='caption-text'>
                No {tab === 'open' ? 'open' : 'closed'} jobs found
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
