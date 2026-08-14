import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from './auth';
import { environment } from '../../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const apiUrl = environment.apiUrl;

  const fakeUserId = 'user-123';
  const fakeCurrentUserResponse = {
    id: fakeUserId,
    user_name: 'Cherry',
    email: 'cherry@test.com',
  };
  const fakeProfileResponse = {
    id: 'profile-1',
    user_id: fakeUserId,
    full_name: 'Cherry Nguyen',
    bio: 'Hello!',
    avatar_url: null,
    age: 25,
    gender: 'female',
    interests: ['design'],
    skills_learning: ['Figma'],
    skills_learning_total: 1,
    skills_taught: [],
    skills_taught_total: 0,
    is_onboarded: true,
  };

  beforeEach(() => {
    // Mock localStorage
    let store: Record<string, string> = {};

    const mockLocalStorage = {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // =====================================
  // Service
  // =====================================

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // =====================================
  // Initialization
  // =====================================

  it('should initialize with isLoggedIn=false when localStorage is empty', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should initialize with isLoggedIn=true when a token is already stored', () => {
    localStorage.setItem('access_token', 'existing-token');

    const restored = TestBed.inject(AuthService);

    expect(restored.isLoggedIn()).toBe(true);
  });

  // =====================================
  // Register
  // =====================================

  it('should register successfully', async () => {
    const resultPromise = firstValueFrom(
      service.register({ name: 'Cherry', email: 'cherry@test.com', password: '12345678' }),
    );

    const req = httpMock.expectOne(`${apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      user_name: 'Cherry',
      email: 'cherry@test.com',
      password: '12345678',
    });
    req.flush({ id: fakeUserId, user_name: 'Cherry', email: 'cherry@test.com' });

    expect(await resultPromise).toBe(true);
  });

  it('should return false when register fails', async () => {
    const resultPromise = firstValueFrom(
      service.register({ name: 'Cherry', email: 'taken@test.com', password: '12345678' }),
    );

    const req = httpMock.expectOne(`${apiUrl}/auth/register`);
    req.flush({ detail: 'Email already exists' }, { status: 400, statusText: 'Bad Request' });

    expect(await resultPromise).toBe(false);
  });

  // =====================================
  // Login / authenticate
  // =====================================

  it('should log in, store the token, and populate currentUser', async () => {
    const resultPromise = firstValueFrom(service.authenticate('cherry@test.com', 'password123'));

    const loginReq = httpMock.expectOne(`${apiUrl}/auth/login`);
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ access_token: 'fake-jwt', token_type: 'bearer' });

    const meReq = httpMock.expectOne(`${apiUrl}/auth/me`);
    meReq.flush(fakeCurrentUserResponse);

    const profileReq = httpMock.expectOne(`${apiUrl}/users/${fakeUserId}/profile`);
    profileReq.flush(fakeProfileResponse);

    expect(await resultPromise).toBe(true);
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'fake-jwt');

    const user = service.currentUser();
    expect(user?.name).toBe('Cherry');
    expect(user?.isOnboarded).toBe(true);
    expect(user?.profile?.skillsLearning).toEqual(['Figma']);
  });

  it('should return false when login fails', async () => {
    const resultPromise = firstValueFrom(service.authenticate('cherry@test.com', 'wrong-pass'));

    const loginReq = httpMock.expectOne(`${apiUrl}/auth/login`);
    loginReq.flush({ detail: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(await resultPromise).toBe(false);
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should still resolve when the profile fetch fails (treat as not onboarded)', async () => {
    const resultPromise = firstValueFrom(service.authenticate('cherry@test.com', 'password123'));

    httpMock.expectOne(`${apiUrl}/auth/login`).flush({ access_token: 'fake-jwt', token_type: 'bearer' });
    httpMock.expectOne(`${apiUrl}/auth/me`).flush(fakeCurrentUserResponse);
    httpMock
      .expectOne(`${apiUrl}/users/${fakeUserId}/profile`)
      .flush({ detail: 'Profile not found' }, { status: 404, statusText: 'Not Found' });

    expect(await resultPromise).toBe(true);
    expect(service.currentUser()?.isOnboarded).toBe(false);
    expect(service.currentUser()?.profile).toBeUndefined();
  });

  // =====================================
  // needsOnboarding
  // =====================================

  it('needsOnboarding should be true when there is a user but isOnboarded is false', async () => {
    const resultPromise = firstValueFrom(service.authenticate('cherry@test.com', 'password123'));
    httpMock.expectOne(`${apiUrl}/auth/login`).flush({ access_token: 'fake-jwt', token_type: 'bearer' });
    httpMock.expectOne(`${apiUrl}/auth/me`).flush(fakeCurrentUserResponse);
    httpMock
      .expectOne(`${apiUrl}/users/${fakeUserId}/profile`)
      .flush({ ...fakeProfileResponse, is_onboarded: false });
    await resultPromise;

    expect(service.needsOnboarding()).toBe(true);
  });

  it('needsOnboarding should be false when there is no current user', () => {
    expect(service.needsOnboarding()).toBe(false);
  });

  // =====================================
  // Logout
  // =====================================

  it('should clear token and currentUser on logout', async () => {
    const resultPromise = firstValueFrom(service.authenticate('cherry@test.com', 'password123'));
    httpMock.expectOne(`${apiUrl}/auth/login`).flush({ access_token: 'fake-jwt', token_type: 'bearer' });
    httpMock.expectOne(`${apiUrl}/auth/me`).flush(fakeCurrentUserResponse);
    httpMock.expectOne(`${apiUrl}/users/${fakeUserId}/profile`).flush(fakeProfileResponse);
    await resultPromise;

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
  });

  // =====================================
  // completeOnboarding
  // =====================================

  it('should return false from completeOnboarding when there is no current user', async () => {
    const result = await firstValueFrom(
      service.completeOnboarding({
        fullName: 'Cherry',
        age: 25,
        gender: 'female',
        bio: '',
        interests: [],
        skillsLearning: [],
        skillsTaught: 0,
      }),
    );

    expect(result).toBe(false);
  });

  it('should PATCH the profile and refetch on completeOnboarding', async () => {
    // log in first so there's a currentUser to act on
    const loginPromise = firstValueFrom(service.authenticate('cherry@test.com', 'password123'));
    httpMock.expectOne(`${apiUrl}/auth/login`).flush({ access_token: 'fake-jwt', token_type: 'bearer' });
    httpMock.expectOne(`${apiUrl}/auth/me`).flush(fakeCurrentUserResponse);
    httpMock
      .expectOne(`${apiUrl}/users/${fakeUserId}/profile`)
      .flush({ ...fakeProfileResponse, is_onboarded: false });
    await loginPromise;

    const resultPromise = firstValueFrom(
      service.completeOnboarding({
        fullName: 'Cherry Nguyen',
        age: 25,
        gender: 'female',
        bio: 'Hello!',
        interests: ['design'],
        skillsLearning: ['Figma'],
        skillsTaught: 0,
      }),
    );

    const patchReq = httpMock.expectOne(`${apiUrl}/users/${fakeUserId}/profile`);
    expect(patchReq.request.method).toBe('PATCH');
    expect(patchReq.request.body.is_onboarded).toBe(true);
    patchReq.flush({ ...fakeProfileResponse, is_onboarded: true });

    // completeOnboarding refetches via fetchCurrentUser()
    httpMock.expectOne(`${apiUrl}/auth/me`).flush(fakeCurrentUserResponse);
    httpMock.expectOne(`${apiUrl}/users/${fakeUserId}/profile`).flush({ ...fakeProfileResponse, is_onboarded: true });

    expect(await resultPromise).toBe(true);
    expect(service.currentUser()?.isOnboarded).toBe(true);
  });

  // =====================================
  // deleteAccount
  // =====================================

  it('should DELETE the user and log out on success', async () => {
    const loginPromise = firstValueFrom(service.authenticate('cherry@test.com', 'password123'));
    httpMock.expectOne(`${apiUrl}/auth/login`).flush({ access_token: 'fake-jwt', token_type: 'bearer' });
    httpMock.expectOne(`${apiUrl}/auth/me`).flush(fakeCurrentUserResponse);
    httpMock.expectOne(`${apiUrl}/users/${fakeUserId}/profile`).flush(fakeProfileResponse);
    await loginPromise;

    const resultPromise = firstValueFrom(service.deleteAccount());

    const deleteReq = httpMock.expectOne(`${apiUrl}/users/${fakeUserId}`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    expect(await resultPromise).toBe(true);
    expect(service.isLoggedIn()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  // =====================================
  // updateAvatar (local-only stub — see auth.ts comment)
  // =====================================

  it('should update avatar locally without making an HTTP call', async () => {
    const loginPromise = firstValueFrom(service.authenticate('cherry@test.com', 'password123'));
    httpMock.expectOne(`${apiUrl}/auth/login`).flush({ access_token: 'fake-jwt', token_type: 'bearer' });
    httpMock.expectOne(`${apiUrl}/auth/me`).flush(fakeCurrentUserResponse);
    httpMock.expectOne(`${apiUrl}/users/${fakeUserId}/profile`).flush(fakeProfileResponse);
    await loginPromise;

    const result = await firstValueFrom(service.updateAvatar('data:image/png;base64,fakedata'));

    expect(result).toBe(true);
    expect(service.currentUser()?.avatar).toBe('data:image/png;base64,fakedata');
    httpMock.expectNone(`${apiUrl}/users/${fakeUserId}/profile`);
  });
});