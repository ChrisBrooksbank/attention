import type { Session, Trial, SessionSummary } from '../db/models';

export interface ExportData {
  exportedAt: string;
  sessions: Session[];
  trials: Trial[];
  summaries: SessionSummary[];
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().slice(0, 10);
  triggerDownload(json, `attention-data-${date}.json`, 'application/json');
}

function escapeCSV(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(values: (string | number | boolean | null | undefined)[]): string {
  return values.map(escapeCSV).join(',');
}

export function exportCSV(data: ExportData): void {
  const date = new Date().toISOString().slice(0, 10);

  // Sessions sheet
  const sessionHeaders = [
    'id', 'exerciseType', 'startedAt', 'completedAt', 'difficulty',
    'targetLetter', 'targetRate', 'nLevel', 'stimulusDurationMs', 'interStimulusMs', 'totalTrials',
    'hits', 'misses', 'falseAlarms', 'correctRejections', 'accuracy', 'dPrime', 'meanReactionMs', 'medianReactionMs',
  ];

  const summaryMap = new Map(data.summaries.map((s) => [s.sessionId, s]));

  const sessionRows = data.sessions.map((s) => {
    const summary = summaryMap.get(s.id);
    return rowToCSV([
      s.id,
      s.exerciseType,
      s.startedAt instanceof Date ? s.startedAt.toISOString() : String(s.startedAt),
      s.completedAt instanceof Date ? s.completedAt.toISOString() : String(s.completedAt),
      s.difficulty,
      s.config.targetLetter ?? '',
      s.config.targetRate ?? '',
      s.config.nLevel ?? '',
      s.config.stimulusDurationMs ?? '',
      s.config.interStimulusMs ?? '',
      s.config.totalTrials ?? '',
      summary?.hits ?? '',
      summary?.misses ?? '',
      summary?.falseAlarms ?? '',
      summary?.correctRejections ?? '',
      summary?.accuracy ?? '',
      summary?.dPrime ?? '',
      summary?.meanReactionMs ?? '',
      summary?.medianReactionMs ?? '',
    ]);
  });

  const sessionsCSV = [sessionHeaders.join(','), ...sessionRows].join('\n');

  // Trials sheet
  const trialHeaders = [
    'id', 'sessionId', 'stimulus', 'isTarget', 'responded', 'reactionTimeMs', 'correct', 'timestamp',
  ];

  const trialRows = data.trials.map((t) =>
    rowToCSV([
      t.id,
      t.sessionId,
      t.stimulus,
      t.isTarget,
      t.responded,
      t.reactionTimeMs,
      t.correct,
      t.timestamp instanceof Date ? t.timestamp.toISOString() : String(t.timestamp),
    ])
  );

  const trialsCSV = [trialHeaders.join(','), ...trialRows].join('\n');

  // Combine into a single file with section headers
  const combined = `SESSIONS\n${sessionsCSV}\n\nTRIALS\n${trialsCSV}`;
  triggerDownload(combined, `attention-data-${date}.csv`, 'text/csv');
}
