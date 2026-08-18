import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin, catchError, map, tap, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  RegisterRequest,
  OnboardingProfile,
  UserRecord,
  RegisterResponse,
  LoginResponse,
  CurrentUserResponse,
  ProfileResponse,
  UserUpdateRequest,
  ProfileUpdateRequest,
} from './auth.types';
import { toUserRecord } from './auth.mapper';

export type { RegisterRequest, OnboardingProfile, UserRecord } from './auth.types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn = signal<boolean>(false);
  currentUser = signal<UserRecord | null>(null);

  private readonly tokenKey = 'access_token';
  private readonly currentUserKey = 'skillverse_current_user';
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem(this.tokenKey);
      const storedUser = localStorage.getItem(this.currentUserKey);

      if (token) {
        this.isLoggedIn.set(true);
      }
      if (storedUser) {
        this.currentUser.set(JSON.parse(storedUser));
      }
    }
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
  needsOnboarding(): boolean {
    const user = this.currentUser();
    return !!user && !user.isOnboarded;
  }

  logout(): void {
    this.isLoggedIn.set(false);
    this.setCurrentUser(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
    }
  }

  // POST /auth/register
  register(request: RegisterRequest): Observable<boolean> {
    const body = {
      user_name: request.name,
      email: request.email,
      password: request.password,
    };

    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, body).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  // POST /auth/login, then GET /auth/me + GET /users/{id}/profile to
  // populate currentUser. Chained with switchMap (not a fire-and-forget
  // tap) so the returned Observable only emits `true` once currentUser()
  // is actually populated — callers like login.ts read needsOnboarding()
  // right after this resolves, and that read would race a fire-and-forget
  // fetchCurrentUser() call.
  authenticate(email: string, password: string): Observable<boolean> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.tokenKey, res.access_token);
        }
        this.isLoggedIn.set(true);
      }),
      switchMap(() => this.fetchCurrentUser()),
      map((user) => user !== null),
      catchError(() => of(false)),
    );
  }

  // GET /auth/me, then GET /users/{id}/profile — requires the
  // Authorization header, added by the auth interceptor (see
  // core/interceptors/auth.interceptor.ts).
  fetchCurrentUser(): Observable<UserRecord | null> {
    return this.http.get<CurrentUserResponse>(`${this.apiUrl}/auth/me`).pipe(
      switchMap((res) =>
        this.http.get<ProfileResponse>(`${this.apiUrl}/users/${res.id}/profile`).pipe(
          map((profile) => toUserRecord(res, profile)),
          // A brand-new user's profile row is created server-side at
          // registration, but if that ever fails, treat "no profile" as
          // "not onboarded" rather than failing the whole login.
          catchError(() => of(toUserRecord(res, null))),
        ),
      ),
      tap((user) => this.setCurrentUser(user)),
      catchError(() => {
        this.logout();
        return of(null);
      }),
    );
  }

  // Google login isn't backed by a real endpoint yet — kept as a local
  // stand-in until the backend adds Google OAuth support.
  loginWithGoogle(user: { firstName?: string; email?: string; photoUrl?: string }): void {
    const current: UserRecord = {
      name: user.firstName ?? 'Google User',
      email: user.email ?? '',
      password: '',
      avatar: user.photoUrl,
      isOnboarded: false,
    };
    this.setCurrentUser(current);
    this.isLoggedIn.set(true);
  }

  // PATCH /users/{id}/profile — persists is_onboarded and the rest of the
  // onboarding form. Refetches afterward instead of trusting a
  // locally-built object, so the UI reflects exactly what the server
  // stored (e.g. skillsTaught is server-computed, never client-set).
  completeOnboarding(profile: OnboardingProfile): Observable<boolean> {
    const current = this.currentUser();
    if (!current?.id) {
      return of(false);
    }

    const body: ProfileUpdateRequest = {
      bio: profile.bio,
      age: profile.age,
      gender: profile.gender,
      interests: profile.interests,
      skills_learning: profile.skillsLearning,
      is_onboarded: true,
    };

    return this.http
      .patch<ProfileResponse>(`${this.apiUrl}/users/${current.id}/profile`, body)
      .pipe(
        switchMap(() => this.fetchCurrentUser()),
        map((user) => user !== null),
        catchError(() => of(false)),
      );
  }

  // Splits across two owners, matching the backend: name/email live on
  // User (PATCH /users/{id}), bio/age/gender live on Profile
  // (PATCH /users/{id}/profile). Both run in parallel via forkJoin, then
  // the merged result is refetched once.
  updateAccountInfo(updates: {
    name?: string;
    email?: string;
    bio?: string;
    age?: number;
    gender?: string;
  }): Observable<boolean> {
    const current = this.currentUser();
    if (!current?.id) {
      return of(false);
    }

    const userPatch$ =
      updates.name || updates.email
        ? this.http.patch<UserUpdateRequest>(`${this.apiUrl}/users/${current.id}`, {
            user_name: updates.name,
            email: updates.email,
          })
        : of(null);

    const profilePatch$ =
      updates.bio !== undefined || updates.age !== undefined || updates.gender !== undefined
        ? this.http.patch<ProfileUpdateRequest>(`${this.apiUrl}/users/${current.id}/profile`, {
            bio: updates.bio,
            age: updates.age,
            gender: updates.gender,
          })
        : of(null);

    return forkJoin([userPatch$, profilePatch$]).pipe(
      switchMap(() => this.fetchCurrentUser()),
      map((user) => user !== null),
      catchError(() => of(false)),
    );
  }

  // DELETE /users/{id}
  deleteAccount(): Observable<boolean> {
    const current = this.currentUser();
    if (!current?.id) {
      return of(false);
    }
    return this.http.delete(`${this.apiUrl}/users/${current.id}`).pipe(
      map(() => {
        this.logout();
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  // PATCH /users/{id}/profile — used for the inline add/remove controls
  // on "Skills I'm Learning" and "Interests". Only the fields present in
  // `updates` are sent.
  updateProfileFields(updates: Partial<OnboardingProfile>): Observable<boolean> {
    const current = this.currentUser();
    if (!current?.id) {
      return of(false);
    }

    const body: ProfileUpdateRequest = {};
    if (updates.interests !== undefined) body.interests = updates.interests;
    if (updates.skillsLearning !== undefined) body.skills_learning = updates.skillsLearning;

    return this.http
      .patch<ProfileResponse>(`${this.apiUrl}/users/${current.id}/profile`, body)
      .pipe(
        switchMap(() => this.fetchCurrentUser()),
        map((user) => user !== null),
        catchError(() => of(false)),
      );
  }

  // POST /users/{id}/profile/avatar — multipart upload. Backend saves the
  // file (locally for now, S3 later) and returns the updated profile with
  // a real avatar_url already set, so we just fold that into currentUser.
  updateAvatar(file: File): Observable<boolean> {
    const current = this.currentUser();
    if (!current?.id) {
      return of(false);
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ProfileResponse>(`${this.apiUrl}/users/${current.id}/profile/avatar`, formData)
      .pipe(
        map((profileRes) => {
          this.setCurrentUser({ ...current, avatar: profileRes.avatar_url ?? current.avatar });
          return true;
        }),
        catchError(() => of(false)),
      );
  }
}