import { CategoryId } from '../enums/category-id.enum';
import { SceneConfigDto } from './scene-config.dto';
import { ChoiceDto } from './choice.dto';

/**
 * A complete scenario step returned by the external API.
 * Replaces both ChoiceEntityDto and ResponseEntityDto — all choices, their
 * correctness, and their feedback are included upfront.
 *
 * - `watchTime`  Seconds the video plays before pausing and showing the question.
 * - `videoUrl`   mp4/webm asset URL, or null if no video is available.
 * - `imageUrl`   Fallback image URL used when videoUrl is null.
 * - `tip`        Optional safety tip shown alongside or after the scenario.
 */
export class ScenarioDto {
  id: string;
  category: CategoryId;
  scene: SceneConfigDto;
  question: string;
  watchTime: number;
  tip: string;
  choices: ChoiceDto[];
  videoUrl: string | null;
  imageUrl: string | null;
}
