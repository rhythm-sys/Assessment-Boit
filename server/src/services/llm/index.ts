import { LlmResponse } from '../../types';
import { mockLlm } from './mock';

export function processQuestion(question: string): LlmResponse | null {
  // Factory pattern: extend here for real LLM providers
  // For now, always use mock
  return mockLlm(question);
}
