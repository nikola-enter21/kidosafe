import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ScenarioDto } from '../common/dto/scenario.dto';
import { GameSummaryDto } from '../common/dto/game-summary.dto';
import { CategoryDto } from '../common/dto/category.dto';
import { CategoryId } from '../common/enums/category-id.enum';

/**
 * Thin wrapper around every HTTP call made to the external scenario-generation API.
 * All methods throw BadGatewayException when the API is unreachable or returns an error,
 * so callers only need to handle business logic.
 */
@Injectable()
export class ApiClientService {
  private readonly logger = new Logger(ApiClientService.name);

  constructor(private readonly http: HttpService) {}

  // ─── Categories ───────────────────────────────────────────────────────────────

  /**
   * Fetch the list of available game categories from the API.
   * Called once before session creation so the player can pick a theme.
   */
  async fetchCategories(): Promise<CategoryDto[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<CategoryDto[]>('/categories'),
      );
      return data;
    } catch (err) {
      this.logger.error(`fetchCategories failed: ${err.message}`);
      throw new BadGatewayException('Failed to fetch categories from API');
    }
  }

  // ─── Study Materials ──────────────────────────────────────────────────────────

  /**
   * Forward extracted plain-text study material to the API before a session starts.
   * The API may use this to tailor generated scenarios to the uploaded content.
   */
  async uploadMaterial(sessionId: string, text: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`/sessions/${sessionId}/materials`, { text }),
      );
    } catch (err) {
      this.logger.error(`uploadMaterial failed: ${err.message}`);
      throw new BadGatewayException('Failed to forward study material to API');
    }
  }

  // ─── Session lifecycle ────────────────────────────────────────────────────────

  /**
   * Ask the API to create a new game session for the given category
   * and return its opaque session ID.
   */
  async createSession(categoryId: CategoryId): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ sessionId: string }>('/sessions', { categoryId }),
      );
      return data.sessionId;
    } catch (err) {
      this.logger.error(`createSession failed: ${err.message}`);
      throw new BadGatewayException('Failed to create game session with API');
    }
  }

  // ─── Gameplay ─────────────────────────────────────────────────────────────────

  /**
   * Fetch the next full Scenario for the given session.
   * The scenario includes all choices, correctness flags, and feedback upfront —
   * no separate submission step is needed.
   */
  async fetchNextScenario(sessionId: string): Promise<ScenarioDto> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<ScenarioDto>(`/sessions/${sessionId}/next-scenario`),
      );
      return data;
    } catch (err) {
      this.logger.error(`fetchNextScenario failed: ${err.message}`);
      throw new BadGatewayException('Failed to fetch next scenario from API');
    }
  }

  // ─── End-of-game ──────────────────────────────────────────────────────────────

  /**
   * Notify the API that the session is over and retrieve the grading summary.
   * `reason` is either 'max_incorrect' or 'max_choices' for logging/analytics.
   */
  async endSession(
    sessionId: string,
    reason: 'max_incorrect' | 'max_choices',
  ): Promise<GameSummaryDto> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<GameSummaryDto>(`/sessions/${sessionId}/end`, { reason }),
      );
      return data;
    } catch (err) {
      this.logger.error(`endSession failed: ${err.message}`);
      throw new BadGatewayException('Failed to end session with API');
    }
  }
}
