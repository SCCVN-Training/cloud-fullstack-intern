import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserRecord {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isLoggedIn = signal<boolean>(false);
  currentUser = signal<UserRecord | null>(null);

  private readonly usersKey = 'skillverse_users';
  private readonly currentUserKey = 'skillverse_current_user';

  constructor() {
    if (typeof localStorage !== 'undefined') {
      const storedLogin = localStorage.getItem('isLoggedIn');
      const storedUser = localStorage.getItem(this.currentUserKey);

      if (storedLogin === 'true') {
        this.isLoggedIn.set(true);
      }

      if (storedUser) {
        this.currentUser.set(JSON.parse(storedUser));
      }
    }
  }

  private loadUsers(): UserRecord[] {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(this.usersKey);
    return raw ? JSON.parse(raw) : [];
  }

  private saveUsers(users: UserRecord[]): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }

  private setCurrentUser(user: UserRecord | null): void {
    this.currentUser.set(user);

    if (typeof localStorage === 'undefined') return;

    if (user) {
      localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.currentUserKey);
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
    this.setCurrentUser(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
    }
  }

  register(request: RegisterRequest): Observable<boolean> {
    const users = this.loadUsers();

    if (users.some((user) => user.email === request.email)) {
      return of(false).pipe(delay(1500));
    }

    users.push({ ...request });
    this.saveUsers(users);

    return of(true).pipe(delay(1500));
  }

  authenticate(email: string, password: string): Observable<boolean> {
    const user = this.loadUsers().find(
      (item) => item.email === email && item.password === password
    );

    if (!user) {
      return of(false).pipe(delay(1500));
    }

    this.setCurrentUser(user);
    this.login();
    return of(true).pipe(delay(1500));
  }

  loginWithGoogle(user: { firstName?: string; email?: string; photoUrl?: string }): void {
    const current: UserRecord = {
      name: user.firstName ?? 'Google User',
      email: user.email ?? '',
      password: '',
      avatar: user.photoUrl
    };
    this.setCurrentUser(current);
    this.login();
  }
}