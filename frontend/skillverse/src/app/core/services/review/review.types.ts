export interface ReviewCreateRequest {
  rating: number;
  knowledge_rating: number;
  communication_rating: number;
  video_audio_rating: number;
  feedback: string | null;
}

export interface ReviewItemResponse {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewer_name: string | null;
  reviewer_avatar_url: string | null;
  rating: number;
  knowledge_rating: number;
  communication_rating: number;
  video_audio_rating: number;
  feedback: string | null;
  created_at: string;
}
