import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ApiClientService } from '../api-client/api-client.service';
import { SessionStore } from './session.store';
import { ScenarioDto } from '../common/dto/scenario.dto';
import { GameSummaryDto } from '../common/dto/game-summary.dto';
import { CategoryId } from '../common/enums/category-id.enum';

export interface StartSessionResult {
  sessionId: string;
  firstScenario: ScenarioDto;
}

export interface SubmitAnswerResult {
  /** True when the selected choice was correct. */
  wasCorrect: boolean;
  /** Present while the game continues — the next scenario to display. */
  nextScenario?: ScenarioDto;
  /** Present when the game has just ended. */
  gameOver?: GameOverPayload;
}

export interface GameOverPayload {
  reason: 'max_incorrect' | 'max_choices';
  summary: GameSummaryDto;
  totalScenarios: number;
  incorrectAnswers: number;
}

/**
 * Core orchestrator for the EduKids gameplay loop.
 *
 * The external API now returns a complete Scenario upfront (all choices,
 * correctness flags, and feedback included). The backend no longer submits
 * the player's choice to the API — it evaluates correctness locally by
 * looking up the selected choice inside the scenario, updates session
 * counters, and either fetches the next scenario or ends the session.
 *
 * Flow per answer submission:
 *  1. Validate the session is still active.
 *  2. Locate the selected choice inside the scenario and determine correctness.
 *  3. Update local session counters; check termination conditions.
 *  4a. Game over  → call endSession on the API, return summary.
 *  4b. Continues  → fetch the next Scenario, return it.
 */
@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly apiClient: ApiClientService,
    private readonly sessionStore: SessionStore,
  ) {}

  // ─── Session start ────────────────────────────────────────────────────────

  async startSession(categoryId: CategoryId): Promise<StartSessionResult> {
    const sessionId = await this.apiClient.createSession(categoryId);
    this.sessionStore.create(sessionId);

    this.logger.log(`Session started: ${sessionId} (category: ${categoryId})`);

    const firstScenario = await this.apiClient.fetchNextScenario(sessionId);
    return { sessionId, firstScenario };
  }

  // ─── Answer submission ────────────────────────────────────────────────────

  /**
   * Record the player's answer for the current scenario.
   *
   * @param sessionId       Active session ID.
   * @param scenarioId      ID of the scenario being answered (used for logging).
   * @param selectedChoiceId  ID of the Choice the player clicked.
   * @param scenario        The full ScenarioDto previously sent to the frontend,
   *                        passed back in so the backend can look up isCorrect
   *                        without an extra API call.
   */
  async submitAnswer(
    sessionId: string,
    scenarioId: string,
    selectedChoiceId: string,
    scenario: ScenarioDto,
  ): Promise<SubmitAnswerResult> {
    const state = this.sessionStore.snapshot(sessionId);

    if (state.isOver) {
      throw new ConflictException(
        `Session "${sessionId}" has already ended. Start a new session to play again.`,
      );
    }

    // Locate the chosen option within the scenario
    const selectedChoice = scenario.choices.find(
      (c) => c.id === selectedChoiceId,
    );

    if (!selectedChoice) {
      throw new BadRequestException(
        `Choice "${selectedChoiceId}" does not belong to scenario "${scenarioId}".`,
      );
    }

    const wasCorrect = selectedChoice.isCorrect;
    const updatedState = this.sessionStore.recordChoice(sessionId, !wasCorrect);

    this.logger.log(
      `Session ${sessionId} — scenario ${updatedState.totalChoices}/${20}, ` +
        `incorrect: ${updatedState.incorrectChoices}/3, correct: ${wasCorrect}`,
    );

    // Termination condition met
    if (updatedState.isOver) {
      return this.handleGameOver(sessionId, wasCorrect, updatedState);
    }

    // Game continues — fetch the next scenario
    const nextScenario = await this.apiClient.fetchNextScenario(sessionId);
    return { wasCorrect, nextScenario };
  }

  // ─── Game over ────────────────────────────────────────────────────────────

  private async handleGameOver(
    sessionId: string,
    wasCorrect: boolean,
    state: ReturnType<SessionStore['snapshot']>,
  ): Promise<SubmitAnswerResult> {
    const reason = state.endReason!;

    this.logger.log(
      `Session ${sessionId} ended — reason: ${reason}, ` +
        `scenarios: ${state.totalChoices}, incorrect: ${state.incorrectChoices}`,
    );

    const summary = await this.apiClient.endSession(sessionId, reason);
    this.sessionStore.delete(sessionId);

    const gameOver: GameOverPayload = {
      reason,
      summary,
      totalScenarios: state.totalChoices,
      incorrectAnswers: state.incorrectChoices,
    };

    return { wasCorrect, gameOver };
  }

  // ─── Manual termination ───────────────────────────────────────────────────

  async forceEndSession(sessionId: string): Promise<GameOverPayload> {
    const state = this.sessionStore.snapshot(sessionId);

    if (state.isOver) {
      throw new ConflictException(`Session "${sessionId}" has already ended.`);
    }

    this.sessionStore.markOver(sessionId, 'max_choices');
    const summary = await this.apiClient.endSession(sessionId, 'max_choices');
    this.sessionStore.delete(sessionId);

    return {
      reason: 'max_choices',
      summary,
      totalScenarios: state.totalChoices,
      incorrectAnswers: state.incorrectChoices,
    };
  }

  // ─── Read-only helpers ────────────────────────────────────────────────────

  getSessionStatus(sessionId: string) {
    const state = this.sessionStore.snapshot(sessionId);
    return {
      sessionId: state.sessionId,
      totalScenarios: state.totalChoices,
      incorrectAnswers: state.incorrectChoices,
      isOver: state.isOver,
      endReason: state.endReason ?? null,
      startedAt: state.startedAt,
    };
  }
}
