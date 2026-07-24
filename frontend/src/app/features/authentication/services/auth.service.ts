import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface AuthUser {
  email: string;
  role: 'admin' | 'speaker' | 'attendee';
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly mockUsers: AuthUser[] = [
    { email: 'admin@scc.com', role: 'admin' },
    { email: 'speaker@scc.com', role: 'speaker' },
    { email: 'employee@scc.com', role: 'attendee' },
  ];

  private readonly mockPasswords: Record<string, string> = {
    'admin@scc.com': 'password123',
    'speaker@scc.com': 'welcome2024',
    'employee@scc.com': 'employee123',
  };

  login(email: string, password: string): Observable<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith('@scc.com')) {
      return of({ success: false, message: 'Please enter a valid @scc.com email address.' }).pipe(delay(200));
    }

    const user = this.mockUsers.find((candidate) => candidate.email === normalizedEmail);
    if (!user) {
      return of({ success: false, message: 'No account found for this email address.' }).pipe(delay(200));
    }

    const expectedPassword = this.mockPasswords[normalizedEmail];
    if (password !== expectedPassword) {
      return of({ success: false, message: 'Incorrect password. Please try again.' }).pipe(delay(200));
    }

    return of({ success: true, message: 'Login successful.', user }).pipe(delay(200));
  }

  saveSession(user: AuthUser): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem('syncra-auth', JSON.stringify({ authenticated: true, user }));
  }

  clearSession(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.removeItem('syncra-auth');
  }

  isAuthenticated(): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const raw = window.localStorage.getItem('syncra-auth');
    if (!raw) {
      return false;
    }

    try {
      const data = JSON.parse(raw) as { authenticated?: boolean; user?: AuthUser };
      return Boolean(data.authenticated && data.user?.email);
    } catch {
      return false;
    }
  }
}
