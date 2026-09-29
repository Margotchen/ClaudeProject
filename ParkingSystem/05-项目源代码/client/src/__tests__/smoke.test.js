import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { progress, startProgress, finishProgress } from '@/utils/progress';

describe('top progress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts visible and finishes at 100%', () => {
    startProgress();
    expect(progress.visible).toBe(true);
    expect(progress.percent).toBe(0);

    // 缓动爬升但不超过 90%（等待真实完成）
    vi.advanceTimersByTime(3000);
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.percent).toBeLessThanOrEqual(90);

    finishProgress();
    expect(progress.percent).toBe(100);

    vi.advanceTimersByTime(300);
    expect(progress.visible).toBe(false);
    expect(progress.percent).toBe(0);
  });
});
