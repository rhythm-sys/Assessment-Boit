import { useEffect, useRef } from 'react';
import type { Message } from '../types';
import MessageBubble from './MessageBubble';

const SUGGESTIONS = [
  'Show monthly onboarding applications by customer segment',
  'Which branches have the highest rejection rate?',
  'Compare retail and SME onboarding volumes',
  'Show the top five customers by transaction value',
  'How many customers do we have?',
  'Show recent transactions',
];

interface ChatWindowProps {
  messages: Message[];
  onSuggestionClick: (text: string) => void;
}

export default function ChatWindow({ messages, onSuggestionClick }: ChatWindowProps) {
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
            {SUGGESTIONS.map((s) => (
              <li key={s} onClick={() => onSuggestionClick(s)}>{s}</li>
            ))}
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
