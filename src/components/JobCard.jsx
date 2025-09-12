
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function JobCard({ job, showPriority = false, showCategory = false }){
  const nav = useNavigate()
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#dc2626'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return '#10b981'
      case 'closed': return '#6b7280'
      case 'in progress': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  return (
    <div className='card job-card list-card'>
      <div className='job-card-content'>
        <div className='job-card-header'>
          <div className='ticket-id'>Ticket ID: #{job.vehicle}</div>
          <div className='job-time'>Time: {job.time}</div>
        </div>
        
        {/* Priority Badge */}
        {showPriority && job.priority && (
          <div style={{
            background: getPriorityColor(job.priority),
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            alignSelf: 'flex-start',
            marginBottom: '8px'
          }}>
            {job.priority} Priority
          </div>
        )}
        
        <div className='vehicle-number'>{job.customer}</div>
        <div className='customer-info'>Phone: {job.mobile} | Email: {job.email || 'N/A'}</div>
        
        {/* Category */}
        {showCategory && job.category && (
          <div style={{marginBottom: '8px'}}>
            <span className='caption-text'>Category: </span>
            <span className='text-field'>{job.category}</span>
          </div>
        )}
        
        <div className='ticket-issue-section'>
          <div className='ticket-issue-label'>Status</div>
          <div className='ticket-issue-content'>
            <div className='issue-text' style={{color: getStatusColor(job.issue)}}>{job.issue}</div>
            <button className='start-job-btn' onClick={() => nav(`/jobs/${job.id}/start`)}>Start Job</button>
          </div>
        </div>

        {/* Due Date */}
        {job.dueDate && (
          <div style={{marginTop: '8px'}}>
            <span className='caption-text'>Due: </span>
            <span className='text-field'>{new Date(job.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}
