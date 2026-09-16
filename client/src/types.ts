export interface ChartConfig {
  xKey: string;
  yKey: string;
  chartType: 'bar' | 'line' | 'pie';
}

export type DisplayType = 'text' | 'table' | 'chart' | 'kpi';

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

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayType?: DisplayType;
  data?: Record<string, unknown>[];
  columns?: string[];
  chartConfig?: ChartConfig;
  kpiValue?: string | number;
  sql?: string;
  error?: string;
}
