import { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { Message } from './types';
import { sendMessage } from './api/chat';
import './App.css';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendMessage(text);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        displayType: response.displayType,
        data: response.data,
        columns: response.columns,
        chartConfig: response.chartConfig,
        kpiValue: response.kpiValue,
        sql: response.sql,
        error: response.error,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        displayType: 'text',
        error: 'Request failed',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Conversational Data Analyst</h1>
      </header>
      <ChatWindow messages={messages} />
      <InputBar onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export default App;
