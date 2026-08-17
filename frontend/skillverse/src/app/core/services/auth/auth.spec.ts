import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AuthService } from './auth';
import { environment } from '../../../../environments/environment';

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

  describe('constructor', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should restore login state from localStorage', () => {
      localStorage.setItem('access_token', 'test-token');

      const newService = TestBed.inject(AuthService);

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
        JSON.stringify(user),
      );

      const newService = TestBed.inject(AuthService);

      expect(newService.currentUser()).toEqual(user);
    });
  });

  describe('logout', () => {
    it('should clear authentication state', () => {
      localStorage.setItem('access_token', 'token');

      service.isLoggedIn.set(true);

      service.logout();

      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('skillverse_current_user')).toBeNull();
    });
  });

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

  describe('register', () => {
    it('should return true when registration succeeds', () => {
      service
        .register({
          name: 'John',
          email: 'john@example.com',
          password: 'password123',
        })
        .subscribe((result) => {
          expect(result).toBe(true);
        });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/auth/register`,
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
    });

    it('should return false when registration fails', () => {
      service
        .register({
          name: 'John',
          email: 'john@example.com',
          password: 'password123',
        })
        .subscribe((result) => {
          expect(result).toBe(false);
        });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/auth/register`,
      );

      req.flush(
        { detail: 'Registration failed' },
        {
          status: 400,
          statusText: 'Bad Request',
        },
      );
    });
  });

  describe('authenticate', () => {
    it('should login and fetch current user', () => {
      service
        .authenticate('john@example.com', 'password123')
        .subscribe((result) => {
          expect(result).toBe(true);
          expect(service.isLoggedIn()).toBe(true);

          expect(service.currentUser()).toEqual({
            id: '1',
            name: 'John',
            email: 'john@example.com',
            password: '',
            avatar: undefined,
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

      const loginRequest = httpMock.expectOne(
        `${environment.apiUrl}/auth/login`,
      );

      expect(loginRequest.request.method).toBe('POST');

      loginRequest.flush({
        access_token: 'test-token',
        token_type: 'bearer',
      });

      const meRequest = httpMock.expectOne(
        `${environment.apiUrl}/auth/me`,
      );

      expect(meRequest.request.method).toBe('GET');

      meRequest.flush({
        id: '1',
        user_name: 'John',
        email: 'john@example.com',
      });

      const profileRequest = httpMock.expectOne(
        `${environment.apiUrl}/users/1/profile`,
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
    });

    it('should return false when login fails', () => {
      service
        .authenticate('john@example.com', 'wrong-password')
        .subscribe((result) => {
          expect(result).toBe(false);
          expect(service.isLoggedIn()).toBe(false);
        });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/auth/login`,
      );

      req.flush(
        { detail: 'Invalid credentials' },
        {
          status: 401,
          statusText: 'Unauthorized',
        },
      );
    });
  });

  describe('completeOnboarding', () => {
    it('should update onboarding through the backend', () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: false,
      });

      service
        .completeOnboarding({
          age: 25,
          gender: 'Male',
          bio: 'Hello',
          interests: ['Coding'],
          skillsLearning: ['Python'],
          skillsTaught: 0,
        })
        .subscribe((result) => {
          expect(result).toBe(true);
        });

      const patchRequest = httpMock.expectOne(
        `${environment.apiUrl}/users/1/profile`,
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
        `${environment.apiUrl}/auth/me`,
      );

      expect(meRequest.request.method).toBe('GET');

      meRequest.flush({
        id: '1',
        user_name: 'John',
        email: 'john@example.com',
      });

      const profileRequest = httpMock.expectOne(
        `${environment.apiUrl}/users/1/profile`,
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
    });
  });

  describe('updateAccountInfo', () => {
    it('should update user and profile separately', () => {
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

      service
        .updateAccountInfo({
          name: 'New Name',
          email: 'new@example.com',
          bio: 'New bio',
          age: 25,
          gender: 'Male',
        })
        .subscribe((result) => {
          expect(result).toBe(true);
        });

      const requests = httpMock.match((request) =>
        request.method === 'PATCH',
      );

      expect(requests.length).toBe(2);

      const userRequest = requests.find((request) =>
        request.request.url.endsWith('/users/1'),
      );

      const profileRequest = requests.find((request) =>
        request.request.url.endsWith('/users/1/profile'),
      );

      expect(userRequest).toBeTruthy();
      expect(profileRequest).toBeTruthy();

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
        `${environment.apiUrl}/auth/me`,
      );

      meRequest.flush({
        id: '1',
        user_name: 'New Name',
        email: 'new@example.com',
      });

      const profileRequestAfterUpdate = httpMock.expectOne(
        `${environment.apiUrl}/users/1/profile`,
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
    });
  });

  describe('updateProfileFields', () => {
    it('should update interests and learning skills', () => {
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

      service
        .updateProfileFields({
          interests: ['Coding', 'Music'],
          skillsLearning: ['Python'],
        })
        .subscribe((result) => {
          expect(result).toBe(true);
        });

      const patchRequest = httpMock.expectOne(
        `${environment.apiUrl}/users/1/profile`,
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
        `${environment.apiUrl}/auth/me`,
      );

      meRequest.flush({
        id: '1',
        user_name: 'John',
        email: 'john@example.com',
      });

      const profileAfterUpdate = httpMock.expectOne(
        `${environment.apiUrl}/users/1/profile`,
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
    });
  });

  describe('deleteAccount', () => {
    it('should delete the account and logout', () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: true,
      });

      service.isLoggedIn.set(true);

      service.deleteAccount().subscribe((result) => {
        expect(result).toBe(true);
        expect(service.isLoggedIn()).toBe(false);
        expect(service.currentUser()).toBeNull();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/users/1`,
      );

      expect(req.request.method).toBe('DELETE');

      req.flush({});
    });
  });

  describe('updateAvatar', () => {
    it('should update the avatar locally', () => {
      service.currentUser.set({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: '',
        isOnboarded: true,
      });

      service.updateAvatar('data:image/png;base64,test');

      expect(service.currentUser()?.avatar).toBe(
        'data:image/png;base64,test',
      );
    });
  });
});