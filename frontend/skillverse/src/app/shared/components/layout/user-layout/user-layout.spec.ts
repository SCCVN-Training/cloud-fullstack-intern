import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { vi, describe, beforeEach, it, expect } from 'vitest';

import { UserLayoutComponent } from './user-layout';
import { AuthService } from '../../../../core/services/auth/auth';

describe('UserLayoutComponent', () => {
  let component: UserLayoutComponent;
  let fixture: ComponentFixture<UserLayoutComponent>;
  let router: Router;

  const authServiceMock = {
    isLoggedIn: signal(true),
    currentUser: signal({
      name: 'Test User',
      email: 'test@example.com',
      password: '',
      avatar: '',
    }),
    logout: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(UserLayoutComponent);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();

    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should logout and navigate home', () => {
    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
