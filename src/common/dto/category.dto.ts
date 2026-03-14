import { CategoryId } from '../enums/category-id.enum';

/**
 * A single game category returned by the external API and forwarded to the
 * frontend before session creation. Visual fields (colors, emoji) are passed
 * through as-is without backend validation — the API is the source of truth.
 *
 * Mirrors the frontend's Category interface exactly.
 */
export class CategoryDto {
  id: CategoryId;
  label: string;
  emoji: string;
  description: string;
  scenarioCount: number;
  color: string;       // primary hex color
  colorLight: string;  // light bg hex (for cards)
  colorDark: string;   // dark variant hex
}
