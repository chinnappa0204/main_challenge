export type UrgeIntensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type CoachingTone = 'gentle' | 'direct' | 'energetic';

export type HabitType =
  | 'phone-social'
  | 'gaming'
  | 'procrastination'
  | 'junk-food'
  | 'nicotine'
  | 'alcohol-substance'
  | 'custom';

export interface UserProfile {
  habitType: HabitType;
  specificHabit: string;
  frequencyDuration: string;
  triggers: string[];
  emotions: string[];
  riskPeriods: string[];
  personalInterests: string[];
  desiredOutcome: string;
  preferredCoachingTone: CoachingTone;
  previouslyAttemptedStrategies: string[];
  trustedSupportPreferences: string;
  onboardedAt: string;
}

export interface InterventionLog {
  id: string;
  timestamp: string; // ISO String
  habitType: HabitType;
  initialEmotion: string;
  initialUrge: UrgeIntensity;
  finalUrge?: UrgeIntensity; // Optional, collected after returning
  availableTime: number; // in minutes
  context?: string;
  missionTitle: string;
  missionSteps: string[];
  completed: boolean;
  helped?: boolean;
  moodAfter?: string;
  notes?: string;
}

export interface ActionItem {
  id: string;
  name: string;
  category: 'purpose' | 'connection' | 'protection';
  completed: boolean;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  focus: string;
  predictedRisk: string;
  purposeAction: ActionItem;
  connectionAction: ActionItem;
  protectionAction: ActionItem;
  accepted: boolean;
}

export type NudgeStatus = 'pending' | 'helpful' | 'dismissed' | 'requested_easier' | 'requested_another';

export interface NudgeLog {
  id: string;
  timestamp: string;
  content: string;
  status: NudgeStatus;
}

export interface EveningReflectionLog {
  id: string;
  date: string; // YYYY-MM-DD
  habitDurationMinutes: number;
  strongestTrigger: string;
  emotionalState: string;
  replacementActivityAttempted: string;
  helped: boolean;
  reclaimedTimeMinutes: number;
  notes?: string;
  // Gemini feedback fields
  aiSummary: string;
  aiWhatWorked: string;
  aiWhatDidNotWork: string;
  aiPattern: string;
  aiAdjustment: string;
  aiEncouragement: string;
  aiNextAction: string;
  timestamp: string;
}

export interface BookingRequest {
  id: string;
  date: string;
  timeSlot: string;
  supportNeeded: string;
  profileId: string;
  brief: string; // AI consultation brief
  createdAt: string;
}

export interface SupportProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  specialty: string[];
  rating: string;
  isDemo: boolean;
}

export interface CommitmentLetter {
  id: string;
  content: string;
  aiEnhanced?: string;
  writtenAt: string;
  unlockAt: string;
  unlocked: boolean;
  habitType?: HabitType;
}

export interface UrgeSurfSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  urgeBeforeIntensity: UrgeIntensity;
  urgeAfterIntensity?: UrgeIntensity;
  completed: boolean;
}

export interface WeeklyPattern {
  weekStarting: string; // ISO date of Monday
  totalCheckins: number;
  avgUrgeIntensity: number;
  avgReclaimedMinutes: number;
  topTrigger: string;
  mostHelpfulActivity: string;
}
