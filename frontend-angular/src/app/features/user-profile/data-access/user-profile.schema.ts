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

  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GetProfileResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    profile: UserProfileSchema,
  }),
});

export const CreateProfileRequestSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
});

// Types
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type GetProfileResponse = z.infer<typeof GetProfileResponseSchema>;
export type CreateProfileRequest = z.infer<typeof CreateProfileRequestSchema>;
