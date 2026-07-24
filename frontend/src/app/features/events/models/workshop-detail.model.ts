import { WorkshopDifficulty, WorkshopFormat } from './event.model';

export type WorkshopStatus = 'draft' | 'published' | 'cancelled';
export type WorkshopTabId = 'overview' | 'materials' | 'qa' | 'attendees';

export interface WorkshopSpeaker {
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
}

export interface WorkshopDetail {
  id: string;
  title: string;
  status: WorkshopStatus;
  heroImageUrl: string;
  dateLabel: string; // e.g. 'Oct 24, 2024'
  timeLabel: string; // e.g. '10:00 AM (2h)'
  location: string;
  format: WorkshopFormat;
  difficulty: WorkshopDifficulty;
  seatsFilled: number;
  seatsTotal: number;
  speaker: WorkshopSpeaker;
  description: string;
  learningObjectives: string[];
  prerequisites: string;
}
