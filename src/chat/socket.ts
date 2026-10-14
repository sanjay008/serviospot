import { API_URL, getAuthToken } from '@/api/client';

/**
 * Live chat socket. The REST calls still save the chat.
 * Backend should accept this WebSocket and relay `message` events.
 *
 * Client sends:
 *   { "event": "auth", "token": "..." }
 *   { "event": "join", "conversation_id": "1" }
 *   { "event": "leave", "conversation_id": "1" }
 *   { "event": "message", "conversation_id": "1", "message": "Hello" }
 *
 * Server sends:
 *   { "event": "message", "conversation_id": "1", "id": 9, "from": "customer", "message": "Hello", "created_at": "..." }
 */

export type SocketChatMessage = {
  conversationId: string;
  id?: string | number;
  from?: string;
  message?: string;
  text?: string;
  created_at?: string;
  is_mine?: boolean;
};

type Incoming = {
  event?: string;
  conversation_id?: string | number;
  id?: string | number;
  message_id?: string | number;
  from?: string;
  sender?: string;
  message?: string | Incoming;
  text?: string;
  body?: string;
  created_at?: string;
  at?: string;
  is_mine?: boolean;
};

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL.replace(/^http/i, 'ws') + '/serviospot/chat';

const listeners = new Set<(message: SocketChatMessage) => void>();
const rooms = new Set<string>();

let socket: WebSocket | null = null;
let token = '';
let stopped = true;
let retry = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
let loggedFailure = false;

function send(payload: Record<string, unknown>) {
  if (socket?.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function scheduleReconnect() {
  if (stopped || timer) return;
  const wait = Math.min(30000, 1000 * 2 ** retry);
  retry = Math.min(retry + 1, 5);
  timer = setTimeout(() => {
    timer = null;
    open();
  }, wait);
}

function publish(raw: Incoming) {
  const nested = raw.message && typeof raw.message === 'object' ? raw.message : null;
  const conversationId = String(raw.conversation_id ?? nested?.conversation_id ?? '');
  const nestedText = nested && typeof nested.message === 'string' ? nested.message : nested?.text ?? nested?.body;
  const text = nestedText ?? (typeof raw.message === 'string' ? raw.message : raw.text ?? raw.body);
  if (!conversationId || !text) return;
  const message: SocketChatMessage = {
    conversationId,
    id: nested?.id ?? nested?.message_id ?? raw.id ?? raw.message_id,
    from: nested?.from ?? nested?.sender ?? raw.from ?? raw.sender,
    message: text,
    created_at: nested?.created_at ?? nested?.at ?? raw.created_at ?? raw.at,
    is_mine: nested?.is_mine ?? raw.is_mine,
  };
  listeners.forEach((listener) => listener(message));
}

function open() {
  if (stopped || !token || socket) return;
  let next: WebSocket;
  try {
    next = new WebSocket(SOCKET_URL);
  } catch {
    scheduleReconnect();
    return;
  }
  socket = next;
  next.onopen = () => {
    retry = 0;
    loggedFailure = false;
    send({ event: 'auth', token });
    rooms.forEach((conversationId) => send({ event: 'join', conversation_id: conversationId }));
  };
  next.onmessage = (event) => {
    try {
      const data = JSON.parse(String(event.data)) as Incoming;
      if (data.event === 'message') publish(data);
    } catch {
      // Ignore a frame that is not the chat JSON.
    }
  };
  next.onerror = () => {
    if (__DEV__ && !loggedFailure) {
      loggedFailure = true;
      console.log(`[chat] socket not connected yet ${SOCKET_URL}`);
    }
  };
  next.onclose = () => {
    if (socket === next) socket = null;
    scheduleReconnect();
  };
}

export const chatSocket = {
  connect(nextToken: string) {
    token = nextToken;
    stopped = false;
    if (socket) return;
    open();
  },
  disconnect() {
    stopped = true;
    token = '';
    rooms.clear();
    if (timer) clearTimeout(timer);
    timer = null;
    socket?.close();
    socket = null;
  },
  join(conversationId: string) {
    if (!conversationId) return;
    rooms.add(conversationId);
    send({ event: 'join', conversation_id: conversationId });
  },
  leave(conversationId: string) {
    rooms.delete(conversationId);
    send({ event: 'leave', conversation_id: conversationId });
  },
  /** Tells the server a message was saved, so it can show it to the other person. */
  relay(conversationId: string, message: string) {
    send({ event: 'message', conversation_id: conversationId, message });
  },
  subscribe(listener: (message: SocketChatMessage) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function connectChatSocket() {
  const current = getAuthToken();
  if (current) chatSocket.connect(current);
}
