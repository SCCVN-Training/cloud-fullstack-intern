import { Injectable } from '@angular/core';

import { LoginPayload, RegisterPayload } from './auth.model';
import { AuthEffect } from './with-auth-effect';

@Injectable({
  providedIn: 'root',
})
export class AuthEvent {
  constructor(private readonly effect: AuthEffect) {}

  /**
   * Login user.
   */
  login(payload: LoginPayload): void {
    console.log('[Event] Login triggered with payload:', payload); // Log the payload to check its structure
    this.effect.login(payload.email, payload.password);
  }

  /**
   * Register new account.
   */
  register(payload: RegisterPayload): void {
    console.log('[Event] Register triggered with payload:', payload); // Log the payload to check its structure
    this.effect.register(payload.username, payload.email, payload.password);
  }

  /**
   * Logout current user.
   */
  logout(): void {
    console.log('[Event] Logout triggered'); // Log when logout is triggered
    this.effect.logout();
  }

  /**
   * Restore previous session.
   */
  restoreSession(): void {
    console.log('[Event] Restore session triggered'); // Log when restore session is triggered
    this.effect.restoreSession();
  }
}
