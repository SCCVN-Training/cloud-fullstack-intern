import { z } from 'zod';

// User Profile
export const UserProfileSchema = z.object({
  userId: z.uuid(),
  displayName: z.string(),

  bio: z.string().nullable(),

  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),

  profileCardStyle: z.string(),

  accentColor: z.string(),
  backgroundColor: z.string(),

  isProfilePublic: z.boolean(),

  totalAnime: z.number().int(),
  totalManga: z.number().int(),
  totalMusic: z.number().int(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GetProfileResponseSchema = z.object({
  message: z.string(),
  data: UserProfileSchema,
});

// Types
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type GetProfileResponse = z.infer<typeof GetProfileResponseSchema>;
