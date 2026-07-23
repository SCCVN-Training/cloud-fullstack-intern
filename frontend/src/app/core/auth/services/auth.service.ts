import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  storage_used: number;
  storage_quota: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<User | null>(null);

  // Update this base URL if your backend runs on a different host/port
  private readonly API_BASE = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<User>(
        `${this.API_BASE}/api/v1/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  register(
    username: string,
    email: string,
    password: string,
  ): Observable<User> {
    return this.http
      .post<User>(
        `${this.API_BASE}/api/v1/auth/register`,
        { email, password, full_name: username },
        { withCredentials: true },
      )
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  getProfile(): Observable<User> {
    return this.http
      .get<User>(`${this.API_BASE}/api/v1/auth/me`, { withCredentials: true })
      .pipe(
        tap((user) => this.currentUser.set(user)),
        catchError((err) => {
          this.currentUser.set(null);
          throw err;
        }),
      );
  }

  refresh(): Observable<User> {
    return this.http
      .post<User>(
        `${this.API_BASE}/api/v1/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(
        `${this.API_BASE}/api/v1/auth/logout`,
        {},
        { withCredentials: true },
      )
      .pipe(tap(() => this.currentUser.set(null)));
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.API_BASE}/api/v1/auth/me`, {
        withCredentials: true,
      })
      .pipe(tap(() => this.currentUser.set(null)));
  }

  changePassword(
    current: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(
      `${this.API_BASE}/api/v1/auth/change-password`,
      { current_password: current, new_password: newPassword },
      { withCredentials: true },
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/api/v1/auth/forgot-password`,
      { email },
    );
  }

  resetPassword(
    token: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_BASE}/api/v1/auth/reset-password`,
      { token, new_password: newPassword },
    );
  }
}
