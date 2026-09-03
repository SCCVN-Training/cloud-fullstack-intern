import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AuthService } from './auth';
import { environment } from '../../../../environments/environment';

// ------------------------------------------------------------
// localStorage mock for Vitest / Node
// ------------------------------------------------------------
if (typeof (globalThis as any).localStorage === 'undefined') {
  const _store: Record<string, string> = {};

  (globalThis as any).localStorage = {
    getItem: (key: string) =>
      Object.prototype.hasOwnProperty.call(_store, key)
        ? _store[key]
        : null,

    setItem: (key: string, value: string) => {
      _store[key] = String(value);
    },

    removeItem: (key: string) => {
      delete _store[key];
    },

    clear: () => {
      for (const key in _store) {
        if (Object.prototype.hasOwnProperty.call(_store, key)) {
          delete _store[key];
        }
      }
    },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  describe('constructor', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should restore login state from localStorage', () => {
      localStorage.setItem('access_token', 'test-token');

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http);

      expect(newService.isLoggedIn()).toBe(true);
    });

    it('should restore current user from localStorage', () => {
      const user = {
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: true,
      };

      localStorage.setItem(
        'skillverse_current_user',
        JSON.stringify(user)
      );

      const http = TestBed.inject(HttpClient);
      const newService = new AuthService(http);

      expect(newService.currentUser()).toEqual(user);
    });
  });

  // ==========================================================
  // LOGOUT
  // ==========================================================

  describe('logout', () => {
    it('should clear authentication state', () => {
      localStorage.setItem('access_token', 'token');

      service.isLoggedIn.set(true);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(
        localStorage.getItem('skillverse_current_user')
      ).toBeNull();
    });
  });

  // ==========================================================
  // NEEDS ONBOARDING
  // ==========================================================

  describe('needsOnboarding', () => {
    it('should return true when user has not completed onboarding', () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: false,
      });

      expect(service.needsOnboarding()).toBe(true);
    });

    it('should return false when user has completed onboarding', () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: true,
      });

      expect(service.needsOnboarding()).toBe(false);
    });

    it('should return false when there is no current user', () => {
      expect(service.needsOnboarding()).toBe(false);
    });
  });

  // ==========================================================
  // REGISTER
  // ==========================================================

  describe('register', () => {
    it('should return true when registration succeeds', async () => {
      const resultPromise = firstValueFrom(
        service.register({
          name: 'John',
          email: 'john@example.com',
          password: 'password123',
        })
      );

      const req = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/register`
      );

      expect(req.request.method).toBe('POST');

      expect(req.request.body).toEqual({
        user_name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      req.flush({
        id: '1',
        user_name: 'John',
        email: 'john@example.com',
      });

      const result = await resultPromise;

      expect(result).toBe(true);
    });

    it('should return false when registration fails', async () => {
      const resultPromise = firstValueFrom(
        service.register({
          name: 'John',
          email: 'john@example.com',
          password: 'password123',
        })
      );

      const req = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/register`
      );

      expect(req.request.method).toBe('POST');

      req.flush(
        { detail: 'Registration failed' },
        {
          status: 400,
          statusText: 'Bad Request',
        }
      );

      const result = await resultPromise;

      expect(result).toBe(false);
    });
  });

  // ==========================================================
  // AUTHENTICATE
  // ==========================================================

  describe('authenticate', () => {
    it('should login and fetch current user', async () => {
      /*
       * IMPORTANT:
       * Do NOT put expect(...) inside subscribe().
       *
       * Using firstValueFrom makes the test wait for the
       * complete observable chain. This prevents Vitest from
       * reporting an "Unhandled Errors" assertion.
       */
      const resultPromise = firstValueFrom(
        service.authenticate(
          'john@example.com',
          'password123'
        )
      );

      // ------------------------------------------------------
      // 1. Login request
      // ------------------------------------------------------

      const loginRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/login`
      );

      expect(loginRequest.request.method).toBe('POST');

      loginRequest.flush({
        access_token: 'test-token',
        token_type: 'bearer',
      });

      // ------------------------------------------------------
      // 2. /auth/me request
      // ------------------------------------------------------

      const meRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/me`
      );

      expect(meRequest.request.method).toBe('GET');

      meRequest.flush({
        id: '1',
        user_name: 'John',
        email: 'john@example.com',
      });

      // ------------------------------------------------------
      // 3. Profile request
      // ------------------------------------------------------

      const profileRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1/profile`
      );

      expect(profileRequest.request.method).toBe('GET');

      profileRequest.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'John',
        bio: 'Hello',
        avatar_url: null,
        age: 25,
        gender: 'Male',
        interests: ['Coding'],
        skills_learning: ['Python'],
        skills_learning_total: 1,
        skills_taught: [],
        skills_taught_total: 2,
        is_onboarded: true,
      });

      // ------------------------------------------------------
      // Wait for the complete observable chain
      // ------------------------------------------------------

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(service.isLoggedIn()).toBe(true);

      /*
       * IMPORTANT:
       *
       * Your AuthService maps the backend profile response into
       * the frontend User model.
       *
       * skills_taught_total = 2
       * therefore skillsTaught = 2.
       *
       * avatar_url = null
       * therefore avatar may be undefined depending on the
       * mapping implementation.
       */
      const currentUser = service.currentUser();

      expect(currentUser).toEqual({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        avatar: undefined,
        role: 'user',
        isOnboarded: true,
        profile: {
          bio: 'Hello',
          age: 25,
          gender: 'Male',
          interests: ['Coding'],
          skillsLearning: ['Python'],
          skillsTaught: 2,
        },
      });
    });

    it('should return false when login fails', async () => {
      const resultPromise = firstValueFrom(
        service.authenticate(
          'john@example.com',
          'wrong-password'
        )
      );

      const req = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/login`
      );

      expect(req.request.method).toBe('POST');

      req.flush(
        { detail: 'Invalid credentials' },
        {
          status: 401,
          statusText: 'Unauthorized',
        }
      );

      const result = await resultPromise;

      expect(result).toBe(false);
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ==========================================================
  // COMPLETE ONBOARDING
  // ==========================================================

  describe('completeOnboarding', () => {
    it('should update onboarding through the backend', async () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: false,
      });

      const resultPromise = firstValueFrom(
        service.completeOnboarding({
          age: 25,
          gender: 'Male',
          bio: 'Hello',
          interests: ['Coding'],
          skillsLearning: ['Python'],
          skillsTaught: 0,
        })
      );

      const patchRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1/profile`
      );

      expect(patchRequest.request.method).toBe('PATCH');

      expect(patchRequest.request.body).toEqual({
        bio: 'Hello',
        age: 25,
        gender: 'Male',
        interests: ['Coding'],
        skills_learning: ['Python'],
        is_onboarded: true,
      });

      patchRequest.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'John',
        bio: 'Hello',
        avatar_url: null,
        age: 25,
        gender: 'Male',
        interests: ['Coding'],
        skills_learning: ['Python'],
        skills_learning_total: 1,
        skills_taught: [],
        skills_taught_total: 0,
        is_onboarded: true,
      });

      const meRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/me`
      );

      expect(meRequest.request.method).toBe('GET');

      meRequest.flush({
        id: '1',
        user_name: 'John',
        email: 'john@example.com',
      });

      const profileRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1/profile`
      );

      expect(profileRequest.request.method).toBe('GET');

      profileRequest.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'John',
        bio: 'Hello',
        avatar_url: null,
        age: 25,
        gender: 'Male',
        interests: ['Coding'],
        skills_learning: ['Python'],
        skills_learning_total: 1,
        skills_taught: [],
        skills_taught_total: 0,
        is_onboarded: true,
      });

      const result = await resultPromise;

      expect(result).toBe(true);
    });
  });

  // ==========================================================
  // UPDATE ACCOUNT INFO
  // ==========================================================

  describe('updateAccountInfo', () => {
    it('should update user and profile separately', async () => {
      service.currentUser.set({
        id: '1',
        name: 'Old Name',
        email: 'old@example.com',
        password: '',
        isOnboarded: true,
        profile: {
          age: 20,
          gender: 'Male',
          bio: 'Old bio',
          interests: [],
          skillsLearning: [],
          skillsTaught: 0,
        },
      });

      const resultPromise = firstValueFrom(
        service.updateAccountInfo({
          name: 'New Name',
          email: 'new@example.com',
          bio: 'New bio',
          age: 25,
          gender: 'Male',
        })
      );

      const requests = httpMock.match(
        (request) => request.method === 'PATCH'
      );

      expect(requests.length).toBe(2);

      const userRequest = requests.find((request) =>
        request.request.url.endsWith('/users/1')
      );

      const profileRequest = requests.find((request) =>
        request.request.url.endsWith('/users/1/profile')
      );

      expect(userRequest).toBeTruthy();
      expect(profileRequest).toBeTruthy();

      expect(userRequest!.request.body).toEqual({
        email: 'new@example.com',
      });

      expect(profileRequest!.request.body.user_name).toBe(
        'New Name'
      );

      userRequest!.flush({
        id: '1',
        user_name: 'New Name',
        email: 'new@example.com',
      });

      profileRequest!.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'New Name',
        bio: 'New bio',
        avatar_url: null,
        age: 25,
        gender: 'Male',
        interests: [],
        skills_learning: [],
        skills_learning_total: 0,
        skills_taught: [],
        skills_taught_total: 0,
        is_onboarded: true,
      });

      const meRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/me`
      );

      meRequest.flush({
        id: '1',
        user_name: 'New Name',
        email: 'new@example.com',
      });

      const profileRequestAfterUpdate = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1/profile`
      );

      profileRequestAfterUpdate.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'New Name',
        bio: 'New bio',
        avatar_url: null,
        age: 25,
        gender: 'Male',
        interests: [],
        skills_learning: [],
        skills_learning_total: 0,
        skills_taught: [],
        skills_taught_total: 0,
        is_onboarded: true,
      });

      const result = await resultPromise;

      expect(result).toBe(true);
    });
  });

  // ==========================================================
  // UPDATE PROFILE FIELDS
  // ==========================================================

  describe('updateProfileFields', () => {
    it('should update interests and learning skills', async () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: true,
        profile: {
          age: 25,
          gender: 'Male',
          bio: '',
          interests: [],
          skillsLearning: [],
          skillsTaught: 0,
        },
      });

      const resultPromise = firstValueFrom(
        service.updateProfileFields({
          interests: ['Coding', 'Music'],
          skillsLearning: ['Python'],
        })
      );

      const patchRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1/profile`
      );

      expect(patchRequest.request.method).toBe('PATCH');

      expect(patchRequest.request.body).toEqual({
        interests: ['Coding', 'Music'],
        skills_learning: ['Python'],
      });

      patchRequest.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'John',
        bio: '',
        avatar_url: null,
        age: 25,
        gender: 'Male',
        interests: ['Coding', 'Music'],
        skills_learning: ['Python'],
        skills_learning_total: 1,
        skills_taught: [],
        skills_taught_total: 0,
        is_onboarded: true,
      });

      const meRequest = httpMock.expectOne(
        `${environment.identityApiUrl}/auth/me`
      );

      meRequest.flush({
        id: '1',
        user_name: 'John',
        email: 'john@example.com',
      });

      const profileAfterUpdate = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1/profile`
      );

      profileAfterUpdate.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'John',
        bio: '',
        avatar_url: null,
        age: 25,
        gender: 'Male',
        interests: ['Coding', 'Music'],
        skills_learning: ['Python'],
        skills_learning_total: 1,
        skills_taught: [],
        skills_taught_total: 0,
        is_onboarded: true,
      });

      const result = await resultPromise;

      expect(result).toBe(true);
    });
  });

  // ==========================================================
  // DELETE ACCOUNT
  // ==========================================================

  describe('deleteAccount', () => {
    it('should delete the account and logout', async () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: true,
      });

      service.isLoggedIn.set(true);

      const resultPromise = firstValueFrom(
        service.deleteAccount()
      );

      const req = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1`
      );

      expect(req.request.method).toBe('DELETE');

      req.flush({});

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  // ==========================================================
  // UPDATE AVATAR
  // ==========================================================

  describe('updateAvatar', () => {
    it('should update the avatar locally', async () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: true,
      });

      const file = new File(
        ['test image content'],
        'avatar.png',
        { type: 'image/png' }
      );

      const resultPromise = firstValueFrom(
        service.updateAvatar(file)
      );

      const req = httpMock.expectOne(
        `${environment.identityApiUrl}/users/1/profile/avatar`
      );

      expect(req.request.method).toBe('POST');

      req.flush({
        id: 'profile-1',
        user_id: '1',
        user_name: 'John',
        avatar_url: 'data:image/png;base64,test',
        bio: '',
        age: 25,
        gender: 'Male',
        interests: [],
        skills_learning: [],
        skills_learning_total: 0,
        skills_taught: [],
        skills_taught_total: 0,
        is_onboarded: true,
      });

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(service.currentUser()?.avatar).toBe(
        'data:image/png;base64,test'
      );
    });
  });
});