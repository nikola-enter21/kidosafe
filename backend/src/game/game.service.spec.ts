import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { GameService } from './game.service';
import { SessionStore } from './session.store';
import { ApiClientService } from '../api-client/api-client.service';
import { CategoryId } from '../common/enums/category-id.enum';
import { ScenarioDto } from '../common/dto/scenario.dto';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockCorrectChoice = {
  id: 'choice-correct',
  text: 'Say no and walk away',
  emoji: '🚶',
  isCorrect: true,
  feedback: 'Great job stying safe!',
  feedbackEmoji: '⭐',
};

const mockIncorrectChoice = {
  id: 'choice-wrong',
  text: 'Take the candy',
  emoji: '🍬',
  isCorrect: false,
  feedback: 'Never take things from strangers.',
  feedbackEmoji: '⚠️',
};

const mockScenario: ScenarioDto = {
  id: 'scenario-1',
  category: CategoryId.STRANGER,
  scene: { background: '#fff', emoji: '🏫', label: 'School' },
  question: 'A stranger offers you candy. What do you do?',
  watchTime: 5,
  tip: 'Always stay with a trusted adult.',
  choices: [mockCorrectChoice, mockIncorrectChoice],
  videoUrl: null,
  imageUrl: 'https://api.example.com/img/stranger.jpg',
};

const mockSummary = { grade: 'A', summary: 'You did really well today!' };

const apiClientMock = {
  createSession: jest.fn().mockResolvedValue('session-abc'),
  fetchNextScenario: jest.fn().mockResolvedValue(mockScenario),
  endSession: jest.fn().mockResolvedValue(mockSummary),
  fetchCategories: jest.fn().mockResolvedValue([]),
  uploadMaterial: jest.fn().mockResolvedValue(undefined),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GameService', () => {
  let service: GameService;
  let store: SessionStore;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        SessionStore,
        { provide: ApiClientService, useValue: apiClientMock },
      ],
    }).compile();

    service = module.get(GameService);
    store = module.get(SessionStore);
  });

  // ── startSession ────────────────────────────────────────────────────────────

  describe('startSession', () => {
    it('returns sessionId and firstScenario', async () => {
      const result = await service.startSession(CategoryId.STRANGER);
      expect(result.sessionId).toBe('session-abc');
      expect(result.firstScenario).toEqual(mockScenario);
      expect(apiClientMock.createSession).toHaveBeenCalledWith(CategoryId.STRANGER);
      expect(apiClientMock.fetchNextScenario).toHaveBeenCalledWith('session-abc');
    });

    it('registers the session in the store', async () => {
      await service.startSession(CategoryId.STRANGER);
      expect(() => store.snapshot('session-abc')).not.toThrow();
    });
  });

  // ── submitAnswer — correct answer ───────────────────────────────────────────

  describe('submitAnswer — correct answer', () => {
    it('returns wasCorrect: true and nextScenario', async () => {
      await service.startSession(CategoryId.STRANGER);
      const result = await service.submitAnswer(
        'session-abc',
        'scenario-1',
        'choice-correct',
        mockScenario,
      );
      expect(result.wasCorrect).toBe(true);
      expect(result.nextScenario).toEqual(mockScenario);
      expect(result.gameOver).toBeUndefined();
    });

    it('does not increment incorrectChoices on a correct answer', async () => {
      await service.startSession(CategoryId.STRANGER);
      await service.submitAnswer('session-abc', 'scenario-1', 'choice-correct', mockScenario);
      expect(store.snapshot('session-abc').incorrectChoices).toBe(0);
    });
  });

  // ── submitAnswer — incorrect answer ────────────────────────────────────────

  describe('submitAnswer — incorrect answer', () => {
    it('returns wasCorrect: false and nextScenario while below limit', async () => {
      await service.startSession(CategoryId.STRANGER);
      const result = await service.submitAnswer(
        'session-abc',
        'scenario-1',
        'choice-wrong',
        mockScenario,
      );
      expect(result.wasCorrect).toBe(false);
      expect(result.nextScenario).toEqual(mockScenario);
      expect(result.gameOver).toBeUndefined();
    });
  });

  // ── submitAnswer — unknown choice ───────────────────────────────────────────

  describe('submitAnswer — unknown choice ID', () => {
    it('throws BadRequestException', async () => {
      await service.startSession(CategoryId.STRANGER);
      await expect(
        service.submitAnswer('session-abc', 'scenario-1', 'choice-ghost', mockScenario),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── submitAnswer — game over via max_incorrect ──────────────────────────────

  describe('submitAnswer — game over via max_incorrect', () => {
    it('returns gameOver after 3 incorrect answers', async () => {
      await service.startSession(CategoryId.STRANGER);

      let result: any;
      for (let i = 0; i < 3; i++) {
        result = await service.submitAnswer(
          'session-abc', 'scenario-1', 'choice-wrong', mockScenario,
        );
      }

      expect(result.gameOver).toBeDefined();
      expect(result.gameOver.reason).toBe('max_incorrect');
      expect(result.gameOver.summary).toEqual(mockSummary);
      expect(result.gameOver.incorrectAnswers).toBe(3);
      expect(result.nextScenario).toBeUndefined();
      expect(apiClientMock.endSession).toHaveBeenCalledWith('session-abc', 'max_incorrect');
    });
  });

  // ── submitAnswer — game over via max_choices ────────────────────────────────

  describe('submitAnswer — game over via max_choices', () => {
    it('returns gameOver after 20 correct answers', async () => {
      await service.startSession(CategoryId.STRANGER);

      let result: any;
      for (let i = 0; i < 20; i++) {
        result = await service.submitAnswer(
          'session-abc', 'scenario-1', 'choice-correct', mockScenario,
        );
      }

      expect(result.gameOver).toBeDefined();
      expect(result.gameOver.reason).toBe('max_choices');
      expect(apiClientMock.endSession).toHaveBeenCalledWith('session-abc', 'max_choices');
    });
  });

  // ── submitAnswer — session already over ─────────────────────────────────────

  describe('submitAnswer — session already over', () => {
    it('throws ConflictException', async () => {
      await service.startSession(CategoryId.STRANGER);
      store.markOver('session-abc', 'max_choices');

      await expect(
        service.submitAnswer('session-abc', 'scenario-1', 'choice-correct', mockScenario),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── forceEndSession ─────────────────────────────────────────────────────────

  describe('forceEndSession', () => {
    it('returns a summary and cleans up the session', async () => {
      await service.startSession(CategoryId.STRANGER);
      const payload = await service.forceEndSession('session-abc');

      expect(payload.summary).toEqual(mockSummary);
      expect(payload.reason).toBe('max_choices');
      expect(() => store.snapshot('session-abc')).toThrow();
    });

    it('throws ConflictException if already over', async () => {
      await service.startSession(CategoryId.STRANGER);
      store.markOver('session-abc', 'max_incorrect');

      await expect(service.forceEndSession('session-abc')).rejects.toThrow(ConflictException);
    });
  });
});
