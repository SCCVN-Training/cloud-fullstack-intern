import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Skill } from '../../models/skill.model';
import { environment } from '../../../../environments/environment';

// SkillResponse on the backend uses alias_generator=to_camel, so the JSON
// over the wire is already camelCase and matches the Skill model directly
// — no mapper needed here (unlike auth, which is snake_case).
interface SkillListResponse {
  total: number;
  skills: Skill[];
}

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  private apiUrl = `${environment.apiUrl}/skills`;

  constructor(private http: HttpClient) {}

  // GET /skills?search=&category=
  getSkills(search?: string, category?: string): Observable<Skill[]> {
    let params: Record<string, string> = {};
    if (search) params['search'] = search;
    if (category) params['category'] = category;

    return this.http
      .get<SkillListResponse>(this.apiUrl, { params })
      .pipe(map((res) => res.skills));
  }

  // GET /skills/{id}
  getSkillById(id: string | number): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/${id}`);
  }
}
