// src/services/socketClient.js
import { io } from 'socket.io-client';

let socket = null;
let optionsUsed = null;

/**
 * initSocket(serverUrl, opts)
 * - returns socket instance (singleton)
 */
export function initSocket(serverUrl, { mechanicId, token, path } = {}) {
  if (socket) return socket;

  const url = serverUrl || import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  optionsUsed = { url, mechanicId };

  socket = io(url, {
    path: path || '/socket.io',
    transports: ['websocket', 'polling'],
    auth: token ? { token } : undefined,
    // don't rely on query for auth/registration; we'll emit mechanic_register explicitly
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id, optionsUsed);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error', err && (err.message || err));
  });

  socket.on('reconnect_attempt', (attempt) => {
    console.log('[socket] reconnect attempt', attempt);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });

  return socket;
}

/** registerMechanic - emits mechanic_register and returns promise that resolves with ack */
export function registerMechanic(mechanicId) {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not initialized'));
    if (!mechanicId) return reject(new Error('mechanicId required'));

    // send mechanic_register and wait for callback ack
    socket.emit('mechanic_register', { mechanicId }, (ack) => {
      console.log('[socket] mechanic_register ack', mechanicId, ack);
      if (ack && ack.ok) return resolve(ack);
      // accept successful even if ack not ok, but resolve for debugging
      return resolve(ack || { ok: false });
    });

    // also set a timeout to fail if no ack arrives
    setTimeout(() => {
      // if no ack printed in logs, still resolve but mark as timeout
      resolve({ ok: false, message: 'register timeout (no ack)' });
    }, 5000);
  });
}

export function getSocket() {
  return socket;
}

export function on(event, handler) {
  if (!socket) {
    console.warn('[socket] on before init', event);
    return;
  }
  socket.on(event, handler);
}

export function off(event, handler) {
  if (!socket) return;
  if (handler) socket.off(event, handler);
  else socket.removeAllListeners(event);
}

export function emit(event, payload = {}, ack) {
  if (!socket) {
    console.warn('[socket] emit before init', event);
    return;
  }
  if (ack && typeof ack === 'function') socket.emit(event, payload, ack);
  else socket.emit(event, payload);
}

export function disconnectSocket() {
  if (!socket) return;
  try { socket.disconnect(); } catch (e) { console.warn(e); }
  socket = null;
  optionsUsed = null;
}
