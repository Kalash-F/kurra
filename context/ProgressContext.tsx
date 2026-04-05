import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LessonProgress {
  completed: boolean;
  score: number; // 0-100
  attempts: number;
  lastAttempt?: string;
}

interface ItemMastery {
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: string;
  interval: number; // days
  easeFactor: number;
  nextReview?: string;
}

interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;
}

interface ProgressData {
  speakingLessons: Record<string, LessonProgress>;
  scriptLessons: Record<string, LessonProgress>;
  itemMastery: Record<string, ItemMastery>;
  streak: StreakData;
  totalTimeSpent: number; // minutes
  reviewsDone: number;
}

type MasteryLevel = 'new' | 'learning' | 'familiar' | 'mastered';

interface ProgressContextType {
  progress: ProgressData;
  isLoading: boolean;
  completeSpeakingLesson: (unitId: string, score: number) => Promise<void>;
  completeScriptLesson: (unitId: string, score: number) => Promise<void>;
  updateItemMastery: (itemId: string, correct: boolean) => Promise<void>;
  getWeakItems: () => string[];
  getReviewDue: () => string[];
  getMasteryLevel: (itemId: string) => MasteryLevel;
  updateStreak: () => Promise<void>;
  addTime: (minutes: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  getSpeakingProgress: () => number;
  getScriptProgress: () => number;
}

const defaultStreak: StreakData = {
  current: 0,
  longest: 0,
  lastActiveDate: '',
};

const defaultProgress: ProgressData = {
  speakingLessons: {},
  scriptLessons: {},
  itemMastery: {},
  streak: defaultStreak,
  totalTimeSpent: 0,
  reviewsDone: 0,
};

const ProgressContext = createContext<ProgressContextType>({
  progress: defaultProgress,
  isLoading: true,
  completeSpeakingLesson: async () => {},
  completeScriptLesson: async () => {},
  updateItemMastery: async () => {},
  getWeakItems: () => [],
  getReviewDue: () => [],
  getMasteryLevel: () => 'new',
  updateStreak: async () => {},
  addTime: async () => {},
  resetProgress: async () => {},
  getSpeakingProgress: () => 0,
  getScriptProgress: () => 0,
});

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressData>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('progressData').then((saved) => {
      if (saved) {
        try {
          setProgress({ ...defaultProgress, ...JSON.parse(saved) });
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const save = useCallback(async (data: ProgressData) => {
    setProgress(data);
    await AsyncStorage.setItem('progressData', JSON.stringify(data));
  }, []);

  const completeSpeakingLesson = useCallback(async (unitId: string, score: number) => {
    const newProgress = { ...progress };
    const existing = newProgress.speakingLessons[unitId];
    newProgress.speakingLessons[unitId] = {
      completed: true,
      score: existing ? Math.max(existing.score, score) : score,
      attempts: (existing?.attempts || 0) + 1,
      lastAttempt: new Date().toISOString(),
    };
    await save(newProgress);
  }, [progress, save]);

  const completeScriptLesson = useCallback(async (unitId: string, score: number) => {
    const newProgress = { ...progress };
    const existing = newProgress.scriptLessons[unitId];
    newProgress.scriptLessons[unitId] = {
      completed: true,
      score: existing ? Math.max(existing.score, score) : score,
      attempts: (existing?.attempts || 0) + 1,
      lastAttempt: new Date().toISOString(),
    };
    await save(newProgress);
  }, [progress, save]);

  const updateItemMastery = useCallback(async (itemId: string, correct: boolean) => {
    const newProgress = { ...progress };
    const existing = newProgress.itemMastery[itemId] || {
      correctCount: 0,
      incorrectCount: 0,
      interval: 1,
      easeFactor: 2.5,
    };

    if (correct) {
      existing.correctCount++;
      existing.interval = Math.round(existing.interval * existing.easeFactor);
      existing.easeFactor = Math.min(3.0, existing.easeFactor + 0.1);
    } else {
      existing.incorrectCount++;
      existing.interval = 1;
      existing.easeFactor = Math.max(1.3, existing.easeFactor - 0.2);
    }

    existing.lastReviewed = new Date().toISOString();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + existing.interval);
    existing.nextReview = nextDate.toISOString().split('T')[0];

    newProgress.itemMastery[itemId] = existing;
    await save(newProgress);
  }, [progress, save]);

  const getWeakItems = useCallback(() => {
    return Object.entries(progress.itemMastery)
      .filter(([_, m]) => m.incorrectCount > m.correctCount || m.easeFactor < 2.0)
      .map(([id]) => id);
  }, [progress]);

  const getReviewDue = useCallback(() => {
    const today = getToday();
    return Object.entries(progress.itemMastery)
      .filter(([_, m]) => m.nextReview && m.nextReview <= today)
      .map(([id]) => id);
  }, [progress]);

  const getMasteryLevel = useCallback((itemId: string): MasteryLevel => {
    const mastery = progress.itemMastery[itemId];
    if (!mastery) return 'new';
    const total = mastery.correctCount + mastery.incorrectCount;
    if (total === 0) return 'new';
    const ratio = mastery.correctCount / total;
    if (ratio >= 0.85 && total >= 4) return 'mastered';
    if (ratio >= 0.6 && total >= 2) return 'familiar';
    return 'learning';
  }, [progress]);

  const updateStreak = useCallback(async () => {
    const today = getToday();
    const newProgress = { ...progress };
    const { lastActiveDate, current, longest } = newProgress.streak;

    if (lastActiveDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastActiveDate === yesterdayStr) {
      newProgress.streak.current = current + 1;
    } else if (lastActiveDate !== today) {
      newProgress.streak.current = 1;
    }

    newProgress.streak.longest = Math.max(newProgress.streak.longest, newProgress.streak.current);
    newProgress.streak.lastActiveDate = today;
    await save(newProgress);
  }, [progress, save]);

  const addTime = useCallback(async (minutes: number) => {
    const newProgress = { ...progress, totalTimeSpent: progress.totalTimeSpent + minutes };
    await save(newProgress);
  }, [progress, save]);

  const resetProgress = useCallback(async () => {
    await save(defaultProgress);
  }, [save]);

  const getSpeakingProgress = useCallback(() => {
    const completed = Object.values(progress.speakingLessons).filter(l => l.completed).length;
    return Math.round((completed / 10) * 100);
  }, [progress]);

  const getScriptProgress = useCallback(() => {
    const completed = Object.values(progress.scriptLessons).filter(l => l.completed).length;
    return Math.round((completed / 12) * 100);
  }, [progress]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        isLoading,
        completeSpeakingLesson,
        completeScriptLesson,
        updateItemMastery,
        getWeakItems,
        getReviewDue,
        getMasteryLevel,
        updateStreak,
        addTime,
        resetProgress,
        getSpeakingProgress,
        getScriptProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
