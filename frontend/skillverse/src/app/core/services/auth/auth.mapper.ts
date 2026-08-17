import { CurrentUserResponse, ProfileResponse, UserRecord } from './auth.types';

export function toUserRecord(
  user: CurrentUserResponse,
  profile: ProfileResponse | null,
): UserRecord {
  return {
    id: user.id,
    name: user.user_name,
    email: user.email,
    password: '',
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
