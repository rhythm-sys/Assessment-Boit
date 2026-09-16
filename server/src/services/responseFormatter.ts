import { ChatResponse, LlmResponse, QueryResult } from '../types';

export function formatResponse(llmResult: LlmResponse, queryResult: QueryResult): ChatResponse {
  const { displayType, chartConfig, answerTemplate, sql } = llmResult;
  const { columns, rows } = queryResult;

  let answer = answerTemplate;

  // Interpolate template with first row values
  if (rows.length > 0) {
    const firstRow = rows[0];
    for (const [key, value] of Object.entries(firstRow)) {
      answer = answer.replace(`{${key}}`, String(value ?? 'N/A'));
    }
    answer = answer.replace('{rowCount}', String(rows.length));
  }

  const response: ChatResponse = {
    answer,
    displayType,
    sql,
  };

  switch (displayType) {
    case 'kpi':
      if (rows.length > 0) {
        const firstRow = rows[0];
        const firstValue = Object.values(firstRow)[0];
        response.kpiValue = firstValue as string | number;
        response.data = rows;
        response.columns = columns;
      }
      break;

    case 'table':
      response.data = rows;
      response.columns = columns;
      break;

    case 'chart':
      response.data = rows;
      response.columns = columns;
      response.chartConfig = chartConfig;
      break;

    case 'text':
    default:
      response.data = rows;
      response.columns = columns;
      break;
  }

  return response;
}
