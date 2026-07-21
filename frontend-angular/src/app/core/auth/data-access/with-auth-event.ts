import { Injectable } from '@angular/core';

import { LoginPayload, RegisterPayload } from './auth.schema';
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
    console.log('[Auth Event] Login triggered with payload:', payload); // Log the payload to check its structure
    this.effect.login(payload).subscribe();
  }

  /**
   * Register new account.
   */
  register(payload: RegisterPayload): void {
    console.log('[Auth Event] Register triggered with payload:', payload); // Log the payload to check its structure
    this.effect.register(payload).subscribe();
  }

  /**
   * Logout current user.
   */
  logout(): void {
    console.log('[Auth Event] Logout triggered'); // Log when logout is triggered
    this.effect.logout().subscribe();
  }

  /**
   * Restore previous session.
   */
  restoreSession(): void {
    console.log('[Auth Event] Restore session triggered'); // Log when restore session is triggered
    this.effect.restoreSession().subscribe();
  }

  getCurrentUser(): void {
    console.log('[Auth Event] Get current user triggered');
    this.effect.getCurrentUser().subscribe();
  }
}
