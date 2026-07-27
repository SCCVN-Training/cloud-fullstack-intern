import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, beforeEach, it, expect } from 'vitest';

import { Profile } from './profile';
import { AuthService } from '../../../core/services/auth/auth';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  const authServiceMock = {
    isLoggedIn: signal(true),
    currentUser: signal({
      name: 'Lorena',
      email: 'lorena@example.com',
      password: '',
      avatar: '',
    }),
    logout: () => {},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject AuthService', () => {
    expect(component.authService).toBe(authServiceMock);
  });

  it('should display current user name', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Lorena');
  });

  it('should display current user email', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const emailInput = compiled.querySelector('input[type="email"]') as HTMLInputElement;

    expect(emailInput.value).toBe('lorena@example.com');
  });

  it('should update when currentUser signal changes', () => {
    authServiceMock.currentUser.set({
      name: 'Cherry',
      email: 'cherry@example.com',
      password: '',
      avatar: '',
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Cherry');

    const emailInput = compiled.querySelector('input[type="email"]') as HTMLInputElement;

    expect(emailInput.value).toBe('cherry@example.com');
  });
});
