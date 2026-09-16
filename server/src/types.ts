export interface ChatRequest {
  message: string;
}

export interface ChartConfig {
  xKey: string;
  yKey: string;
  chartType: 'bar' | 'line' | 'pie';
}

export type DisplayType = 'text' | 'table' | 'chart' | 'kpi';

export interface LlmResponse {
  table: string;
  sql: string;
  displayType: DisplayType;
  chartConfig?: ChartConfig;
  answerTemplate: string;
}

export interface ChatResponse {
  answer: string;
  displayType: DisplayType;
  data?: Record<string, unknown>[];
  columns?: string[];
  chartConfig?: ChartConfig;
  kpiValue?: string | number;
  sql?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  sanitizedSql: string;
  error?: string;
}

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
}
