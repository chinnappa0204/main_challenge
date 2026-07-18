import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from '../src/lib/storage/LocalStorageRepository';
import { UserProfile, InterventionLog, EveningReflectionLog } from '../src/lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', { value: global, writable: true });

const mockProfile: UserProfile = {
  habitType: 'phone-social',
  specificHabit: 'Excessive Instagram scrolling',
  frequencyDuration: '3 hours daily',
  triggers: ['Work stress', 'Boredom'],
  emotions: ['stressed', 'bored'],
  riskPeriods: ['Late evenings'],
  personalInterests: ['photography', 'walking'],
  desiredOutcome: 'Better sleep and more focused time',
  preferredCoachingTone: 'gentle',
  previouslyAttemptedStrategies: ['App blockers'],
  trustedSupportPreferences: 'Weekly accountability partner',
  onboardedAt: new Date().toISOString(),
};

const mockIntervention: InterventionLog = {
  id: 'test-intervention-1',
  timestamp: new Date().toISOString(),
  habitType: 'phone-social',
  initialEmotion: 'stressed',
  initialUrge: 7,
  finalUrge: 3,
  availableTime: 10,
  missionTitle: 'Seven-Minute Reset',
  missionSteps: ['Put phone face down', 'Walk outside', 'Listen to a song'],
  completed: true,
  helped: true,
  moodAfter: 'better',
};

const mockReflection: EveningReflectionLog = {
  id: 'test-reflection-1',
  date: '2024-01-15',
  habitDurationMinutes: 90,
  strongestTrigger: 'Work stress',
  emotionalState: 'stressed',
  replacementActivityAttempted: 'walking',
  helped: true,
  reclaimedTimeMinutes: 30,
  notes: 'Felt much better after the walk.',
  aiSummary: 'Good progress today.',
  aiWhatWorked: 'Walking outside helped reduce the urge.',
  aiWhatDidNotWork: 'Nothing particularly problematic.',
  aiPattern: 'Work stress triggers evening phone use.',
  aiAdjustment: 'Plan a walk right after work tomorrow.',
  aiEncouragement: 'Great self-awareness.',
  aiNextAction: 'Take 3 deep breaths before sleeping.',
  timestamp: new Date().toISOString(),
};

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorageMock.clear();
    repo = new LocalStorageRepository();
  });

  describe('UserProfile operations', () => {
    it('should return null when no profile is set', () => {
      expect(repo.getUserProfile()).toBeNull();
    });

    it('should save and retrieve a user profile', () => {
      repo.setUserProfile(mockProfile);
      const retrieved = repo.getUserProfile();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.habitType).toBe('phone-social');
      expect(retrieved?.specificHabit).toBe('Excessive Instagram scrolling');
      expect(retrieved?.triggers).toEqual(['Work stress', 'Boredom']);
    });

    it('should overwrite existing profile', () => {
      repo.setUserProfile(mockProfile);
      const updatedProfile = { ...mockProfile, specificHabit: 'Updated habit' };
      repo.setUserProfile(updatedProfile);
      const retrieved = repo.getUserProfile();
      expect(retrieved?.specificHabit).toBe('Updated habit');
    });
  });

  describe('Intervention operations', () => {
    it('should return empty array when no interventions', () => {
      expect(repo.getInterventions()).toEqual([]);
    });

    it('should save and retrieve an intervention log', () => {
      repo.saveIntervention(mockIntervention);
      const logs = repo.getInterventions();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('test-intervention-1');
      expect(logs[0].missionTitle).toBe('Seven-Minute Reset');
    });

    it('should save multiple interventions', () => {
      repo.saveIntervention(mockIntervention);
      const second = { ...mockIntervention, id: 'test-intervention-2', missionTitle: 'Calm Walk' };
      repo.saveIntervention(second);
      expect(repo.getInterventions()).toHaveLength(2);
    });

    it('should update an existing intervention', () => {
      repo.saveIntervention(mockIntervention);
      repo.updateIntervention('test-intervention-1', { finalUrge: 2, helped: false });
      const logs = repo.getInterventions();
      expect(logs[0].finalUrge).toBe(2);
      expect(logs[0].helped).toBe(false);
      // Unchanged fields should persist
      expect(logs[0].missionTitle).toBe('Seven-Minute Reset');
    });

    it('should not fail when updating non-existent intervention', () => {
      repo.saveIntervention(mockIntervention);
      repo.updateIntervention('non-existent-id', { finalUrge: 2 });
      const logs = repo.getInterventions();
      expect(logs[0].finalUrge).toBe(3); // unchanged
    });
  });

  describe('Evening Reflection operations', () => {
    it('should return empty array when no reflections', () => {
      expect(repo.getEveningReflections()).toEqual([]);
    });

    it('should save and retrieve a reflection by date', () => {
      repo.saveEveningReflection(mockReflection);
      const retrieved = repo.getEveningReflection('2024-01-15');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.reclaimedTimeMinutes).toBe(30);
      expect(retrieved?.strongestTrigger).toBe('Work stress');
    });

    it('should return null for a date without reflection', () => {
      repo.saveEveningReflection(mockReflection);
      expect(repo.getEveningReflection('2024-01-16')).toBeNull();
    });

    it('should overwrite reflection for the same date', () => {
      repo.saveEveningReflection(mockReflection);
      const updated = { ...mockReflection, reclaimedTimeMinutes: 60 };
      repo.saveEveningReflection(updated);
      const retrieved = repo.getEveningReflection('2024-01-15');
      expect(retrieved?.reclaimedTimeMinutes).toBe(60);
      expect(repo.getEveningReflections()).toHaveLength(1);
    });
  });

  describe('Nudge operations', () => {
    it('should start with empty nudges', () => {
      expect(repo.getNudges()).toEqual([]);
    });

    it('should save and retrieve nudges', () => {
      const nudge = {
        id: 'nudge-1',
        timestamp: new Date().toISOString(),
        content: 'You usually start scrolling when stressed. Try a 5-minute walk.',
        status: 'pending' as const,
      };
      repo.saveNudge(nudge);
      expect(repo.getNudges()).toHaveLength(1);
      expect(repo.getNudges()[0].content).toBe(nudge.content);
    });

    it('should update nudge status', () => {
      const nudge = {
        id: 'nudge-1',
        timestamp: new Date().toISOString(),
        content: 'Test nudge',
        status: 'pending' as const,
      };
      repo.saveNudge(nudge);
      repo.updateNudgeStatus('nudge-1', 'helpful');
      expect(repo.getNudges()[0].status).toBe('helpful');
    });
  });

  describe('clearAll', () => {
    it('should remove all stored data', () => {
      repo.setUserProfile(mockProfile);
      repo.saveIntervention(mockIntervention);
      repo.saveEveningReflection(mockReflection);
      repo.clearAll();
      expect(repo.getUserProfile()).toBeNull();
      expect(repo.getInterventions()).toEqual([]);
      expect(repo.getEveningReflections()).toEqual([]);
    });
  });
});

describe('Analytics Calculations (pure TypeScript, no AI)', () => {
  it('should compute average urge reduction correctly', () => {
    const interventions: Pick<InterventionLog, 'initialUrge' | 'finalUrge'>[] = [
      { initialUrge: 8, finalUrge: 4 },
      { initialUrge: 6, finalUrge: 2 },
      { initialUrge: 9, finalUrge: 5 },
    ];
    const avgBefore = interventions.reduce((s, i) => s + i.initialUrge, 0) / interventions.length;
    const avgAfter = interventions.reduce((s, i) => s + (i.finalUrge || 0), 0) / interventions.length;
    const avgReduction = Math.round((avgBefore - avgAfter) * 10) / 10;
    expect(avgBefore).toBe(23 / 3);
    expect(avgAfter).toBe(11 / 3);
    expect(avgReduction).toBe(4); // (23-11)/3 = 12/3 = 4
  });

  it('should compute mission completion rate correctly', () => {
    const interventions: Pick<InterventionLog, 'completed'>[] = [
      { completed: true },
      { completed: true },
      { completed: false },
      { completed: true },
    ];
    const completed = interventions.filter((i) => i.completed).length;
    const rate = Math.round((completed / interventions.length) * 100);
    expect(rate).toBe(75);
  });

  it('should compute total reclaimed time correctly', () => {
    const reflections: Pick<EveningReflectionLog, 'reclaimedTimeMinutes'>[] = [
      { reclaimedTimeMinutes: 20 },
      { reclaimedTimeMinutes: 45 },
      { reclaimedTimeMinutes: 15 },
    ];
    const total = reflections.reduce((s, r) => s + r.reclaimedTimeMinutes, 0);
    expect(total).toBe(80);
  });

  it('should find the most common trigger', () => {
    const triggers = ['Work stress', 'Boredom', 'Work stress', 'Loneliness', 'Work stress'];
    const counts: Record<string, number> = {};
    triggers.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe('Work stress');
  });
});
