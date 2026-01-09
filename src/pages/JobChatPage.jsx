/* src/pages/JobChatPage.jsx */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE;
const STORAGE_KEY = (ticketId, mechId) => `jobchat:${ticketId}:${mechId}`;

import { ImCross } from "react-icons/im";
import MultiStepMessage from '../components/MultiStepMessage';
import MultiStepUI from '../components/MultiStepUI';

// BOT_FLOW will be created dynamically with translations

const BOT_AVATAR = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRKFjKVKIji1Xzqr6zWY4yQJvLiFUULD9O_LA&s'
const MECH_AVATAR = 'https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001877.png'

export default function JobChatPage({ mechanicIdProp }) {
  const { t } = useTranslation();
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const context = location.state || {};
  const driverName = context.driverName || '';
  const driverPhone = context.driverPhone || '';
  const mechanicId = mechanicIdProp || (JSON.parse(localStorage.getItem('user'))?.id);

  // Issue mapping: English (for backend) -> Display text (translated)
  const ISSUE_MAPPING = {
    'Tyre Burst': t('chatbot.issues.tyreBurst'),
    'Tyre Puncture': t('chatbot.issues.tyrePuncture'),
    'Rim Break/ Damage': t('chatbot.issues.rimBreakDamage'),
    'Air Bulge': t('chatbot.issues.airBulge'),
    'Tyre Runflat': t('chatbot.issues.tyreRunflat'),
    'Cuts/ Cracks/ Damage in Sidewalls': t('chatbot.issues.cutsCracksDamage'),
    'Belt/ Tread Separation': t('chatbot.issues.beltTreadSeparation')
  };

  // Reverse mapping: Display text -> English (for backend)
  const ISSUE_REVERSE_MAPPING = Object.fromEntries(
    Object.entries(ISSUE_MAPPING).map(([en, translated]) => [translated, en])
  );

  // Helper function to get English issue name from translated text
  const getEnglishIssueName = (translatedText) => {
    return ISSUE_REVERSE_MAPPING[translatedText] || translatedText;
  };

  // Create BOT_FLOW with translations (display translated, but we'll map back to English when submitting)
  const BOT_FLOW = [
    { id: 'greeting', type: 'info' },
    { id: 'vehicle_plate', type: 'capture_image', title: t('chatbot.uploadNumberPlate') },
    { id: 'stencil', type: 'capture_image', title: t('chatbot.uploadStencilNumber') },
    { id: 'issue_image', type: 'capture_image', title: t('chatbot.captureTyreIssue') },
    {
      id: 'issues', type: 'checkbox', title: t('chatbot.selectIssues'), options: [
        t('chatbot.issues.tyreBurst'),
        t('chatbot.issues.tyrePuncture'),
        t('chatbot.issues.rimBreakDamage'),
        t('chatbot.issues.airBulge'),
        t('chatbot.issues.tyreRunflat'),
        t('chatbot.issues.cutsCracksDamage'),
        t('chatbot.issues.beltTreadSeparation')
      ]
    },
    { id: 'issue_image', type: 'capture_image', title: t('chatbot.captureRepairedPhoto') },
    { id: 'rate_card', type: 'rate_card', title: t('chatbot.rateCardTitle') },
  ];

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [flowIndex, setFlowIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [selectedIssues, setSelectedIssues] = useState([]);
  //   const [selectedApproach, setSelectedApproach] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  const listRef = useRef(null);
  const fileRef = useRef(null);

  // Issue Mapping Flow State
  const [tyreTypeOptions, setTyreTypeOptions] = useState([]);
  const [approachOptions, setApproachOptions] = useState([]);
  const [patchOptions, setPatchOptions] = useState([]);
  const [finalServiceOptions, setFinalServiceOptions] = useState([]);

  const [selectedTyreType, setSelectedTyreType] = useState("");
  const [selectedApproach, setSelectedApproach] = useState("");
  const [selectedPatch, setSelectedPatch] = useState("");

  const [currentIssue, setCurrentIssue] = useState("");

  // for sending issue mapping messages from bot 

  const [pendingMessage, setPendingMessage] = useState(null)
  const [botFinalMessageSent, serBotFinalMessageSent] = useState(false)


  const [askedForConfirmation, setAskedForConfirmation] = useState(false);



  // ticket Details
  const [ticketDetails, setTicketDetails] = useState(null);

  const fetchTicketDetails = async () => {
    const response = await fetch(`${API_BASE}/api/zoho/ticket/${ticketId}`);
    const data = await response.json();
    setTicketDetails(data?.data);
  }

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);



  function toLabel(str) {
    return str
      .replace(/([A-Z])/g, ' $1')   // insert space before capital letters
      .replace(/^./, s => s.toUpperCase()); // capitalize first letter
  }


  useEffect(() => {
    if (
      finalServiceOptions.length > 0  // flow completed
    ) {
      postMessage({
        who: "bot",
        text: t('chatbot.notedIssues'),
        meta: { step: "finalMapping", values: finalServiceOptions }
      });
    }
  }, [finalServiceOptions]);



  useEffect(() => {
    if (!pendingMessage) return;

    (async () => {

      try {
        await postMessage({
          who: "mechanic",
          text: `${toLabel(pendingMessage.step)} : ${pendingMessage.value}`,
          meta: { type: "mappingStep" }
        });

      } catch (error) {
        console.log("Error posting message : ", err)
      } finally {
        setPendingMessage(null)
      }
    })()
  }, [pendingMessage])



  useEffect(() => {
    console.log("[JobChat] mount", { ticketId, mechanicId, API_BASE });
    if (!ticketId) {
      setErrorText(t('errors.missingTicketId'));
      return;
    }
    if (!mechanicId) {
      setErrorText(t('errors.mechanicIdNotFound'));
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

  function makeInitialBotMessages(ticketId, driverName, driverPhone) {
    const msgs = [];

    // 1) Greeting / details message
    let detailsText = t('chatbot.greeting', { ticketId });
    if (driverPhone) {
      detailsText += `\n${t('chatbot.driverName', { name: driverPhone })}`;
    }
    if (driverName) {
      detailsText += `\n${t('chatbot.contact', { phone: driverName })}`;
    }
    msgs.push({
      who: 'bot',
      text: detailsText,
      meta: {},
      createdAt: new Date().toISOString()
    });

    // 2) Capture vehicle plate CTA (BOT_FLOW[1].title)
    const platePrompt = (BOT_FLOW[1] && BOT_FLOW[1].title) ? BOT_FLOW[1].title : t('chatbot.uploadNumberPlate');
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
        setErrorText(t('errors.serverReturnedEmpty'));
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
          // Messages from backend are in English, they will be translated when displayed
          setMessages(data.messages || []);
          setFlowIndex(data.flowIndex || 0);
          persistLocal(data, data.messages || [], data.flowIndex || 0);
        }
        console.log("[JobChat] loaded session from server", { sessionId: data._id, flowIndex: data.flowIndex, messagesCount: (data.messages || []).length, messages: data.messages });
      }
    } catch (err) {
      console.error("[JobChat] loadSession error", err);
      setErrorText(`${t('errors.failedToLoadSession')}: ${err?.message || err}`);
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
        // Messages from backend are in English, they will be translated when displayed via translateBotMessage
        setMessages(updated.messages || []);
        setFlowIndex(updated.flowIndex || flowIndex);
        persistLocal(updated, updated.messages || [], updated.flowIndex || flowIndex);
      } else {
        console.warn("[JobChat] postMessage returned no updated session", res.data);
      }
    } catch (err) {
      console.error("[JobChat] postMessage error", err);
      setErrorText(`${t('errors.failedToSend')}: ${err?.message || err}`);
    }
  }


  async function fetchField(filters, field) {
    try {
      const params = {};

      for (const key in filters) {
        // Only encode '+' → '%2B'
        params[key] = filters[key].replace(/\+/g, "%2B");
      }

      params.field = field;

      const response = await axios.get(
        `${API_BASE}/api/issues/getIssueMapping`,
        { params }
      );

      return response.data.values;
    } catch (error) {
      console.error("Error fetching issue data:", error);
      return [];
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
      alert(t('chatbot.pleaseSelectIssue'));
      return;
    }
    setSubmitting(true);
    
    // Convert translated issue names to English for backend
    const englishIssues = selectedIssues.map(issue => getEnglishIssueName(issue));
    const firstEnglishIssue = englishIssues[0];
    
    // Use English issue name for backend API
    handleIssueMapping(firstEnglishIssue);
    
    // Send English issue names to backend, but display translated text in chat
    await postMessage({ 
      who: "mechanic", 
      text: selectedIssues.join(", "), // Display translated text in chat
      meta: { type: "issues", issues: englishIssues } // Send English to backend
    });
    setSubmitting(false);
  }

  async function submitApproach() {
    if (selectedApproach.length === 0) {
      alert(t('chatbot.pleaseSelectTyreType'));
      return;
    }
    setSubmitting(true);
    // await postMessage({ who: "mechanic", text: selectedApproach.join(", "), meta: { type: "issues", approach: selectedApproach } });
    setSubmitting(false);
  }



  const handleMultiStepSubmit = async (selections, msg) => {
    // push mechanic reply to chat
    sendMessageToBackend({
      type: "multi-step-response",
      service: msg.meta.service,
      values: selections
    });
  };


  useEffect(() => {
    const lastBotMsg = messages[messages.length - 1];

    console.log("lastBotMsg", lastBotMsg)

    if (
      flowIndex === 6 &&
      lastBotMsg?.meta?.finalRateCard &&
      !askedForConfirmation
    ) {
      setAskedForConfirmation(true);

      postMessage({
        who: "bot",
        text: t('chatbot.confirmServices'),
        meta: { action: "confirm_job" }
      });
    }
  }, [messages, flowIndex]);




  const handleConfirmJob = async ({
    ticketId,
    mechanicId,
    driverPhone,
    regNumber,
    billAmount,
    startJobTime,
    endJobTime,
    issue,
  }) => {
    try {
      const response = await axios.patch(
        `${API_BASE}/api/zoho/ticket/updateViaFraud`,
        {
          mechanicId,
          driverPhone,
          regNumber,
          billAmount,
          ticketId,
        //   startJobTime,
        //   endJobTime,
          data: {
            cf: {
              cf_issue1: issue,
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Job confirm response:" , response?.data?.data)


      const fileUrls = messages
  .filter(
    msg =>
      typeof msg?.imageUrl === "string" &&
      msg.imageUrl.trim() !== ""
  )
  .map(msg => msg.imageUrl);


      console.log("fileUrls----->" , fileUrls)

      if (fileUrls.length > 0) {
        axios
          .patch(
            `${API_BASE}/api/zoho/ticket/uploadAttachment/${ticketId}`,
            { fileUrls },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then(() => {
            console.log("Attachments uploaded successfully");
          })
          .catch((err) => {
            console.error(
              "Attachment upload failed (non-blocking):",
              err?.response?.data || err.message
            );
          });
      }

      

      let textToSend = response?.data?.data?.fraud 
        ? t('chatbot.thanksConfirming', { status: response?.data?.data?.zohoStatus })
        : t('chatbot.jobClosed')

      // Add bot message after success
      postMessage({
        who: "bot",
        text: textToSend,
        meta: { action: "job_closed" },
      });
    } catch (err) {
      console.error("Failed to close job:", err);
    }
  };


  // Function to translate backend messages
  function translateBotMessage(text) {
    if (!text) return text;
    
    // If already translated (contains Hindi characters), return as is
    if (/[\u0900-\u097F]/.test(text)) {
      return text;
    }
    
    const lowerText = text.toLowerCase();
    
    // Pattern matching for common backend messages
    // Greeting with ticket info
    if (lowerText.includes('hi there') || lowerText.includes('here are the details') || lowerText.includes('service ticket')) {
      const ticketMatch = text.match(/Ticket ID[:\s]+([^\n]+)/i) || text.match(/Ticket[:\s]+([^\n]+)/i);
      const driverMatch = text.match(/Driver Name[:\s]+([^\n]+)/i);
      const contactMatch = text.match(/Contact[:\s]+([^\n]+)/i);
      
      let translated = t('chatbot.greeting', { ticketId: ticketMatch ? ticketMatch[1].trim() : '' });
      if (driverMatch) {
        translated += `\n${t('chatbot.driverName', { name: driverMatch[1].trim() })}`;
      }
      if (contactMatch) {
        translated += `\n${t('chatbot.contact', { phone: contactMatch[1].trim() })}`;
      }
      return translated;
    }
    
    // Upload number plate (various phrasings)
    if ((lowerText.includes('upload') || lowerText.includes('please upload')) && 
        (lowerText.includes('number plate') || lowerText.includes('vehicle') || lowerText.includes('plate'))) {
      return t('chatbot.uploadNumberPlate');
    }
    
    // Upload stencil number
    if ((lowerText.includes('upload') || lowerText.includes('please upload')) && 
        (lowerText.includes('stencil') || lowerText.includes('stencil number'))) {
      return t('chatbot.uploadStencilNumber');
    }
    
    // Capture tyre issue (various phrasings)
    if ((lowerText.includes('capture') || lowerText.includes('upload') || lowerText.includes('photo')) && 
        (lowerText.includes('tyre issue') || lowerText.includes('tyre problem') || lowerText.includes('problem'))) {
      return t('chatbot.captureTyreIssue');
    }
    
    // Capture repaired photo
    if ((lowerText.includes('capture') || lowerText.includes('upload')) && 
        (lowerText.includes('repaired') || lowerText.includes('fitted') || lowerText.includes('after repair'))) {
      return t('chatbot.captureRepairedPhoto');
    }
    
    // Select issues (various phrasings)
    if (lowerText.includes('pick the issues') || lowerText.includes('select issues') || 
        lowerText.includes('choose issues') || (lowerText.includes('issues') && lowerText.includes('list'))) {
      return t('chatbot.selectIssues');
    }
    
    // Rate card (various phrasings)
    if (lowerText.includes("rate card") || lowerText.includes('bill') || 
        (lowerText.includes('services') && lowerText.includes('provided'))) {
      return t('chatbot.rateCardTitle');
    }
    
    // Noted issues / start work
    if (lowerText.includes("noted the issues") || lowerText.includes("begin the repair") || 
        lowerText.includes("start your work") || lowerText.includes("all your information")) {
      return t('chatbot.notedIssues');
    }
    
    // Confirm services
    if ((lowerText.includes('confirm') || lowerText.includes('verify')) && 
        (lowerText.includes('services') || lowerText.includes('invoice'))) {
      return t('chatbot.confirmServices');
    }
    
    // Thanks for confirming
    if (lowerText.includes('thanks for confirming') || lowerText.includes('thank you for confirming')) {
      if (lowerText.includes('sent for') || lowerText.includes('sent to')) {
        const statusMatch = text.match(/sent (?:for|to)\s+([^.]+)/i);
        return t('chatbot.thanksConfirming', { status: statusMatch ? statusMatch[1].trim() : '' });
      }
      if (lowerText.includes('closed') || lowerText.includes('completed')) {
        return t('chatbot.jobClosed');
      }
      return t('chatbot.jobClosed');
    }
    
    // Vehicle matched
    if (lowerText.includes('vehicle') && (lowerText.includes('matched') || lowerText.includes('match'))) {
      const vehicleMatch = text.match(/Vehicle\s+([^\s]+)/i) || text.match(/([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4})/);
      if (vehicleMatch) {
        return t('chatbot.vehicleMatched', { vehicleNumber: vehicleMatch[1] });
      }
    }
    
    // Vehicle verified (handles "The vehicle UP78AX3921 is verified.")
    if (lowerText.includes('vehicle') && lowerText.includes('verified')) {
      // Try multiple patterns to extract vehicle number
      const vehicleMatch = text.match(/vehicle\s+([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4})/i) || 
                          text.match(/The vehicle\s+([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4})/i) ||
                          text.match(/([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4})/);
      if (vehicleMatch) {
        return t('chatbot.vehicleVerified', { vehicleNumber: vehicleMatch[1] });
      }
    }
    
    // Vehicle not matched
    if (lowerText.includes('vehicle') && (lowerText.includes('not match') || lowerText.includes('did not match'))) {
      const vehicleMatch = text.match(/Vehicle\s+([^\s]+)/i) || text.match(/([A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4})/);
      const phoneMatch = text.match(/\+?\d{10,}/);
      if (vehicleMatch) {
        return t('chatbot.vehicleNotMatched', { 
          vehicleNumber: vehicleMatch[1],
          phone: phoneMatch ? phoneMatch[0] : '+91 9999999999'
        });
      }
    }
    
    // Vehicle not verified (error)
    if (lowerText.includes('vehicle') && (lowerText.includes('not verified') || lowerText.includes('could not be verified') || 
        lowerText.includes('verification failed') || lowerText.includes('failed to verify'))) {
      return t('chatbot.vehicleNotVerified');
    }
    
    // Stencil not verified (error) - CHECK THIS FIRST before "found" or "verified"
    if (lowerText.includes('stencil') && (lowerText.includes('not verified') || lowerText.includes('could not be verified') || 
        lowerText.includes('verification failed') || lowerText.includes('failed to verify') || 
        (lowerText.includes('not') && lowerText.includes('found')))) {
      return t('chatbot.stencilNotVerified');
    }
    
    // Stencil verified
    if (lowerText.includes('stencil') && lowerText.includes('verified')) {
      const stencilMatch = text.match(/stencil number\s+([^\s]+)/i) || text.match(/stencil[:\s]+([^\s]+)/i);
      if (stencilMatch) {
        return t('chatbot.stencilVerified', { stencilNumber: stencilMatch[1] });
      }
    }
    
    // Stencil found
    if (lowerText.includes('stencil') && (lowerText.includes('found') || lowerText.includes('detected'))) {
      const stencilMatch = text.match(/Stencil number\s+([^\s]+)/i) || text.match(/stencil[:\s]+([^\s]+)/i);
      if (stencilMatch) {
        return t('chatbot.stencilFound', { stencilNumber: stencilMatch[1] });
      }
    }
    
    // Image received and saved successfully
    if (lowerText.includes('image received') && lowerText.includes('saved successfully')) {
      let translated = t('chatbot.imageReceived');
      if (lowerText.includes('updating') || lowerText.includes('service summary')) {
        translated += ' ' + t('chatbot.updatingServiceSummary');
      }
      return translated;
    }
    
    // Updating service summary (standalone)
    if (lowerText.includes('updating your service summary') || lowerText.includes('updating service summary')) {
      return t('chatbot.updatingServiceSummary');
    }
    
    // Return original if no match found (backend message stays as is)
    return text;
  }

  function renderBotBubble(msg, idx) {
    const currentFlow = BOT_FLOW[flowIndex] || {};
    // GET FINAL RATE CARD ONCE
    const rateCardMessage = messages.find(m => m.meta?.finalRateCard);
    const finalServiceCost = rateCardMessage?.meta?.finalRateCard;

    // console.log("finalServiceCost", finalServiceCost);

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

    // Translate the message text
    const translatedText = translateBotMessage(msg.text);

    return (
      <div className="max-w-[92%]" key={idx}>
        <div className="flex items-start gap-3">
          <img src={BOT_AVATAR} alt="bot" className="w-8 h-8 rounded-full object-contain border-2 border-[#FB8C0066] shadow-xl" />
          <div>
            <div className="bg-white rounded-tl-none rounded-xl p-3 text-sm text-gray-800 shadow-sm border border-[#FB8C0066]">
              <div className="whitespace-pre-wrap">{translatedText}</div>

              {shouldShowCapture && (
                <div className="mt-3">
                  <button onClick={onCaptureClick} className="w-full bg-[#FB8C00] hover:bg-orange-600 text-white rounded-md py-3 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h4l2-3h6l2 3h4v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                    {t('chatbot.captureImage')}
                  </button>
                </div>
              )}

              {currentFlow.type === "checkbox" && idx === lastBotIndex && messages[messages.length - 1].meta?.step != "finalMapping" && (

                currentFlow.options ? (<div className="mt-3 space-y-2">
                  {currentFlow.options.map(opt => (
                    <label key={opt} className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedIssues.includes(opt)} onChange={() => {
                        setSelectedIssues(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
                      }} />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                  <button className="w-full bg-[#FB8C00] text-white rounded-md py-2 mt-3" onClick={submitIssues} disabled={submitting}>{t('chatbot.submit')}</button>
                </div>) : (
                  <div className="mt-3 space-y-2">
                    {messages[messages.length - 1].who == "bot" && messages[messages.length - 1]?.meta?.steps[0]?.options?.map(opt => (
                      <label key={opt} className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedApproach.includes(opt)} onChange={() => {
                          setSelectedApproach(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
                        }} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                    <button className="w-full bg-[#FB8C00] text-white rounded-md py-2 mt-3" onClick={submitApproach} disabled={submitting}>{t('chatbot.submit')}</button>
                  </div>)
              )}


              {/* {
                currentFlow.type === "rate_card" && msg?.meta?.finalRateCard && (
                  <div className="w-full max-w-xs bg-gray-100 rounded-lg px-4 py-3 text-sm shadow-lg my-2 border-gray-300 border">
                    
                    <div className="flex justify-between font-semibold text-gray-700 mb-2">
                      <span>Services</span>
                      <span>Prices</span>
                    </div>

                    <div className=""></div>



                    {finalServiceCost?.success && Number(finalServiceCost?.totalCost) > 0 && (
                      finalServiceCost.breakdown?.map((item, index) => (
                        <div key={index} className="flex justify-between py-2">
                          <span className="text-gray-700">{item.service}</span>
                          <span className="font-medium text-gray-900">₹{item.cost}</span>
                        </div>
                      ))
                    )}

                    <div className="border-t border-gray-300 mt-1"></div>

                    <div className="flex justify-between py-2 font-semibold text-gray-900">
                      <span>Total</span>
                      <span className='font-bold'>₹{finalServiceCost?.totalCost}</span>
                    </div>
                  </div>

                )
              } */}


              {
                msg.who === "bot" &&
                (msg.text?.toLowerCase().includes("here's the rate card") || msg.text?.toLowerCase().includes("rate card")) &&
                finalServiceCost && (
                  <div className="w-full max-w-xs bg-gray-100 rounded-lg px-4 py-3 text-sm shadow-lg my-2 border-gray-300 border">
                    <div className="flex justify-between font-semibold text-gray-700 mb-2">
                      <span>{t('chatbot.services')}</span>
                      <span>{t('chatbot.prices')}</span>
                    </div>

                    {finalServiceCost.success &&
                      Number(finalServiceCost.totalCost) > 0 &&
                      finalServiceCost.breakdown?.map((item, index) => (
                        <div key={index} className="flex justify-between py-2">
                          <span className="text-gray-700">{item.service}</span>
                          <span className="font-medium text-gray-900">₹{item.cost}</span>
                        </div>
                      ))
                    }

                    <div className="border-t border-gray-300 mt-1"></div>

                    <div className="flex justify-between py-2 font-semibold text-gray-900">
                      <span>{t('chatbot.total')}</span>
                      <span className='font-bold'>₹{finalServiceCost.totalCost}</span>
                    </div>
                  </div>
                )
              }




              {/* {msg.meta?.action === "confirm_job" && (
                <div className="mt-3">
                  <button
                    className="w-full bg-[#FB8C00] text-white rounded-md py-3 font-semibold"
                    onClick={() => {
                      postMessage({
                        who: "bot",
                        text: "Thanks for confirming, your job is closed ✅",
                        meta: { action: "job_closed" }
                      });
                    }}
                  >
                    Confirm
                  </button>
                </div>
              )} */}

              {msg.meta?.action === "confirm_job" && (
                <div className="mt-3">
                  <button
                    className="w-full bg-[#FB8C00] text-white rounded-md py-3 font-semibold"
                    onClick={() =>
                        handleConfirmJob({
                          ticketId,
                          mechanicId,
                          driverPhone,
                          regNumber : ticketId?.cf?.cf_driver_vehicle_number,
                          billAmount: finalServiceCost?.totalCost,
                        //   startJobTime,
                        //   endJobTime,
                        issue :  messages.find(
                            (m) => m.meta?.type === "issues" && Array.isArray(m.meta?.issues)
                          )?.meta?.issues?.[0]
                        })
                      }
                  >
                    {t('common.confirm')}
                  </button>
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



  const handleIssueMapping = async (issueName) => {
    setCurrentIssue(issueName);

    // Step 1 → load tyreType
    const tyreTypes = await fetchField({ issue: issueName }, "tyreType");

    if (!tyreTypes[0]) {
      // Skip to approach
      const approaches = await fetchField({ issue: issueName }, "approach");
      setApproachOptions(approaches);
    } else {
      setTyreTypeOptions(tyreTypes);
    }
  };


  const handleTyreTypeSelect = async (tyreType) => {
    setSelectedTyreType(tyreType);

    const approaches = await fetchField(
      { issue: currentIssue, tyreType },
      "approach"
    );

    setApproachOptions(approaches);
  };

  const handleApproachSelect = async (approach) => {
    setSelectedApproach(approach);

    const patches = await fetchField(
      { issue: currentIssue, tyreType: selectedTyreType, approach },
      "patch"
    );

    console.log("patches", patches[0].split(':')[1])
    let strPatches = patches[0].split(':')[1]
    let patchesValue = strPatches && strPatches.split(',').map(Number);


    console.log("patchesValue", patchesValue)



    if (!patches[0]) {
      const finalServices = await fetchField(
        { issue: currentIssue, tyreType: selectedTyreType, approach },
        "finalService"
      );
      setFinalServiceOptions(finalServices);
      return;
    }

    setPatchOptions(patchesValue);
  };

  const handlePatchSelect = async (patch) => {

    console.log("patch selelct", patch)
    setSelectedPatch(patch);

    const finalServices = await fetchField(
      {
        issue: currentIssue,
        tyreType: selectedTyreType,
        approach: selectedApproach,
        patch: selectedPatch
      },
      "finalService"
    );

    setFinalServiceOptions(finalServices);
  };



  //   function renderIssueMappingBot(msg, idx) {

  //     console.log('tyreType' , tyreTypeOptions)
  //     console.log('appraochOptions' , approachOptions)



  //     // return  null;
  //     return (
  //       <div className="max-w-[92%]" key={idx}>
  //         <div className="flex items-start gap-3">
  //           <img src={BOT_AVATAR} alt="bot" className="w-8 h-8 rounded-full object-contain border border-[#FB8C0066] shadow-xl" />
  //           <div>
  //             <div className="bg-white rounded-tl-none rounded-xl p-3 text-sm text-gray-800 shadow-sm border border-[#FB8C0066]">
  //               <div className="whitespace-pre-wrap">Please Select Tyre Type</div>

  //               <div className="mt-3 space-y-2">
  //                 {tyreTypeOptions.map(opt => (
  //                   <label key={opt} className="flex items-center gap-3">
  //                     <input type="checkbox" checked={selectedApproach.includes(opt)} onChange={() => {
  //                       setSelectedApproach(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
  //                     }} />
  //                     <span className="text-sm">{opt}</span>
  //                   </label>
  //                 ))}
  //                 <button className="w-full bg-[#FB8C00] text-white rounded-md py-2 mt-3" onClick={submitApproach} disabled={submitting}>Submit</button>
  //               </div>


  //             </div>
  //             <div className="text-xs text-gray-400 mt-1">{formatTime(new Date())}</div>
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   }



  function renderIssueMappingBot() {

    // Step 1 – Tyre Type
    if (tyreTypeOptions.length > 0 && !selectedTyreType) {
      return renderOptions(
        t('chatbot.selectTyreType'),
        tyreTypeOptions,
        async (opt) => {
          handleTyreTypeSelect(opt);

          setPendingMessage({
            step: "tyreType",
            value: opt
          });
        }
      );
    }

    // Step 2 – Approach
    if (approachOptions.length > 0 && !selectedApproach) {
      return renderOptions(
        t('chatbot.selectApproach'),
        approachOptions,
        async (opt) => {
          handleApproachSelect(opt);

          setPendingMessage({
            step: "approach",
            value: opt
          });
        }
      );
    }

    // Step 3 – Patch
    if (patchOptions.length > 0 && !selectedPatch) {
      return renderOptions(
        t('chatbot.selectPatch'),
        patchOptions,
        async (opt) => {
          handlePatchSelect(opt);

          setPendingMessage({
            step: "patch",
            value: opt
          });
        }
      );
    }

    // Step 4 – Final Service
    // Log final object
    const finalObject = {
      tyreType: selectedTyreType || null,
      approach: selectedApproach || null,
      patch: selectedPatch || null,
      finalService: finalServiceOptions.length > 0 ? finalServiceOptions[0] : null // optional
    };
    console.log("Final Object for Pricing/Records:", finalObject);



    // if (finalServiceOptions.length > 0) {


    //   return (
    //     <div className="p-4 bg-white rounded-md border shadow-sm mt-3">
    //       <p className="text-gray-700 font-medium">Thanks for the details!</p>
    //     </div>
    //   );
    // }

    return null;
  }




  function renderOptions(title, list, onSelect) {
    return (
      <div className="max-w-[92%]">
        <div className="flex items-start gap-3">
          <img
            src={BOT_AVATAR}
            alt="bot"
            className="w-8 h-8 rounded-full object-contain border border-[#FB8C0066] shadow-xl"
          />
          <div>
            <div className="bg-white rounded-tl-none rounded-xl p-3 text-sm text-gray-800 shadow-sm border border-[#FB8C0066]">
              <div className="font-medium mb-2">{title}</div>

              <div className="space-y-3">
                {list.map((opt) => (
                  <button
                    key={opt}
                    className="w-full bg-gray-100 p-2 rounded-md text-left active:bg-[#FB8C00] active:text-white"
                    onClick={() => onSelect(opt)}
                  >
                    {opt || t('chatbot.none')}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-400 mt-1">
              {formatTime(new Date())}
            </div>
          </div>
        </div>
      </div>
    );
  }





  const lastMultiStepIndex = messages
    .map((m, i) => (m.meta?.type === "multi-step" ? i : -1))
    .filter(i => i !== -1)
    .pop();  // the last index




  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-200 bg-[#EBEBEB] border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">←</button> */}
            <img src={BOT_AVATAR} alt="bot" className="w-8 h-8 p-1 rounded-full object-contain border border-[#FB8C0066] shadow-xl" />

            <div>
              <div className="text-sm font-semibold">{ticketDetails?.cf?.cf_driver_vehicle_number}</div>
              {/* <div className="text-xs text-gray-500">{driverName ? `${driverName} • ${driverPhone}` : `Ticket ${ticketId || ''}`}</div> */}
            </div>
          </div>
          {/* <div className="text-xs text-gray-400"><ImCross /></div> */}
          <ImCross className='text-xs font-light' onClick={() => navigate(-1)} />
        </div>
      </div>

      <div ref={listRef} className="flex-1 px-4 py-4 overflow-auto space-y-3 max-w-2xl mx-auto w-full">
        {loading && <div className="text-center text-sm text-gray-500">{t('chatbot.loading')}</div>}
        {errorText && <div className="text-center text-sm text-red-600">{errorText}</div>}

        {/* Fallback here once multi fail */}
        {messages.map((m, i) => (
          <div className={`w-full flex ${m.who === 'mechanic' ? 'justify-end' : 'justify-start'}`} key={i}>
            {m.who === 'mechanic' ? renderMechanicBubble(m, i) : renderBotBubble(m, i)}
          </div>
        ))}

        {renderIssueMappingBot()}




        {/* {messages.map((msg, idx) => {

          // hide all older multi-step messages
          if (msg.meta?.type === "multi-step" && idx !== lastMultiStepIndex) {
            return null;
          }

          // render only the latest one
          if (msg.meta?.type === "multi-step" && idx === lastMultiStepIndex) {
            return (
              <MultiStepUI
                key={idx}
                meta={msg.meta}
                onSubmit={(data) => handleMultiStepSubmit(data, msg)}
              />
            );
          }

        //   return <div key={idx}>{msg.text}</div>;
        })} */}




      </div>

      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSendText()} className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm" placeholder={t('chatbot.typeMessage')} />
          <button onClick={onSendText} className="bg-[#FB8C00] text-white rounded-full px-4 py-2">{t('chatbot.send')}</button>
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

