import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.length === 0 && (
        <div className="welcome">
          <h2>Conversational Data Analyst</h2>
          <p>Ask questions about your banking data. Try:</p>
          <ul>
            <li>"Show monthly onboarding applications by customer segment"</li>
            <li>"Which branches have the highest rejection rate?"</li>
            <li>"Compare retail and SME onboarding volumes"</li>
            <li>"Show the top five customers by transaction value"</li>
            <li>"How many customers do we have?"</li>
            <li>"Show recent transactions"</li>
          </ul>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
