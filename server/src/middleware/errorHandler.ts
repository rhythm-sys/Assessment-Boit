import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    answer: 'An internal server error occurred.',
    displayType: 'text',
    error: err.message,
  });
}
