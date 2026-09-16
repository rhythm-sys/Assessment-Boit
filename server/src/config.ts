import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  llmProvider: process.env.LLM_PROVIDER || 'mock',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
};
