import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

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
      })
    };

    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
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
  });

  it('should initialize with isLoggedIn=true when localStorage contains true', () => {
    localStorage.setItem('isLoggedIn', 'true');

    const newService = new AuthService();

    expect(newService.isLoggedIn()).toBe(true);
  });

  // =====================================
  // Login
  // =====================================

  it('should login successfully', () => {
    service.login();

    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'isLoggedIn',
      'true'
    );
  });

  // =====================================
  // Logout
  // =====================================

  it('should logout successfully', () => {
    service.login();

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith(
      'isLoggedIn'
    );
  });

  // =====================================
  // Register
  // =====================================

  it('should register successfully', async () => {
    const result = await firstValueFrom(
      service.register({
        name: 'Cherry',
        email: 'cherry@test.com',
        password: '123456'
      })
    );

    expect(result).toBe(true);
  });

  it('should return an Observable from register()', () => {
    const observable = service.register({
      name: 'Cherry',
      email: 'cherry@test.com',
      password: '123456'
    });

    expect(observable).toBeTruthy();
    expect(typeof observable.subscribe).toBe('function');
  });
});