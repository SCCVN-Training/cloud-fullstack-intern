import { UserProfile } from './user-profile.schema';

export interface UserProfileState {
  profile: UserProfile | null;

  loading: boolean;

  error: string | null;
}

export const initialState: UserProfileState = {
  profile: null,
  loading: false,
  error: null,
};
