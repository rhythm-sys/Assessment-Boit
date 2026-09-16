import { Router, Request, Response } from 'express';
import { ChatRequest, ChatResponse } from '../types';
import { processQuestion } from '../services/llm/index';
import { validateSql } from '../services/sqlValidator';
import { executeQuery } from '../services/queryExecutor';
import { formatResponse } from '../services/responseFormatter';

const router = Router();

router.post('/chat', (req: Request<object, object, ChatRequest>, res: Response<ChatResponse>) => {
  try {
    const { message } = req.body;

    // Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({
        answer: 'Please provide a valid question.',
        displayType: 'text',
        error: 'Empty or invalid message',
      });
      return;
    }

    if (message.length > 500) {
      res.status(400).json({
        answer: 'Your question is too long. Please keep it under 500 characters.',
        displayType: 'text',
        error: 'Message too long',
      });
      return;
    }

    // Step 1: Process question through LLM
    const llmResult = processQuestion(message.trim());

    if (!llmResult) {
      res.json({
        answer: "I couldn't understand that question. Try asking about customers, transactions, branches, onboarding applications, or segments. For example: \"Show monthly onboarding applications by segment\" or \"Which branches have the highest rejection rate?\"",
        displayType: 'text',
      });
      return;
    }

    // Step 2: Validate generated SQL
    const validation = validateSql(llmResult.sql);

    if (!validation.valid) {
      res.status(400).json({
        answer: 'The generated query could not be validated for safety.',
        displayType: 'text',
        error: validation.error,
      });
      return;
    }

    // Step 3: Execute validated SQL
    const queryResult = executeQuery(validation.sanitizedSql);

    // Step 4: Format and return response
    const response = formatResponse(
      { ...llmResult, sql: validation.sanitizedSql },
      queryResult
    );

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    res.status(500).json({
      answer: 'Sorry, something went wrong while processing your question.',
      displayType: 'text',
      error: message,
    });
  }
});

export default router;
