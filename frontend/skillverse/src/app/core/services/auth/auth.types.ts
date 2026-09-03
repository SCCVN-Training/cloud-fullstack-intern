// ---- Frontend-facing shapes (camelCase) — what components read/write ----

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface OnboardingProfile {
  age: number;
  gender: string;
  bio: string;
  interests: string[];
  skillsLearning: string[];
  skillsTaught: number;
}

export interface UserRecord {
  id?: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  isOnboarded?: boolean;
  profile?: OnboardingProfile;
  role?: 'user' | 'admin';
}

// ---- Backend DTOs (snake_case) — exact shapes returned by FastAPI ----

export interface RegisterResponse {
  id: string;
  user_name: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUserResponse {
  id: string;
  user_name: string;
  email: string;
  role: string;
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  user_name: string;
  bio: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: string | null;
  interests: string[];
  skills_learning: string[];
  skills_learning_total: number;
  skills_taught: string[];
  skills_taught_total: number;
  is_onboarded: boolean;
}

// ---- Request bodies the service sends ----

export interface UserUpdateRequest {
  user_name?: string;
  email?: string;
}

export interface ProfileUpdateRequest {
  user_name?: string;
  bio?: string;
  avatar_url?: string;
  age?: number;
  gender?: string;
  interests?: string[];
  skills_learning?: string[];
  is_onboarded?: boolean;
}
