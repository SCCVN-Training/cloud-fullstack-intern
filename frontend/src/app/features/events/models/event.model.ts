export type WorkshopFormat = 'in-person' | 'virtual';
export type WorkshopDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Workshop {
  id: string;
  title: string;
  categoryTags: string[]; // e.g. ['LOGISTICS', 'STRATEGY']
  speakerName: string;
  speakerAvatarUrl?: string;
  dateLabel: string; // e.g. 'Oct 24, 2024 | 10:00 AM'
  location: string;
  format: WorkshopFormat;
  difficulty: WorkshopDifficulty;
  topics: string[];
  seatsFilled: number;
  seatsTotal: number;
  thumbnailUrl: string;
}

export interface WorkshopFilters {
  keyword: string;
  timeline: 'today' | 'this-week' | 'next-week' | 'this-month' | 'all';
  formats: WorkshopFormat[];
  difficulty: WorkshopDifficulty | null;
  topics: string[];
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}
