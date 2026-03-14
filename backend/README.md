# EduKids Backend

NestJS backend that connects the EduKids React frontend to the external scenario-generation API. It manages game sessions, orchestrates the gameplay loop, enforces termination rules, and handles study-material uploads.

---

## Architecture overview

```
React Frontend
      │
      │  REST  /api/*
      ▼
┌─────────────────────────────────────────────────┐
│              NestJS (this service)              │
│                                                 │
│  MaterialsModule   GameModule   ApiClientModule │
│       │                │               │        │
│  Text extraction   Session state  HttpService   │
└─────────────────────────────────────────────────┘
      │
      │  HTTP  (SCENARIO_API_URL)
      ▼
  External scenario-generation API
```

### Module responsibilities

| Module | Responsibility |
|---|---|
| `ApiClientModule` | Single place for all outbound HTTP to the external API. Configured via env vars. |
| `MaterialsModule` | Accepts multipart file uploads, extracts plain text (txt / pdf / docx / xlsx / csv), forwards to the API. |
| `GameModule` | Manages session lifecycle, enforces the 3-incorrect / 20-choice limits, orchestrates choice→response→next-choice loop. |

---

## API reference

All routes are prefixed with `/api`.

### Study materials

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sessions/:sessionId/materials` | Upload a study-material file (multipart, field name `file`). Must be called **before** starting gameplay. |

**Accepted file types:** `txt`, `pdf`, `doc`, `docx`, `xls`, `xlsx`, `csv`

### Gameplay

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/sessions` | Start a new session. Returns `{ sessionId, firstChoice }`. |
| `GET` | `/api/sessions/:sessionId/status` | Poll counters without advancing state. |
| `POST` | `/api/sessions/:sessionId/choice` | Submit a selected option. Returns feedback + next choice **or** a game-over summary. |
| `DELETE` | `/api/sessions/:sessionId` | Force-end a session early (e.g. child quits). Returns a summary. |

#### POST `/api/sessions/:sessionId/choice` — response shapes

**Game continues:**
```json
{
  "response": {
    "result": "CORRECT",
    "feedback": "Great thinking!"
  },
  "nextChoice": {
    "choiceId": "c-2",
    "text": "You see a car coming. What do you do?",
    "mediaType": "image",
    "mediaUrl": "https://api.example.com/media/crossing.jpg",
    "options": ["Run across", "Wait for the car to pass", "Look both ways then cross"]
  }
}
```

**Game over:**
```json
{
  "response": {
    "result": "INCORRECT",
    "feedback": "Remember to never go with strangers."
  },
  "gameOver": {
    "reason": "max_incorrect",
    "summary": {
      "grade": "B",
      "summary": "You did well on street safety but need practice with strangers."
    },
    "totalChoices": 7,
    "incorrectChoices": 3
  }
}
```

---

## Gameplay loop rules

- **Max incorrect answers:** 3 — reaching this ends the session with `reason: "max_incorrect"`.
- **Max total choices:** 20 — reaching this ends the session with `reason: "max_choices"`.
- `QUESTIONABLE` answers do **not** count as incorrect.
- Both limits are constants in `src/game/session.store.ts` (`MAX_INCORRECT`, `MAX_CHOICES`) and can be adjusted there.

---

## ChoiceEntity media types

The external API returns one of three `mediaType` values per choice:

| `mediaType` | Meaning |
|---|---|
| `"image"` | `mediaUrl` points to a `.jpg` or `.png` |
| `"video"` | `mediaUrl` points to a `.mp3` or `.wav` |
| `"none"` | Text-only — no `mediaUrl` present |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set SCENARIO_API_URL and optionally SCENARIO_API_KEY
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port this server listens on |
| `SCENARIO_API_URL` | `http://localhost:4000` | Base URL of the external API |
| `SCENARIO_API_KEY` | _(empty)_ | Bearer token for the external API |
| `MAX_FILE_SIZE` | `10485760` (10 MB) | Upload size limit in bytes |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed origin for the React frontend |

### 3. Run

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 4. Test

```bash
npm test           # all unit tests
npm run test:cov   # with coverage report
```

---

## Project structure

```
src/
├── main.ts                          Entry point — bootstraps NestJS, CORS, validation
├── app.module.ts                    Root module
│
├── api-client/
│   ├── api-client.module.ts         Registers HttpModule with base URL + auth header
│   └── api-client.service.ts        All outbound calls to the external API
│
├── materials/
│   ├── materials.module.ts
│   ├── materials.controller.ts      POST /api/sessions/:sessionId/materials
│   ├── materials.service.ts         Text extraction (txt/pdf/docx/xlsx/csv)
│   └── materials.service.spec.ts
│
├── game/
│   ├── game.module.ts
│   ├── game.controller.ts           POST /api/sessions, POST .../choice, DELETE ...
│   ├── game.service.ts              Orchestrates the gameplay loop + termination logic
│   ├── game.service.spec.ts
│   ├── session.store.ts             In-memory session state (counters, isOver flag)
│   └── session.store.spec.ts
│
└── common/
    ├── dto/
    │   ├── choice-entity.dto.ts     Shape of a scenario step from the API
    │   ├── response-entity.dto.ts   Shape of per-choice feedback from the API
    │   ├── game-summary.dto.ts      End-of-game grade + summary from the API
    │   └── submit-choice.dto.ts     Request body for POST .../choice
    └── enums/
        └── choice-result.enum.ts    CORRECT | INCORRECT | QUESTIONABLE
```

---

## Connecting the React frontend

A typical frontend flow looks like this:

```
1. (Optional) Upload study materials
   POST /api/sessions/{sessionId}/materials   ← before starting

2. Start session
   POST /api/sessions
   → { sessionId, firstChoice }

3. Display firstChoice to child, wait for selection

4. Loop:
   POST /api/sessions/{sessionId}/choice  { choiceId, selectedOption }
   → { response, nextChoice }   ← display feedback, show next choice
   OR
   → { response, gameOver }     ← display final summary, stop loop

5. (Optional early exit)
   DELETE /api/sessions/{sessionId}
   → gameOver payload
```

---

## Extending this backend

**Swap in-memory state for Redis:** Replace `SessionStore` with a Redis-backed implementation — the interface stays identical so `GameService` needs no changes.

**Add authentication:** Add a NestJS Guard at the controller level; the `ApiClientModule` already injects the `SCENARIO_API_KEY` header for all outbound calls.

**Persist session history:** Add a `TypeOrmModule` or `PrismaModule` and record each choice/response pair in `GameService.submitChoice`.

**WebSocket push instead of request-response:** Replace `GameController` with a NestJS Gateway — `GameService` is transport-agnostic and works unchanged.
