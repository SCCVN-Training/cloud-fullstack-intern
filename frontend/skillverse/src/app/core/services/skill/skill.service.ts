import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../../models/skill.model';
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
}