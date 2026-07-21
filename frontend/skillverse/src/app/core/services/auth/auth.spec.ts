import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    // Mock localStorage
    let store: any = {};
    const mockLocalStorage = {
      getItem: (key: string): string | null => key in store ? store[key] : null,
      setItem: (key: string, value: string) => { store[key] = `${value}`; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    };
    Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });
    
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with isLoggedIn as false when localStorage is empty', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should initialize with isLoggedIn as true when localStorage has isLoggedIn=true', () => {
    localStorage.setItem('isLoggedIn', 'true');
    const newService = new AuthService();
    expect(newService.isLoggedIn()).toBe(true);
  });

  it('should set isLoggedIn to true and save to localStorage on login()', () => {
    service.login();
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
  });

  it('should set isLoggedIn to false and remove from localStorage on logout()', () => {
    // Setup initial state
    service.login();
    expect(service.isLoggedIn()).toBe(true);

    // Perform logout
    service.logout();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('isLoggedIn')).toBeNull();
  });
});
