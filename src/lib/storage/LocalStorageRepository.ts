import { IStorageRepository } from './StorageInterface';
import {
  UserProfile,
  InterventionLog,
  DailyPlan,
  EveningReflectionLog,
  BookingRequest,
  NudgeLog,
  NudgeStatus,
  CommitmentLetter,
  WeeklyPattern,
  UrgeSurfSession,
} from '../types';

const KEYS = {
  USER_PROFILE: 'reclaim_user_profile',
  INTERVENTIONS: 'reclaim_interventions',
  DAILY_PLANS: 'reclaim_daily_plans',
  COMMITMENT_LETTER: 'reclaim_commitment_letter',
  WEEKLY_PATTERNS: 'reclaim_weekly_patterns',
  URGE_SURF_SESSIONS: 'reclaim_urge_surf_sessions',
  REFLECTIONS: 'reclaim_reflections',
  BOOKINGS: 'reclaim_bookings',
  NUDGES: 'reclaim_nudges',
};

export class LocalStorageRepository implements IStorageRepository {
  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Error reading key ${key} from localStorage`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing key ${key} to localStorage`, e);
    }
  }

  getUserProfile(): UserProfile | null {
    return this.getItem<UserProfile | null>(KEYS.USER_PROFILE, null);
  }

  setUserProfile(profile: UserProfile): void {
    this.setItem(KEYS.USER_PROFILE, profile);
  }

  getInterventions(): InterventionLog[] {
    return this.getItem<InterventionLog[]>(KEYS.INTERVENTIONS, []);
  }

  saveIntervention(log: InterventionLog): void {
    const logs = this.getInterventions();
    const existingIndex = logs.findIndex((l) => l.id === log.id);
    if (existingIndex > -1) {
      logs[existingIndex] = log;
    } else {
      logs.push(log);
    }
    this.setItem(KEYS.INTERVENTIONS, logs);
  }

  updateIntervention(id: string, updates: Partial<InterventionLog>): void {
    const logs = this.getInterventions();
    const index = logs.findIndex((l) => l.id === id);
    if (index > -1) {
      logs[index] = { ...logs[index], ...updates };
      this.setItem(KEYS.INTERVENTIONS, logs);
    }
  }

  getDailyPlan(date: string): DailyPlan | null {
    const plans = this.getItem<Record<string, DailyPlan>>(KEYS.DAILY_PLANS, {});
    return plans[date] || null;
  }

  saveDailyPlan(plan: DailyPlan): void {
    const plans = this.getItem<Record<string, DailyPlan>>(KEYS.DAILY_PLANS, {});
    plans[plan.date] = plan;
    this.setItem(KEYS.DAILY_PLANS, plans);
  }

  getEveningReflection(date: string): EveningReflectionLog | null {
    const reflections = this.getEveningReflections();
    return reflections.find((r) => r.date === date) || null;
  }

  getEveningReflections(): EveningReflectionLog[] {
    return this.getItem<EveningReflectionLog[]>(KEYS.REFLECTIONS, []);
  }

  saveEveningReflection(reflection: EveningReflectionLog): void {
    const reflections = this.getEveningReflections();
    const existingIndex = reflections.findIndex((r) => r.date === reflection.date);
    if (existingIndex > -1) {
      reflections[existingIndex] = reflection;
    } else {
      reflections.push(reflection);
    }
    this.setItem(KEYS.REFLECTIONS, reflections);
  }

  getBookings(): BookingRequest[] {
    return this.getItem<BookingRequest[]>(KEYS.BOOKINGS, []);
  }

  saveBooking(booking: BookingRequest): void {
    const bookings = this.getBookings();
    bookings.push(booking);
    this.setItem(KEYS.BOOKINGS, bookings);
  }

  getNudges(): NudgeLog[] {
    return this.getItem<NudgeLog[]>(KEYS.NUDGES, []);
  }

  saveNudge(nudge: NudgeLog): void {
    const nudges = this.getNudges();
    nudges.push(nudge);
    this.setItem(KEYS.NUDGES, nudges);
  }

  updateNudgeStatus(id: string, status: NudgeStatus): void {
    const nudges = this.getNudges();
    const index = nudges.findIndex((n) => n.id === id);
    if (index > -1) {
      nudges[index].status = status;
      this.setItem(KEYS.NUDGES, nudges);
    }
  }

  clearAll(): void {
    if (!this.isClient()) return;
    try {
      localStorage.removeItem(KEYS.USER_PROFILE);
      localStorage.removeItem(KEYS.INTERVENTIONS);
      localStorage.removeItem(KEYS.DAILY_PLANS);
      localStorage.removeItem(KEYS.REFLECTIONS);
      localStorage.removeItem(KEYS.BOOKINGS);
      localStorage.removeItem(KEYS.NUDGES);
      localStorage.removeItem(KEYS.COMMITMENT_LETTER);
      localStorage.removeItem(KEYS.WEEKLY_PATTERNS);
      localStorage.removeItem(KEYS.URGE_SURF_SESSIONS);
    } catch (e) {
      console.error('Error clearing localStorage', e);
    }
  }

  // ── Commitment Letter ─────────────────────────────────────
  getCommitmentLetter(): CommitmentLetter | null {
    return this.getItem<CommitmentLetter | null>(KEYS.COMMITMENT_LETTER, null);
  }

  saveCommitmentLetter(letter: CommitmentLetter): void {
    this.setItem(KEYS.COMMITMENT_LETTER, letter);
  }

  markLetterUnlocked(): void {
    const letter = this.getCommitmentLetter();
    if (letter) {
      this.saveCommitmentLetter({ ...letter, unlocked: true });
    }
  }

  // ── Weekly Patterns ───────────────────────────────────────
  getWeeklyPattern(weekKey: string): WeeklyPattern | null {
    const all = this.getItem<Record<string, WeeklyPattern>>(KEYS.WEEKLY_PATTERNS, {});
    return all[weekKey] || null;
  }

  saveWeeklyPattern(pattern: WeeklyPattern): void {
    const all = this.getItem<Record<string, WeeklyPattern>>(KEYS.WEEKLY_PATTERNS, {});
    all[pattern.weekKey] = pattern;
    this.setItem(KEYS.WEEKLY_PATTERNS, all);
  }

  // ── Urge Surf Sessions ────────────────────────────────────
  getUrgeSurfSessions(): UrgeSurfSession[] {
    return this.getItem<UrgeSurfSession[]>(KEYS.URGE_SURF_SESSIONS, []);
  }

  saveUrgeSurfSession(session: UrgeSurfSession): void {
    const all = this.getUrgeSurfSessions();
    all.push(session);
    this.setItem(KEYS.URGE_SURF_SESSIONS, all);
  }
}
