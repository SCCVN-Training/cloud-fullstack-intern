import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { AuthReducer } from './with-auth-reducer';

import { STORAGE_KEYS } from '../../../core/constants/storage-keys';
import { LocalStorageService } from '../../../core/services/local-storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { User } from './auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthEffect {
  constructor(
    private readonly reducer: AuthReducer,
    private readonly storage: LocalStorageService,
    private readonly router: Router,
    private readonly notification: NotificationService,
  ) {}

  login(email: string, password: string): void {
    this.reducer.setLoading(true);

    const users = this.storage.get<User[]>(STORAGE_KEYS.USERS) ?? [];

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      this.reducer.setError('User not found.');
      return;
    }

    if (user.password !== password) {
      this.reducer.setError('Invalid password.');
      return;
    }

    this.storage.set(STORAGE_KEYS.CURRENT_USER, user);

    this.reducer.loginSuccess(user);
    this.notification.success(`Welcome back, ${user.username}!`);

    this.router.navigate(['/dashboard']);
  }

  register(username: string, email: string, password: string): void {
    this.reducer.setLoading(true);

    const users = this.storage.get<User[]>(STORAGE_KEYS.USERS) ?? [];

    const existed = users.some((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existed) {
      this.reducer.setError('Email already exists.');
      this.notification.error('This email is already registered.');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      createdAt: new Date().toISOString(),
      avatarUrl: null,
    };

    users.push(newUser);

    this.storage.set(STORAGE_KEYS.USERS, users);

    this.reducer.setUsers(users);

    this.reducer.setLoading(false);

    this.router.navigate(['/login']);
  }

  logout(): void {
    this.storage.remove(STORAGE_KEYS.CURRENT_USER);

    this.reducer.logoutSuccess();

    this.router.navigate(['/']);
  }

  restoreSession(): void {
    const user = this.storage.get<User>(STORAGE_KEYS.CURRENT_USER);

    this.reducer.restoreSession(user);
  }
}
