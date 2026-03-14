import { Injectable, NotFoundException } from '@nestjs/common';

export const MAX_INCORRECT = 3;
export const MAX_CHOICES = 20;

export interface SessionState {
  sessionId: string;
  totalChoices: number;
  incorrectChoices: number;
  isOver: boolean;
  endReason?: 'max_incorrect' | 'max_choices';
  startedAt: Date;
}

/**
 * Lightweight in-memory store for active game session state.
 *
 * In a production deployment this would be replaced by Redis or a database,
 * but for a single-node server this Map is perfectly adequate.
 */
@Injectable()
export class SessionStore {
  private readonly sessions = new Map<string, SessionState>();

  create(sessionId: string): SessionState {
    const state: SessionState = {
      sessionId,
      totalChoices: 0,
      incorrectChoices: 0,
      isOver: false,
      startedAt: new Date(),
    };
    this.sessions.set(sessionId, state);
    return state;
  }

  get(sessionId: string): SessionState {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new NotFoundException(`Session "${sessionId}" not found`);
    }
    return state;
  }

  /**
   * Record one choice submission and return the updated state.
   * Also sets isOver + endReason when a termination condition is met.
   */
  recordChoice(
    sessionId: string,
    wasIncorrect: boolean,
  ): SessionState {
    const state = this.get(sessionId);

    state.totalChoices += 1;
    if (wasIncorrect) {
      state.incorrectChoices += 1;
    }

    if (state.incorrectChoices >= MAX_INCORRECT) {
      state.isOver = true;
      state.endReason = 'max_incorrect';
    } else if (state.totalChoices >= MAX_CHOICES) {
      state.isOver = true;
      state.endReason = 'max_choices';
    }

    return state;
  }

  markOver(
    sessionId: string,
    reason: 'max_incorrect' | 'max_choices',
  ): void {
    const state = this.get(sessionId);
    state.isOver = true;
    state.endReason = reason;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Expose current state snapshot without mutating it. */
  snapshot(sessionId: string): Readonly<SessionState> {
    return this.get(sessionId);
  }
}
