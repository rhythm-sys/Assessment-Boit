import { Message } from '../types';
import DataTable from './DataTable';
import ChartView from './ChartView';
import KpiCard from './KpiCard';
import CopyButton from './CopyButton';

interface MessageBubbleProps {
  message: Message;
}

function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.join(',');
  const body = rows.map((row) => columns.map((col) => String(row[col] ?? '')).join(',')).join('\n');
  return `${header}\n${body}`;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <div className="message user-message">
        <div className="message-content">{message.content}</div>
      </div>
    );
  }

  const getCopyText = (): string => {
    if (message.data && message.columns && message.columns.length > 0) {
      return toCsv(message.columns, message.data);
    }
    if (message.kpiValue !== undefined) {
      return `${message.content}: ${message.kpiValue}`;
    }
    return message.content;
  };

  return (
    <div className="message assistant-message">
      <div className="message-content">
        <p className="answer-text">{message.content}</p>

        {message.displayType === 'kpi' && message.kpiValue !== undefined && (
          <KpiCard value={message.kpiValue} label={message.content} />
        )}

        {message.displayType === 'table' && message.data && message.columns && (
          <DataTable columns={message.columns} rows={message.data} />
        )}

        {message.displayType === 'chart' && message.data && message.chartConfig && (
          <ChartView data={message.data} chartConfig={message.chartConfig} />
        )}

        {message.sql && (
          <details className="sql-details">
            <summary>View SQL</summary>
            <pre><code>{message.sql}</code></pre>
          </details>
        )}

        <div className="message-actions">
          <CopyButton getText={getCopyText} label="Copy" />
        </div>
      </div>
    </div>
  );
}
