import { z } from 'zod';

// 1. Base User Schema (Omitting password for safety)
export const UserSchema = z.object({
  id: z.uuid(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.email(),
  isActive: z.boolean(),
  avatarUrl: z.url().nullable(),
  createdAt: z.string(),
});

// 2. Payloads
export const RegisterPayloadSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginPayloadSchema = RegisterPayloadSchema.pick({
  email: true,
  password: true,
});

// 3. Responses
export const RegisterResponseSchema = z.object({
  message: z.string(),
  status: z.number(),
  data: z.object({
    user: UserSchema,
  }),
});

export const LoginResponseSchema = z.object({
  message: z.string(),
  status: z.number(),
  data: z.object({
    user: UserSchema,
  }),
});

// 4. Export Inferenced Types for Angular Services/Components
export type User = z.infer<typeof UserSchema>;
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
