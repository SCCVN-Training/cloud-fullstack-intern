import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../../models/skill.model';
import { ReviewSummaryResponse } from '../review/review.types';
import { environment } from '../../../../environments/environment';

// SkillResponse on the backend uses alias_generator=to_camel, so the JSON
// over the wire is already camelCase and matches the Skill model directly
// — no mapper needed here (unlike auth, which is snake_case).
export interface SkillListResponse {
  total: number;
  skills: Skill[];
}

export type SkillSort =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'rating'
  | 'popular'
  | 'title_asc';

export interface SkillQuery {
  skip?: number;
  limit?: number;
  search?: string;
  category?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: SkillSort;
  instructorId?: string;
}

// Sent on create/update. price is intentionally optional — omitting it
// tells the backend to derive it from duration (SkillService in
// marketplace-service computes/validates the same duration<=45,
// price<=round(100*duration/45) rule), rather than trusting a
// client-supplied number outright.
export interface SkillWritePayload {
  title: string;
  category: string;
  description: string;
  image: string;
  price?: number;
  duration: number;
  level: string;
  requirements: string;
  availableSlots?: number;
  language?: string;
  tags?: string[];
  featured?: boolean;
  aboutText?: string;
  learningOutcomes?: string[];
  prerequisites?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  private apiUrl = `${environment.marketplaceApiUrl}/skills`;

  constructor(private http: HttpClient) {}

  // GET /skills?skip=&limit=&search=&category=&min_rating=&sort=
  // Returns { total, skills } so the caller can drive real (server-side)
  // pagination instead of slicing an in-memory array.
  getSkills(query: SkillQuery = {}): Observable<SkillListResponse> {
    let params: Record<string, string> = {
      skip: String(query.skip ?? 0),
      limit: String(query.limit ?? 20),
    };
    if (query.search) params['search'] = query.search;
    if (query.category) params['category'] = query.category;
    if (query.minRating != null) params['min_rating'] = String(query.minRating);
    if (query.minPrice != null) params['min_price'] = String(query.minPrice);
    if (query.maxPrice != null) params['max_price'] = String(query.maxPrice);
    if (query.sort) params['sort'] = query.sort;
    if (query.instructorId) params['instructor_id'] = query.instructorId;

    return this.http.get<SkillListResponse>(this.apiUrl, { params });
  }

  // GET /skills/categories — distinct category values for the filter dropdown
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/categories`);
  }

  // GET /skills/{id}
  getSkillById(id: string | number): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/${id}`);
  }

  // GET /skills/{id}/reviews — reviews left on bookings for this skill.
  // 404s if the skill doesn't exist, same as getSkillById.
  getSkillReviews(id: string | number, limit = 10, offset = 0): Observable<ReviewSummaryResponse> {
    const params = { limit: String(limit), offset: String(offset) };
    return this.http.get<ReviewSummaryResponse>(`${this.apiUrl}/${id}/reviews`, { params });
  }

  // POST /skills — instructorId is passed separately (not part of
  // SkillWritePayload) since it only applies on create; the backend
  // checks it matches the caller (or the caller is an admin).
  createSkill(payload: SkillWritePayload, instructorId: string): Observable<Skill> {
    return this.http.post<Skill>(this.apiUrl, { ...payload, instructorId });
  }

  // PATCH /skills/{id} — owner or admin only, enforced server-side.
  updateSkill(id: string, payload: Partial<SkillWritePayload>): Observable<Skill> {
    return this.http.patch<Skill>(`${this.apiUrl}/${id}`, payload);
  }

  deleteSkill(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}