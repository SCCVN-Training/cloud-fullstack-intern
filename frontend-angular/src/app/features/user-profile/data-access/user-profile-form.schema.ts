import { z } from 'zod';

export const UserProfileFormSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or less'),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional().or(z.literal('')),
  avatarUrl: z.url('Invalid URL format').optional().or(z.literal('')),
  bannerUrl: z.url('Invalid URL format').optional().or(z.literal('')),
  accentColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format. Use hex format like #2563eb'),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format. Use hex format like #2563eb'),
  profileCardStyle: z.enum(['Minimal', 'Standard', 'Gradient', 'Modern']),
  isProfilePublic: z.boolean(),
});

export type UserProfileFormPayload = z.infer<typeof UserProfileFormSchema>;
