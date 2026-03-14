/**
 * Mirrors the enum the external API returns inside a ResponseEntity.
 * Values must match whatever the API documentation specifies.
 */
export enum ChoiceResult {
  CORRECT = 'CORRECT',
  INCORRECT = 'INCORRECT',
  QUESTIONABLE = 'QUESTIONABLE',
}
