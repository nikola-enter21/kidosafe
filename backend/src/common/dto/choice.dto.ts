/**
 * A single selectable answer button within a Scenario.
 *
 * - `isCorrect`     Included intentionally — the frontend uses it for
 *                   post-selection reveal (highlighting correct/incorrect).
 * - `feedback`      Child-friendly explanation shown after the player picks.
 * - `feedbackEmoji` Decorative emoji accompanying the feedback text.
 */
export class ChoiceDto {
  id: string;
  text: string;
  emoji: string;
  isCorrect: boolean;
  feedback: string;
  feedbackEmoji: string;
}
