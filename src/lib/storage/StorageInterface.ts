import {
  UserProfile,
  InterventionLog,
  DailyPlan,
  EveningReflectionLog,
  BookingRequest,
  NudgeLog,
  NudgeStatus,
} from '../types';

export interface IStorageRepository {
  getUserProfile(): UserProfile | null;
  setUserProfile(profile: UserProfile): void;

  getInterventions(): InterventionLog[];
  saveIntervention(log: InterventionLog): void;
  updateIntervention(id: string, updates: Partial<InterventionLog>): void;

  getDailyPlan(date: string): DailyPlan | null;
  saveDailyPlan(plan: DailyPlan): void;

  getEveningReflection(date: string): EveningReflectionLog | null;
  getEveningReflections(): EveningReflectionLog[];
  saveEveningReflection(reflection: EveningReflectionLog): void;

  getBookings(): BookingRequest[];
  saveBooking(booking: BookingRequest): void;

  getNudges(): NudgeLog[];
  saveNudge(nudge: NudgeLog): void;
  updateNudgeStatus(id: string, status: NudgeStatus): void;

  clearAll(): void;
}
