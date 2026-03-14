import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GameService } from './game.service';
import { StartSessionDto } from '../common/dto/start-session.dto';
import { SubmitAnswerDto } from '../common/dto/submit-answer.dto';
import { ApiClientService } from '../api-client/api-client.service';
import { ScenarioDto } from '../common/dto/scenario.dto';

/**
 * REST surface exposed to the React frontend for the gameplay loop.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  GET    /api/categories                       Fetch available categories │
 * │  POST   /api/sessions                         Start a new game session   │
 * │  GET    /api/sessions/:sessionId/status       Poll session counters      │
 * │  POST   /api/sessions/:sessionId/answer       Submit an answer           │
 * │  DELETE /api/sessions/:sessionId              Force-end a session early  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Study-material uploads live in MaterialsController under the same
 * /api/sessions/:sessionId namespace but in a separate module.
 *
 * NOTE: The frontend sends the full ScenarioDto back alongside the answer so
 * the backend can evaluate correctness without an extra API round-trip.
 */
@Controller()
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(
    private readonly gameService: GameService,
    private readonly apiClient: ApiClientService,
  ) {}

  // ─── Categories ───────────────────────────────────────────────────────────

  /**
   * GET /api/categories
   *
   * Fetches available game categories from the external API and forwards them.
   * Called once before session creation so the player can pick a theme.
   *
   * Response 200: CategoryDto[]
   */
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  getCategories() {
    return this.apiClient.fetchCategories();
  }

  // ─── Start session ────────────────────────────────────────────────────────

  /**
   * POST /api/sessions
   *
   * Creates a session for the chosen category and returns the first scenario.
   *
   * Request body: { categoryId: CategoryId }
   *
   * Response 201:
   * {
   *   sessionId: string,
   *   firstScenario: ScenarioDto
   * }
   */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  async startSession(@Body() dto: StartSessionDto) {
    const result = await this.gameService.startSession(dto.categoryId);
    this.logger.log(
      `New session created: ${result.sessionId} (category: ${dto.categoryId})`,
    );
    return result;
  }

  // ─── Session status ───────────────────────────────────────────────────────

  /**
   * GET /api/sessions/:sessionId/status
   *
   * Returns current counters without advancing state.
   *
   * Response 200:
   * {
   *   sessionId: string,
   *   totalScenarios: number,
   *   incorrectAnswers: number,
   *   isOver: boolean,
   *   endReason: 'max_incorrect' | 'max_choices' | null,
   *   startedAt: string (ISO date)
   * }
   */
  @Get('sessions/:sessionId/status')
  getStatus(@Param('sessionId') sessionId: string) {
    return this.gameService.getSessionStatus(sessionId);
  }

  // ─── Submit answer ────────────────────────────────────────────────────────

  /**
   * POST /api/sessions/:sessionId/answer
   *
   * Records the player's selected choice. The frontend echoes back the full
   * ScenarioDto so correctness can be evaluated locally without an extra
   * round-trip to the external API.
   *
   * Request body:
   * {
   *   scenarioId: string,
   *   selectedChoiceId: string,
   *   scenario: ScenarioDto        ← echoed from the last GET next-scenario response
   * }
   *
   * Response 200 — game continues:
   * {
   *   wasCorrect: boolean,
   *   nextScenario: ScenarioDto
   * }
   *
   * Response 200 — game over:
   * {
   *   wasCorrect: boolean,
   *   gameOver: {
   *     reason: 'max_incorrect' | 'max_choices',
   *     summary: GameSummaryDto,
   *     totalScenarios: number,
   *     incorrectAnswers: number
   *   }
   * }
   */
  @Post('sessions/:sessionId/answer')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAnswerDto & { scenario: ScenarioDto },
  ) {
    return this.gameService.submitAnswer(
      sessionId,
      dto.scenarioId,
      dto.selectedChoiceId,
      dto.scenario,
    );
  }

  // ─── Force end ────────────────────────────────────────────────────────────

  /**
   * DELETE /api/sessions/:sessionId
   *
   * Terminates a session early and returns a final summary.
   *
   * Response 200:
   * {
   *   reason: 'max_choices',
   *   summary: GameSummaryDto,
   *   totalScenarios: number,
   *   incorrectAnswers: number
   * }
   */
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  async forceEnd(@Param('sessionId') sessionId: string) {
    return this.gameService.forceEndSession(sessionId);
  }
}
