import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Skill } from '../../models/skill.model';

@Injectable({
  providedIn: 'root',
})
export class SkillService {
  // Call public API to fetch sample database
  private apiUrl = 'https://6a66dc4d189fe5869eb6b131.mockapi.io/skills';

  constructor(private http: HttpClient) {}

  // Function calls API to reponse database
  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(this.apiUrl);
  }

  // Fetch one skill by its id
  getSkillById(id: string | number): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/${id}`);
  }
}
