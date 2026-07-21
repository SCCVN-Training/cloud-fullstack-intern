import { Injectable, signal } from '@angular/core';

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

  login() {
    this.isLoggedIn.set(true);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true');
    }
  }

  logout() {
    this.isLoggedIn.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
    }
  }
}
