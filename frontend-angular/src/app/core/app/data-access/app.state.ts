export interface AppState {
  serverAvailable: boolean;
  initialized: boolean;
  profileLoaded: boolean;
  version: string;
}

export const initialState: AppState = {
  serverAvailable: true,
  initialized: false,
  profileLoaded: false,
  version: '',
};
