import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn = signal<boolean>(false);

  constructor() {
    // Check local storage for persistence
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('isLoggedIn');
      
      if (stored === 'true') {
        this.isLoggedIn.set(true);
      }
    }
  }

  login(): void {
    this.isLoggedIn.set(true);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true');
    }
  }

  logout(): void {
    this.isLoggedIn.set(false);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
    }
  }

  register(request: RegisterRequest): Observable<boolean> {

    // Simulate an API call with a delay
    return of(true).pipe(delay(1500));
  }
}
