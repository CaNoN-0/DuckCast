export interface UserProfileData {
  username: string;
  bio: string;
  avatarUrl: string;
}

export const DEFAULT_PROFILE: UserProfileData = {
  username: 'DuckProphet',
  bio: 'Forecasting the future with data, thesis backing, and on-chain skin in the game.',
  avatarUrl: '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg'
};
