import Dexie, { type Table } from 'dexie';
import type { Session, Trial, SessionSummary } from './models';

export class AttentionDB extends Dexie {
  sessions!: Table<Session, string>;
  trials!: Table<Trial, string>;
  sessionSummaries!: Table<SessionSummary, string>;

  constructor() {
    super('AttentionDB');
    this.version(1).stores({
      sessions: 'id, exerciseType, startedAt, completedAt, difficulty',
      trials: 'id, sessionId, timestamp, isTarget, correct',
      sessionSummaries: 'sessionId',
    });
    // v2: compound index for efficient exerciseType+startedAt range queries
    this.version(2).stores({
      sessions: 'id, exerciseType, startedAt, completedAt, difficulty, [exerciseType+startedAt]',
      trials: 'id, sessionId, timestamp, isTarget, correct',
      sessionSummaries: 'sessionId',
    });
  }
}

export const db = new AttentionDB();
