import { IsString } from 'class-validator';

/**
 * Returned by the external API once the game session is terminated.
 *
 * - `grade`   Short letter grade or score label, e.g. "A", "Needs Improvement".
 * - `summary` Multi-sentence child-friendly recap of how the session went.
 */
export class GameSummaryDto {
  @IsString()
  grade: string;

  @IsString()
  summary: string;
}
