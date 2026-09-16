import { ChatResponse } from '../types';

export async function sendMessage(message: string): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    if (errorData?.answer) {
      return errorData as ChatResponse;
    }
    throw new Error(`Server error: ${res.status}`);
  }

  return res.json();
}
