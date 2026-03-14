/**
 * Visual configuration for a scenario's background scene.
 * Passed through from the API as-is — no backend validation of CSS/emoji values.
 */
export class SceneConfigDto {
  background: string; // CSS gradient or solid color
  emoji: string;
  label: string;
}
