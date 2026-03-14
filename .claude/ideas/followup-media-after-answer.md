# 💡 Idea: Follow-up Media After Each Answer

## Concept
After a child answers a scenario question, show a follow-up image or video that reinforces the correct behaviour — before moving to the next question.

## Flow
1. Child picks an answer (correct or wrong)
2. Feedback overlay appears (as currently)
3. **NEW:** A follow-up image or short video plays/displays below (or as overlay) showing:
   - What the safe behaviour looks like in real life
   - A short positive reinforcement clip if correct
   - An educational clip explaining *why* a certain choice is safer if wrong
4. Child presses "Next" to continue

## Data Model Changes

### Frontend (`types.ts`)
```ts
export interface Scenario {
  // ...existing fields...
  followUpImageUrl?: string   // static image shown after answer
  followUpVideoUrl?: string   // short video clip shown after answer
  followUpCaption?: string    // optional caption text
}
```

### Backend (`models.py`)
```python
class Scenario(models.Model):
    # ...existing fields...
    follow_up_image_url = models.URLField(blank=True, default='')
    follow_up_video_url = models.URLField(blank=True, default='')
    follow_up_caption   = models.CharField(max_length=300, blank=True, default='')
```

### Serializer mapping
- `followUpImageUrl` ↔ `follow_up_image_url`
- `followUpVideoUrl` ↔ `follow_up_video_url`
- `followUpCaption`  ↔ `follow_up_caption`

## UI Changes
- `FeedbackOverlay` component gets a new section below the feedback text:
  - If `followUpImageUrl`: show `<img>` with fade-in animation
  - If `followUpVideoUrl`: show `<video autoPlay muted playsInline>` with controls
  - If both present: prefer video
- Content Studio (`EditorPage`) gets two new fields:
  - "Follow-up Image URL"
  - "Follow-up Video URL"
  - "Follow-up Caption"

## Notes
- Keep media optional — existing scenarios work without it
- Videos should be short (5–15s max), auto-play muted, no controls by default
- Images can be local (`/images/...`) or external URLs
