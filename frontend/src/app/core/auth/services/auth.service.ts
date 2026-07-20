import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Signals are perfect for managing global state like current user or auth status
  currentUser = signal<string | null>(null);

  login(email: string, password: string): Observable<{ success: boolean }> {
    // Simulating API latency (Week 2 target)
    return of({ success: true }).pipe(
      delay(1000),
      tap(() => this.currentUser.set(email)),
    );
  }

  register(
    username: string,
    email: string,
    password: string,
  ): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(1000));
  }
}
