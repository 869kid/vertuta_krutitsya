import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventQueue } from '@shared/lib/event-queue/event-queue';
import { QueuedEvent } from '@shared/lib/event-queue/queued-event';
import { QueueState } from '@shared/lib/event-queue/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('QueuedEvent', () => {
  it('initializes with correct defaults', () => {
    const handler = async () => 42;
    const event = new QueuedEvent(handler);
    expect(event.isSkipped).toBe(false);
    expect(event.isRemoved).toBe(false);
    expect(event.isCompleted).toBe(false);
    expect(event.isProcessing).toBe(false);
    expect(event.id).toBeDefined();
  });

  it('uses custom id when provided', () => {
    const event = new QueuedEvent(async () => {}, 'my-id');
    expect(event.id).toBe('my-id');
  });

  it('executes handler and stores result', async () => {
    const event = new QueuedEvent(async () => 'result');
    const result = await event.execute();
    expect(result).toBe('result');
    expect(event.result).toBe('result');
    expect(event.isCompleted).toBe(true);
    expect(event.isProcessing).toBe(false);
  });

  it('stores error on handler failure', async () => {
    const event = new QueuedEvent(async () => {
      throw new Error('fail');
    });
    await expect(event.execute()).rejects.toThrow('fail');
    expect(event.error?.message).toBe('fail');
    expect(event.isCompleted).toBe(true);
  });

  it('throws when executing a skipped event', async () => {
    const event = new QueuedEvent(async () => {});
    event.skip();
    await expect(event.execute()).rejects.toThrow('skipped or removed');
  });

  it('throws when executing an already completed event', async () => {
    const event = new QueuedEvent(async () => {});
    await event.execute();
    await expect(event.execute()).rejects.toThrow('already been executed');
  });

  it('prevents skip/remove during processing', async () => {
    let resolve: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    const event = new QueuedEvent(() => promise);

    const execPromise = event.execute();
    expect(event.isProcessing).toBe(true);
    expect(() => event.skip()).toThrow('currently being processed');
    expect(() => event.remove()).toThrow('currently being processed');

    resolve!();
    await execPromise;
  });
});

describe('EventQueue', () => {
  let queue: EventQueue;

  beforeEach(() => {
    queue = new EventQueue({ eventTimeout: 5000 });
  });

  it('starts in IDLE state', () => {
    expect(queue.getState()).toBe(QueueState.IDLE);
  });

  it('processes events in FIFO order', async () => {
    const order: number[] = [];
    queue.addEvent(async () => { order.push(1); });
    queue.addEvent(async () => { order.push(2); });
    queue.addEvent(async () => { order.push(3); });

    await queue.waitForCompletion(2000);
    expect(order).toEqual([1, 2, 3]);
  });

  it('returns to IDLE after processing all events', async () => {
    queue.addEvent(async () => 'done');
    await queue.waitForCompletion(2000);
    expect(queue.getState()).toBe(QueueState.IDLE);
  });

  it('throws when queue is full', () => {
    const smallQueue = new EventQueue({ maxQueueSize: 2, eventTimeout: 5000 });
    smallQueue.addEvent(async () => delay(100));
    smallQueue.addEvent(async () => delay(100));
    expect(() => smallQueue.addEvent(async () => {})).toThrow('Queue is full');
  });

  it('continues processing after error by default', async () => {
    const results: string[] = [];
    queue.addEvent(async () => { throw new Error('boom'); });
    queue.addEvent(async () => { results.push('ok'); });

    await queue.waitForCompletion(2000);
    expect(results).toEqual(['ok']);
  });

  it('stops on error when continueOnError is false', async () => {
    const strictQueue = new EventQueue({ continueOnError: false, eventTimeout: 5000 });
    const results: string[] = [];
    strictQueue.addEvent(async () => { throw new Error('boom'); });
    strictQueue.addEvent(async () => { results.push('should not run'); });

    await delay(200);
    expect(results).toEqual([]);
  });

  it('pauses and resumes processing', async () => {
    const results: number[] = [];

    queue.addEvent(async () => {
      results.push(1);
      queue.pause();
    });
    queue.addEvent(async () => { results.push(2); });

    await delay(200);
    expect(results).toEqual([1]);
    expect(queue.getState()).toBe(QueueState.PAUSED);

    queue.resume();
    await queue.waitForCompletion(2000);
    expect(results).toEqual([1, 2]);
  });

  it('skips removed events', async () => {
    const results: number[] = [];
    queue.addEvent(async () => { results.push(1); });
    const toRemove = queue.addEvent(async () => { results.push(2); });
    queue.addEvent(async () => { results.push(3); });

    toRemove.remove();
    await queue.waitForCompletion(2000);
    expect(results).toEqual([1, 3]);
  });

  it('skips skipped events', async () => {
    const results: number[] = [];
    queue.addEvent(async () => { results.push(1); });
    const toSkip = queue.addEvent(async () => { results.push(2); });
    queue.addEvent(async () => { results.push(3); });

    toSkip.skip();
    await queue.waitForCompletion(2000);
    expect(results).toEqual([1, 3]);
  });

  it('reports correct stats', () => {
    queue.addEvent(async () => delay(500));
    queue.addEvent(async () => delay(500));

    const stats = queue.getStats();
    expect(stats.pendingEvents).toBeGreaterThanOrEqual(1);
    expect(stats.currentState).toBe(QueueState.PROCESSING);
  });

  it('times out long-running events', async () => {
    const fastQueue = new EventQueue({ eventTimeout: 50 });
    const failSpy = vi.fn();
    fastQueue.on('eventFailed', failSpy);

    fastQueue.addEvent(() => delay(500));
    await delay(300);

    expect(failSpy).toHaveBeenCalled();
    const error = failSpy.mock.calls[0][1] as Error;
    expect(error.message).toContain('timed out');
  });

  it('clears pending events without affecting current', async () => {
    const results: number[] = [];
    queue.addEvent(async () => {
      await delay(50);
      results.push(1);
    });
    queue.addEvent(async () => { results.push(2); });
    queue.addEvent(async () => { results.push(3); });

    await delay(10);
    queue.clear();
    await queue.waitForCompletion(2000);
    expect(results).toEqual([1]);
  });

  it('waitForCompletion times out', async () => {
    queue.addEvent(() => delay(5000));
    await expect(queue.waitForCompletion(100)).rejects.toThrow('Timeout');
  });
});
