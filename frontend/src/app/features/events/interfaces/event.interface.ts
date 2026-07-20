export interface EventDetails {
  id: string;
  title: string;
  summary: string;
  agenda: string[];
  speakerIds: string[];
  roomId: string;
  status: 'draft' | 'published' | 'completed';
  materials: string[];
}
