export interface AppState {
  serverAvailable: boolean;
  initialized: boolean;
  version: string;
}

export const initialState: AppState = {
  serverAvailable: true,
  initialized: false,
  version: '',
};
