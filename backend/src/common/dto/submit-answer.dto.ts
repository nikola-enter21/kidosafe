import { IsString } from 'class-validator';

/**
 * Sent by the React frontend (POST /api/sessions/:sessionId/answer).
 *
 * - `scenarioId`      The ID of the scenario just answered.
 * - `selectedChoiceId` The ID of the Choice the player clicked.
 */
export class SubmitAnswerDto {
  @IsString()
  scenarioId: string;

  @IsString()
  selectedChoiceId: string;
}
