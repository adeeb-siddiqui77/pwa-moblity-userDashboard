
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdArrowForwardIos } from "react-icons/md";
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_BASE;


export default function JobCard({ job, showPriority = false, showCategory = false, fullTicket = null }) {
  const nav = useNavigate()

  // Debug: Log job data to see what we're getting
  // console.log('JobCard job data:', job)
  // console.log('Job issue:', job.issue)
  // console.log('Job paymentStatus:', job.paymentStatus)
  // console.log('Job createdAt:', job.createdAt)
  // console.log('Job originalTicket createdAt:', job.originalTicket?.createdAt)

  // console.log("fullTicket" , fullTicket)

  // Format time based on date
  const formatTime = (createdAt) => {
    // console.log('formatTime called with:', createdAt, 'type:', typeof createdAt)

    if (!createdAt) {
      // console.log('No createdAt provided')
      return 'N/A'
    }

    // If it's already a formatted time string, return it as is
    if (typeof createdAt === 'string' && !createdAt.includes('T') && !createdAt.includes('-')) {
      // console.log('Returning formatted time string:', createdAt)
      return createdAt
    }

    const ticketDate = new Date(createdAt)
    // console.log('Parsed date:', ticketDate)

    // Check if the date is valid
    if (isNaN(ticketDate.getTime())) {
      // console.log('Invalid date:', createdAt)
      return 'N/A'
    }

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset time to compare only dates
    const ticketDateOnly = new Date(ticketDate.getFullYear(), ticketDate.getMonth(), ticketDate.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (ticketDateOnly.getTime() === todayOnly.getTime()) {
      // Today - show time
      return ticketDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else if (ticketDateOnly.getTime() === yesterdayOnly.getTime()) {
      // Yesterday
      return 'Yesterday'
    } else {
      // Other days - show day of week
      return ticketDate.toLocaleDateString('en-US', {
        weekday: 'short'
      })
    }
  }

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
      case 'completed': return '#10b981'
      case 'paid': return '#059669'
      case 'in progress': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const handleCardClick = () => {
    if (fullTicket) {
      // nav(`/ticket/${fullTicket._id}`, { state: { ticket: fullTicket } })
    }
  }



  // const goToJobChat = () => {
  //   if (!fullTicket?.zohoTicketId) return;


  //   nav(`/job-chat/${fullTicket.zohoTicketId}`, {
  //     state: {
  //       driverName: fullTicket?.cf?.cf_driver_name,
  //       driverPhone: fullTicket?.cf?.cf_driver_phone_number
  //     }
  //   });
  // };


  const goToJobChat = async () => {
    if (!fullTicket?.zohoTicketId) return;
  
    try {
      if (fullTicket?.status === "Ticket Created") {
        await axios.patch(
          `${API_BASE}/api/zoho/tickets/${fullTicket.zohoTicketId}`,
          {
            data: {
              status: "In progress",
            },
            tokenDetails: null,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
  
      nav(`/job-chat/${fullTicket.zohoTicketId}`, {
        state: {
          driverName: fullTicket?.cf?.cf_driver_name,
          driverPhone: fullTicket?.cf?.cf_driver_phone_number
        }
      });
    } catch (error) {
      console.error("Ticket update failed:", error);
    }
  };
  

  return (
    <div
      className='card job-card list-card'
      onClick={job.issue === "Job closed" ? undefined : goToJobChat}
      // style={{ cursor: fullTicket ? 'pointer' : 'default' }}
      style={{ cursor: job.issue === "Job closed" ? 'default' : 'pointer' }}
    >
      <div className='job-card-content'>
        <div className='job-card-header'>
          <div className='ticket-id'>Ticket ID: #{job.vehicle}</div>
          <div className='job-time'>
            {/* {formatTime(job.createdAt || job.originalTicket?.createdAt) || job.time || 'N/A'} */}
            {fullTicket?.status}
          </div>
        </div>

        {/* Priority Badge */}
        {/* {showPriority && job.priority && (
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
        )} */}

        {/* Payment Status Badge - Show for completed jobs */}
        {/* {job.issue === 'Completed' && (
          <div style={{
            background: (job.paymentStatus === 'paid') ? '#059669' : '#f59e0b',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: '600',
            alignSelf: 'flex-start',
            marginBottom: '8px',
            textTransform: 'capitalize',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {(job.paymentStatus === 'paid') ? '✓ Paid' : '⏳ Pending Payment'}
          </div>
        )} */}

        <div className='vehicle-number'>{fullTicket?.cf?.cf_driver_vehicle_number || 'N/A'}</div>
        {/* <div className='customer-info'>Phone: {job.mobile} | Email: {job.email || 'N/A'}</div> */}
        <div className='customer-info'>
          {fullTicket?.cf?.cf_driver_name || 'N/A'} | {
            (() => {
              const phone = fullTicket?.cf?.cf_driver_phone_number || 'N/A';
              if (typeof phone === 'string' && phone.startsWith('+91') && phone.length > 3) {
                return '+91 ' + phone.slice(3);
              }
              return phone;
            })()
          }
          {
            job.issue != "Job closed" ? (<p className='goChatArrow'><MdArrowForwardIos/></p>) : (<></>)
          }
          
        </div>

          

        {/* Category */}
        {/* {showCategory && job.category && (
          <div style={{ marginBottom: '8px' }}>
            <span className='caption-text'>Category: </span>
            <span className='text-field'>{job.category}</span>
          </div>
        )} */}



        {/* Start Job Button below */}

        {/* <div className='ticket-issue-section'>
          <div className='ticket-issue-content'>
            <div className='issue-text'>Tyre Burst</div>

            {job.issue === "Job closed" ? "" : <button className='start-job-btn' onClick={() => nav(`/job-chat/${fullTicket?.zohoTicketId}`, {
              state: { driverName: fullTicket?.cf?.cf_driver_name, driverPhone: fullTicket?.cf?.cf_driver_phone_number }
            })}>Start Job</button>}

          </div>
        </div> */}

        {/* Due Date */}
        {/* {job.dueDate && (
          <div style={{ marginTop: '8px' }}>
            <span className='caption-text'>Due: </span>
            <span className='text-field'>{new Date(job.dueDate).toLocaleDateString()}</span>
          </div>
        )} */}



      </div>
    </div>
  )
}
