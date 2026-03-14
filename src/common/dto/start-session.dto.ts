import { IsEnum } from 'class-validator';
import { CategoryId } from '../enums/category-id.enum';

/**
 * Request body for POST /api/sessions.
 * The frontend sends the category the player selected from the category list.
 */
export class StartSessionDto {
  @IsEnum(CategoryId)
  categoryId: CategoryId;
}
