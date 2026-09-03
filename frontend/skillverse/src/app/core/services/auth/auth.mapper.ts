import { CurrentUserResponse, ProfileResponse, UserRecord } from './auth.types';

export function toUserRecord(
  user: CurrentUserResponse,
  profile: ProfileResponse | null,
): UserRecord {
  return {
    id: user.id,
    // profile.user_name is already resolved server-side (display-name
    // override if the user set one, else their login handle) — see
    // ProfileService.get_profile on identity-service. Prefer it over
    // user.user_name (always the raw login handle, from /auth/me)
    // so this matches what marketplace-service shows as instructorName
    // for the same person. Falls back to the login handle only when no
    // profile has loaded yet (e.g. mid-registration).
    name: profile?.user_name ?? user.user_name,
    email: user.email,
    password: '',
    role: user.role === 'ADMIN' ? 'admin' : 'user',
    avatar: profile?.avatar_url ?? undefined,
    isOnboarded: profile?.is_onboarded ?? false,
    profile: profile
      ? {
          bio: profile.bio ?? '',
          age: profile.age ?? 0,
          gender: profile.gender ?? '',
          interests: profile.interests,
          skillsLearning: profile.skills_learning,
          skillsTaught: profile.skills_taught_total,
        }
      : undefined,
  };
}
