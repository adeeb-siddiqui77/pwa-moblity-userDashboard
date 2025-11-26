/* src/pages/JobChatPage.jsx */
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE;
const STORAGE_KEY = (ticketId, mechId) => `jobchat:${ticketId}:${mechId}`;

import { ImCross } from "react-icons/im";


/* BOT_FLOW: index -> behavior (meta shown in Figma) 
   Align indices with backend handlers. Example:
   0: greeting (details)
   1: capture vehicle plate
   2: capture stencil
   3: pick issues (checkbox list)
   4: additional inputs / finish
*/
const BOT_FLOW = [
  { id: 'greeting', type: 'info' },
  { id: 'vehicle_plate', type: 'capture_image', title: 'Please upload a photo of the vehicle’s number plate to verify the record.' },
  { id: 'stencil', type: 'capture_image', title: 'Upload the tyre’s stencil number.' },
  { id: 'issue_image', type: 'capture_image', title: 'Capture Tyre Issue Image' },
  {
    id: 'issues', type: 'checkbox', title: 'Before you get started, just pick the issues from the list below.', options: [
      'Tyre Burst', 'Tyre Puncture', 'Rim Break/ Damage', 'Air Bulge', 'Tyre Runflat', 'Cuts/ Cracks/ Damage in Sidewalls', 'Belt/ Tread Separation'
    ]
  },
  { id: 'finish', type: 'end', title: 'I’ve noted the issues. You can begin the repair.' }
];

const BOT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKFjKVKIji1Xzqr6zWY4yQJvLiFUULD9O_LA&s'
const MECH_AVATAR = 'https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001877.png'

export default function JobChatPage({ mechanicIdProp }) {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const context = location.state || {};
  const driverName = context.driverName || '';
  const driverPhone = context.driverPhone || '';
  const mechanicId = mechanicIdProp || (JSON.parse(localStorage.getItem('user'))?.id);

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [flowIndex, setFlowIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  const listRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    console.log("[JobChat] mount", { ticketId, mechanicId, API_BASE });
    if (!ticketId) {
      setErrorText("Missing ticketId in route (path should be /job-chat/:ticketId)");
      return;
    }
    if (!mechanicId) {
      setErrorText("Mechanic id not found. Please login or pass mechanicIdProp for testing.");
      return;
    }

    // restore local fallback
    try {
      const raw = localStorage.getItem(STORAGE_KEY(ticketId, mechanicId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setSession(parsed.session || null);
        setMessages(parsed.messages || []);
        setFlowIndex(parsed.flowIndex || 0);
        console.log("[JobChat] restored from localStorage", parsed);
      }
    } catch (err) {
      console.warn("[JobChat] local restore failed", err);
    }

    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, mechanicId]);

  //   async function loadSession() {
  //     setErrorText("");
  //     setLoading(true);
  //     try {
  //       // Note: backend route expected is GET /api/jobchat/:ticketId
  //       // pass mechanicId as query param to identify the user (or rely on auth cookie)
  //       const url = `${API_BASE}/api/jobchat/${ticketId}?mechanicId=${encodeURIComponent(mechanicId)}`;
  //       console.log("[JobChat] GET", url);
  //       const res = await axios.get(url, { withCredentials: true, timeout: 8000 });
  //       const data = res.data?.data;
  //       if (!data) {
  //         setErrorText("Server returned empty session data.");
  //         console.warn("[JobChat] empty data", res.data);
  //       } else {
  //         setSession(data);
  //         setMessages(data.messages || []);
  //         setFlowIndex(data.flowIndex || 0);
  //         persistLocal(data, data.messages || [], data.flowIndex || 0);
  //         console.log("[JobChat] loaded session from server", { sessionId: data._id, flowIndex: data.flowIndex, messagesCount: (data.messages || []).length });
  //       }
  //     } catch (err) {
  //       console.error("[JobChat] loadSession error", err);
  //       setErrorText(`Failed to load session: ${err?.message || err}`);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  function makeInitialBotMessages(ticketId, driverName, driverPhone) {
    const msgs = [];

    // 1) Greeting / details message
    const detailsText =
      `Hi there 👋\nHere are the details for your latest service ticket:\nTicket ID: ${ticketId}` +
      (driverName ? `\nDriver Name: ${driverName}` : '') +
      (driverPhone ? `\nContact: ${driverPhone}` : '');
    msgs.push({
      who: 'bot',
      text: detailsText,
      meta: {},
      createdAt: new Date().toISOString()
    });

    // 2) Capture vehicle plate CTA (BOT_FLOW[1].title)
    const platePrompt = (BOT_FLOW[1] && BOT_FLOW[1].title) ? BOT_FLOW[1].title : 'Please upload vehicle number plate';
    msgs.push({
      who: 'bot',
      text: `${platePrompt}`,
      meta: { action: 'capture_image' },
      createdAt: new Date().toISOString()
    });

    return msgs;
  }

  async function loadSession() {
    setErrorText('');
    setLoading(true);
    try {
      const url = `${API_BASE}/api/jobchat/${ticketId}?mechanicId=${encodeURIComponent(mechanicId)}`;
      console.log("[JobChat] GET", url);
      const res = await axios.get(url, { withCredentials: true, timeout: 8000 });
      const data = res.data?.data;

      if (!data) {
        setErrorText("Server returned empty session data.");
        console.warn("[JobChat] empty data", res.data);
        // show initial prompts locally so UI isn't blank
        const initial = makeInitialBotMessages(ticketId, driverName, driverPhone);
        setMessages(initial);
        setFlowIndex(1) //-> CTA step 
        persistLocal(null, initial, 0);
      } else {
        // If server session exists
        setSession(data);
        if (!data.messages || data.messages.length === 0) {
          // server created a session but there are no stored messages yet.
          // show initial bot messages locally so mechanic sees prompts immediately.
          const initial = makeInitialBotMessages(ticketId, driverName, driverPhone);
          // set local only (do not overwrite DB). When user acts, postMessage will persist.
          setMessages(initial);
          setFlowIndex(1);
          persistLocal(data, initial, 1);
          console.log("[JobChat] showing local initial bot messages (server had none)");
        } else {
          // normal path: session with messages
          setMessages(data.messages || []);
          setFlowIndex(data.flowIndex || 0);
          persistLocal(data, data.messages || [], data.flowIndex || 0);
        }
        console.log("[JobChat] loaded session from server", { sessionId: data._id, flowIndex: data.flowIndex, messagesCount: (data.messages || []).length });
      }
    } catch (err) {
      console.error("[JobChat] loadSession error", err);
      setErrorText(`Failed to load session: ${err?.message || err}`);
      // show initial prompts locally as fallback when server unreachable
      const initial = makeInitialBotMessages(ticketId, driverName, driverPhone);
      setMessages(initial);
      persistLocal(null, initial, 0);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function persistLocal(sess, msgs, fIdx) {
    try {
      localStorage.setItem(STORAGE_KEY(ticketId, mechanicId), JSON.stringify({ session: sess, messages: msgs, flowIndex: fIdx }));
    } catch (err) { }
  }

  function scrollToBottom() {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight + 200;
  }

  // helper to post message (text or file)
  async function postMessage({ who = 'mechanic', text = '', file = null, meta = {} }) {
    // optimistic push locally
    const localMsg = { who, text, imageUrl: file ? URL.createObjectURL(file) : null, meta, createdAt: new Date().toISOString() };
    setMessages(prev => {
      const next = [...prev, localMsg];
      persistLocal(session, next, flowIndex);
      return next;
    });

    const form = new FormData();
    form.append('who', who);
    form.append('text', text);
    if (file) form.append('file', file);
    if (meta && Object.keys(meta).length) form.append('meta', JSON.stringify(meta));
    form.append('mechanicId', mechanicId);

    try {
      const url = `${API_BASE}/api/jobchat/${ticketId}/message`;
      console.log("[JobChat] POST", url, { who, text, file: !!file, meta });
      const res = await axios.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });
      const updated = res.data?.data;
      if (updated) {
        setSession(updated);
        setMessages(updated.messages || []);
        setFlowIndex(updated.flowIndex || flowIndex);
        persistLocal(updated, updated.messages || [], updated.flowIndex || flowIndex);
      } else {
        console.warn("[JobChat] postMessage returned no updated session", res.data);
      }
    } catch (err) {
      console.error("[JobChat] postMessage error", err);
      setErrorText(`Failed to send: ${err?.message || err}`);
    }
  }

  function onCaptureClick() {
    fileRef.current?.click();
  }

  async function onFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSubmitting(true);
    await postMessage({ who: "mechanic", text: "", file: f });
    setSubmitting(false);
    e.target.value = "";
  }


  async function onSendText() {
    if (!input.trim()) return;
    setSubmitting(true);
    await postMessage({ who: "mechanic", text: input.trim() });
    setInput("");
    setSubmitting(false);
  }

  async function submitIssues() {
    if (selectedIssues.length === 0) {
      alert("Please select at least one issue");
      return;
    }
    setSubmitting(true);
    await postMessage({ who: "mechanic", text: selectedIssues.join(", "), meta: { type: "issues", issues: selectedIssues } });
    setSubmitting(false);
  }


  function renderBotBubble(msg, idx) {
    const currentFlow = BOT_FLOW[flowIndex] || {};

    // determine last bot message index (so only that bot message shows active CTAs)
    const lastBotIndex = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].who === 'bot') return i;
      }
      return -1;
    })();

    // show capture CTA only if:
    // - flow says capture_image AND
    // - (this message is the last bot message OR message.meta.action === 'capture_image')
    const shouldShowCapture =
      currentFlow.type === 'capture_image' &&
      msg.who === 'bot' &&
      (idx === lastBotIndex || (msg.meta && msg.meta.action === 'capture_image'));

    return (
      <div className="max-w-[92%]" key={idx}>
        <div className="flex items-start gap-3">
          <img src={BOT_AVATAR} alt="bot" className="w-8 h-8 rounded-full object-contain border border-[#FB8C0066] shadow-xl" />
          <div>
            <div className="bg-white rounded-tl-none rounded-xl p-3 text-sm text-gray-800 shadow-sm border border-[#FB8C0066]">
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {shouldShowCapture && (
                <div className="mt-3">
                  <button onClick={onCaptureClick} className="w-full bg-[#FB8C00] hover:bg-orange-600 text-white rounded-md py-3 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h4l2-3h6l2 3h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                    Capture Image
                  </button>
                </div>
              )}

              {currentFlow.type === "checkbox" && idx === lastBotIndex && (
                <div className="mt-3 space-y-2">
                  {currentFlow.options.map(opt => (
                    <label key={opt} className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedIssues.includes(opt)} onChange={() => {
                        setSelectedIssues(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
                      }} />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                  <button className="w-full bg-[#FB8C00] text-white rounded-md py-2 mt-3" onClick={submitIssues} disabled={submitting}>Submit</button>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">{formatTime(msg.createdAt)}</div>
          </div>
        </div>
      </div>
    );
  }


  function renderMechanicBubble(msg, idx) {
    return (
      <div className="max-w-[86%] text-right" key={idx}>

        <div className='flex items-start gap-1'>
          <div>
            <div className="bg-white text-black rounded-xl rounded-tr-none px-4 py-2 inline-block text-sm shadow-lg border border-[#FB8C0066]">
              {msg.imageUrl ? <img src={msg.imageUrl} alt="img" className="max-w-[220px]" /> : <span>{msg.text}</span>}
            </div>
            <div className="text-xs text-gray-400 mt-1">{formatTime(msg.createdAt)}</div>
          </div>
          <img src={MECH_AVATAR} alt="bot" className="w-8 h-8 rounded-full object-cover border border-[#FB8C0066] shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-200 bg-[#EBEBEB] border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">←</button> */}
            <img src={BOT_AVATAR} alt="bot" className="w-8 h-8 p-1 rounded-full object-contain border border-[#FB8C0066] shadow-xl" />
          
            <div>
              <div className="text-sm font-semibold">JK Support</div>
              {/* <div className="text-xs text-gray-500">{driverName ? `${driverName} • ${driverPhone}` : `Ticket ${ticketId || ''}`}</div> */}
            </div>
          </div>
          {/* <div className="text-xs text-gray-400"><ImCross /></div> */}
          <ImCross className='text-xs font-light' onClick={() => navigate(-1)}/>
        </div>
      </div>

      <div ref={listRef} className="flex-1 px-4 py-4 overflow-auto space-y-3 max-w-2xl mx-auto w-full">
        {loading && <div className="text-center text-sm text-gray-500">Loading…</div>}
        {errorText && <div className="text-center text-sm text-red-600">{errorText}</div>}

        {messages.map((m, i) => (
          <div className={`w-full flex ${m.who === 'mechanic' ? 'justify-end' : 'justify-start'}`} key={i}>
            {m.who === 'mechanic' ? renderMechanicBubble(m, i) : renderBotBubble(m, i)}
          </div>
        ))}
      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSendText()} className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm" placeholder="Type your message here" />
          <button onClick={onSendText} className="bg-[#FB8C00] text-white rounded-full px-4 py-2">Send</button>
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-gray-100">📷</button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
    </div>
  );
}

function formatTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  const hh = dt.getHours();
  const mm = String(dt.getMinutes()).padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h = ((hh + 11) % 12) + 1;
  return `${h}:${mm} ${ampm}`;
}

