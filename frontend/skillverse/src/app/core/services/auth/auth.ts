import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface OnboardingProfile {
  fullName: string;
  age: number;
  gender: string;
  bio: string;
  interests: string[];
  skillsLearning: string[];
  // Always 0 at onboarding time — grows later via the teaching/video-session
  // flow, never entered manually here.
  skillsTaught: number;
}

export interface UserRecord {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  // TODO: once wired to the real backend, this should come straight from
  // GET /users/{id}/profile (e.g. profile.is_onboarded) instead of being
  // tracked client-side.
  isOnboarded?: boolean;
  profile?: OnboardingProfile;
  role?: 'user' | 'admin';
}

@Injectable({
  providedIn: 'root',
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

  // Returns true once the current user has completed the onboarding form.
  // Used by the login flow (and can be used by a route guard) to decide
  // whether to send someone to /onboarding or straight to the homepage.
  needsOnboarding(): boolean {
    const user = this.currentUser();
    return !!user && !user.isOnboarded;
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

    // New accounts always start un-onboarded — mirrors the backend, where
    // /auth/register creates an empty Profile row alongside the User row.
    users.push({ ...request, isOnboarded: false });
    this.saveUsers(users);

    return of(true).pipe(delay(1500));
  }

  authenticate(email: string, password: string): Observable<boolean> {
    const user = this.loadUsers().find(
      (item) => item.email === email && item.password === password,
    );

    if (!user) {
      return of(false).pipe(delay(1500));
    }

    this.setCurrentUser(user);
    this.login();
    return of(true).pipe(delay(1500));
  }

  loginWithGoogle(user: { firstName?: string; email?: string; photoUrl?: string }): void {
    const email = user.email ?? '';
    const users = this.loadUsers();
    const existing = users.find((item) => item.email === email);

    const current: UserRecord = existing ?? {
      name: user.firstName ?? 'Google User',
      email,
      password: '',
      avatar: user.photoUrl,
      isOnboarded: false,
    };

    if (!existing) {
      users.push(current);
      this.saveUsers(users);
    }

    this.setCurrentUser(current);
    this.login();
  }

  // Called from the onboarding page on submit. In the mock/local-storage
  // version this just merges the profile into the stored user record.
  //
  // TODO: replace body with a real call once the backend is wired up, e.g.:
  //   return this.http.patch(`/users/${this.currentUser()!.id}/profile`, profile)
  //     .pipe(map(() => true));
  completeOnboarding(profile: OnboardingProfile): Observable<boolean> {
    const current = this.currentUser();
    if (!current) {
      return of(false);
    }

    this.persistUpdatedUser({ ...current, isOnboarded: true, profile });
    return of(true).pipe(delay(800));
  }

  // Used by the Personal Information card's Update button.
  // TODO: replace with PATCH /users/{id}/profile once wired to the backend
  // (full_name -> name, bio stays under profile.bio).
  updateAccountInfo(updates: {
    name?: string;
    email?: string;
    bio?: string;
    age?: number;
    gender?: string;
  }): Observable<boolean> {
    const current = this.currentUser();
    if (!current) {
      return of(false);
    }

    const updatedUser: UserRecord = {
      ...current,
      name: updates.name ?? current.name,
      email: updates.email ?? current.email,
      profile: current.profile
        ? {
            ...current.profile,
            bio: updates.bio ?? current.profile.bio,
            age: updates.age ?? current.profile.age,
            gender: updates.gender ?? current.profile.gender,
          }
        : current.profile,
    };

    this.persistUpdatedUser(updatedUser);
    return of(true).pipe(delay(600));
  }

  // Used by the Delete button's confirmation dialog.
  // TODO: replace with a real call to DELETE /users/{id} once wired to
  // the backend — that endpoint already exists and cascades to the
  // Profile row automatically.
  deleteAccount(): Observable<boolean> {
    const current = this.currentUser();
    if (!current) {
      return of(false);
    }

    const users = this.loadUsers().filter((u) => u.email !== current.email);
    this.saveUsers(users);
    this.logout();

    return of(true).pipe(delay(600));
  }

  // Used by Skills I'm Learning / Interests add & delete on the profile page.
  // TODO: replace with PATCH /users/{id}/profile once wired to the backend
  // (send only the changed array field — interests or skills_learning).
  updateProfileFields(updates: Partial<OnboardingProfile>): Observable<boolean> {
    const current = this.currentUser();
    if (!current || !current.profile) {
      return of(false);
    }

    this.persistUpdatedUser({ ...current, profile: { ...current.profile, ...updates } });
    return of(true).pipe(delay(300));
  }

  // Used by the avatar upload button on the profile page.
  // TODO: real backend integration should upload the file (multipart) to
  // an endpoint that returns a hosted URL, then PATCH profile.avatar_url
  // with that URL — storing a full data: URL server-side isn't practical.
  updateAvatar(avatarDataUrl: string): Observable<boolean> {
    const current = this.currentUser();
    if (!current) {
      return of(false);
    }

    this.persistUpdatedUser({ ...current, avatar: avatarDataUrl });
    return of(true).pipe(delay(400));
  }

  private persistUpdatedUser(updatedUser: UserRecord): void {
    this.setCurrentUser(updatedUser);

    const users = this.loadUsers();
    const index = users.findIndex((u) => u.email === updatedUser.email);
    if (index > -1) {
      users[index] = updatedUser;
      this.saveUsers(users);
    }
  }
}
