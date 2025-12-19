// src/pages/JobChatPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

const BOT = 'bot';
const USER = 'user';
const DEFAULT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKFjKVKIji1Xzqr6zWY4yQJvLiFUULD9O_LA&s';

// Fixed bot flow (adjust as needed)
const BOT_FLOW = [
  { id: 'greeting', text: 'Hi there 👋\nHere are the details for your latest service ticket:', metaCard: true },
  { id: 'ask_plate_photo', text: "Please upload a photo of the vehicle's number plate to verify the record.", action: 'capture_image' },
  { id: 'ask_confirm_driver', text: 'Is the driver name correct? (Yes / No)' },
  { id: 'ask_odometer', text: 'Please enter current odometer reading (in km).' },
  { id: 'finish', text: 'Thanks — job record saved.' }
];

export default function JobChatPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // optional initial context can be passed via location.state
  const context = location.state || {};
  const driverName = context.driverName;
  const driverPhone = context.driverPhone;

  const [messages, setMessages] = useState([]);
  const [flowIndex, setFlowIndex] = useState(0);
  const [input, setInput] = useState('');
  const fileInputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    // init conversation when page mounts
    const initial = [];
    initial.push({
      id: `bot-${Date.now()}`,
      who: BOT,
      text: BOT_FLOW[0].text,
      ts: new Date(),
      metaCard: true
    });
    initial.push({
      id: `bot-${Date.now()+1}`,
      who: BOT,
      text: BOT_FLOW[1].text,
      ts: new Date(),
      action: BOT_FLOW[1].action || null
    });
    setMessages(initial);
    setFlowIndex(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const scrollToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight + 200;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });

  const pushUserMessage = (payload) => {
    setMessages(prev => [...prev, payload]);
  };

  const handleSendText = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg = { id: `u-${Date.now()}`, who: USER, text: trimmed, ts: new Date() };
    pushUserMessage(userMsg);
    setInput('');
    advanceFlowAfterUserReply(trimmed, userMsg);
  };

  const handleFileSelected = async (file) => {
    if (!file) return;
    const dataUrl = await toDataUrl(file);
    const userMsg = { id: `u-${Date.now()}`, who: USER, text: '', ts: new Date(), image: dataUrl, fileName: file.name };
    pushUserMessage(userMsg);
    advanceFlowAfterUserReply('[image]', userMsg);
  };

  const clickCapture = () => fileInputRef.current?.click();

  const pushBotMessage = (obj) => {
    setMessages(prev => [...prev, {
      id: `bot-${Date.now()}`,
      who: BOT,
      text: obj.text,
      ts: new Date(),
      action: obj.action || null,
      metaCard: obj.metaCard || false
    }]);
  };

  const advanceFlowAfterUserReply = (replyText, userMsg) => {
    const nextIndex = flowIndex + 1;
    if (nextIndex < BOT_FLOW.length) {
      const next = BOT_FLOW[nextIndex];
      setTimeout(() => {
        pushBotMessage(next);
        setFlowIndex(nextIndex);
        if (next.id === 'finish') {
          setTimeout(() => {
            // optionally call API or navigate
            // navigate back or to job details
          }, 400);
        }
      }, 600);
    } else {
      setTimeout(() => {
        pushBotMessage({ text: 'Thank you. Job started.' });
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">←</button>
            <div>
              <div className="text-sm font-semibold">JK Support</div>
              <div className="text-xs text-gray-500">{driverName ? `${driverName} • ${driverPhone}` : `Ticket ${ticketId || ''}`}</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">SLA: 02:00</div>
        </div>
      </div>

      {/* Message List */}
      <div ref={listRef} className="flex-1 overflow-auto px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {messages.map(msg => (
          <div key={msg.id} className={`w-full flex ${msg.who === USER ? 'justify-end' : 'justify-start'}`}>
            {msg.who === BOT ? (
              <div className="max-w-[86%]">
                <div className="flex items-start gap-3">
                  <img src={DEFAULT_AVATAR} alt="bot" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <div className="bg-white shadow rounded-xl p-3 text-sm text-gray-800 whitespace-pre-wrap">
                      {msg.metaCard ? (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-700">Hi there 👋</div>
                          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                            <div className="text-xs text-gray-500">Ticket ID:</div>
                            <div className="font-semibold">{ticketId || 'N/A'}</div>
                            {driverName && <div className="text-sm mt-1">{driverName}</div>}
                            {driverPhone && <div className="text-xs text-gray-500">{driverPhone}</div>}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>{msg.text}</div>
                          {msg.action === 'capture_image' && (
                            <div className="mt-3">
                              <button onClick={clickCapture} className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-md py-3 flex items-center justify-center gap-2 shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h4l2-3h6l2 3h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                                <span className="font-medium">Capture Image</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{formatTime(msg.ts)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-[86%] text-right">
                <div className="bg-green-600 text-white rounded-xl px-4 py-2 shadow inline-block text-sm">
                  {msg.image ? <img src={msg.image} alt="sent" className="max-w-[240px] rounded-md" /> : <span>{msg.text}</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1">{formatTime(msg.ts)}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSendText(); }}
            className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none"
            placeholder="Type your message here"
          />
          <button onClick={handleSendText} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2">Send</button>
          <button onClick={clickCapture} className="p-2 rounded-full hover:bg-gray-100">📷</button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const data = await toDataUrl(file);
            handleFileSelectedInline(file, data);
          }
          e.target.value = '';
        }}
      />
    </div>
  );

  // helpers inside file to keep file self-contained
  function formatTime(d) {
    if (!d) return '';
    const date = new Date(d);
    const hh = date.getHours();
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'pm' : 'am';
    const h = ((hh + 11) % 12) + 1;
    return `${h}:${mm} ${ampm}`;
  }

//   function toDataUrl(file) {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = e => resolve(e.target.result);
//       reader.onerror = reject;
//       reader.readAsDataURL(file);
//     });
//   }

  // call when file selected to push msg & advance flow
  async function handleFileSelectedInline(file, dataUrl) {
    const userMsg = { id: `u-${Date.now()}`, who: USER, text: '', ts: new Date(), image: dataUrl, fileName: file.name };
    setMessages(prev => [...prev, userMsg]);
    advanceFlowAfterUserReply('[image]', userMsg);
  }
}
