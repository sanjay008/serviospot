import { useEffect, useRef } from 'react';

import { chatSocket, connectChatSocket } from '@/chat/socket';
import { useApp } from '@/state/store';

/** Keeps the chat socket open while someone is signed in. */
export function ChatLive() {
  const { session, receiveChat } = useApp();
  const receive = useRef(receiveChat);
  receive.current = receiveChat;

  useEffect(() => {
    return chatSocket.subscribe((message) => receive.current(message.conversationId, message));
  }, []);

  useEffect(() => {
    if (!session.signedIn) {
      chatSocket.disconnect();
      return;
    }
    connectChatSocket();
    return () => chatSocket.disconnect();
  }, [session.signedIn]);

  return null;
}
