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

  constructor(private http: HttpClient) {
    console.log('SkillService initialized with API URL:', this.apiUrl);
  }

  // Function calls API to reponse database
  getSkills(): Observable<Skill[]> {
    console.log('Fetching all skills from API...');
    return this.http.get<Skill[]>(this.apiUrl);
  }

  // Fetch one skill by its id
  getSkillById(id: string | number): Observable<Skill> {
    console.log(`Fetching skill with ID: ${id} from API...`);
    return this.http.get<Skill>(`${this.apiUrl}/${id}`);
  }
}
