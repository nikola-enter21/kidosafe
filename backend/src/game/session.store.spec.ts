import { NotFoundException } from '@nestjs/common';
import { SessionStore, MAX_INCORRECT, MAX_CHOICES } from './session.store';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  it('creates a fresh session with zero counters', () => {
    const state = store.create('sess-1');
    expect(state.sessionId).toBe('sess-1');
    expect(state.totalChoices).toBe(0);
    expect(state.incorrectChoices).toBe(0);
    expect(state.isOver).toBe(false);
  });

  it('throws NotFoundException for unknown sessionId', () => {
    expect(() => store.get('ghost')).toThrow(NotFoundException);
  });

  it('increments totalChoices on each correct answer', () => {
    store.create('sess-2');
    store.recordChoice('sess-2', false);
    store.recordChoice('sess-2', false);
    const state = store.snapshot('sess-2');
    expect(state.totalChoices).toBe(2);
    expect(state.incorrectChoices).toBe(0);
    expect(state.isOver).toBe(false);
  });

  it(`sets isOver after ${MAX_INCORRECT} incorrect choices`, () => {
    store.create('sess-3');
    for (let i = 0; i < MAX_INCORRECT; i++) {
      store.recordChoice('sess-3', true);
    }
    const state = store.snapshot('sess-3');
    expect(state.isOver).toBe(true);
    expect(state.endReason).toBe('max_incorrect');
  });

  it(`sets isOver after ${MAX_CHOICES} total choices`, () => {
    store.create('sess-4');
    for (let i = 0; i < MAX_CHOICES; i++) {
      store.recordChoice('sess-4', false);
    }
    const state = store.snapshot('sess-4');
    expect(state.isOver).toBe(true);
    expect(state.endReason).toBe('max_choices');
  });

  it('max_incorrect takes priority over max_choices check', () => {
    store.create('sess-5');
    // Fill up to one below MAX_CHOICES with mix of correct/incorrect
    for (let i = 0; i < MAX_CHOICES - 1; i++) {
      store.recordChoice('sess-5', i < MAX_INCORRECT - 1);
    }
    // This final incorrect triggers max_incorrect before max_choices would
    store.recordChoice('sess-5', true);
    const state = store.snapshot('sess-5');
    expect(state.endReason).toBe('max_incorrect');
  });

  it('deletes a session cleanly', () => {
    store.create('sess-6');
    store.delete('sess-6');
    expect(() => store.get('sess-6')).toThrow(NotFoundException);
  });
});
