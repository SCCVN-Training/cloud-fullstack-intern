export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  speakers: string[];
  roomId: string;
  status: 'draft' | 'published' | 'completed';
  materials: string[];
}
