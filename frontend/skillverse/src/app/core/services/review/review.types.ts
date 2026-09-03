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

// GET /skills/{skillId}/reviews — same ReviewSummary shape the backend
// uses for GET /users/{id}/reviews (no camelCase alias on this schema,
// unlike SkillResponse/BookingResponse, so these keys stay snake_case).
export interface ReviewSummaryResponse {
  total: number;
  items: ReviewItemResponse[];
}
