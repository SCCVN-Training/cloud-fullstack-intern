import { z } from 'zod';

// 1. Base User Schema (Omitting password for safety)
export const UserAccountSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

// 2. Payloads
export const RegisterPayloadSchema = z.object({
  displayName: z.string().min(3, 'Display name must be at least 3 charatcers'),
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
    user: UserAccountSchema,
  }),
});

export const LoginResponseSchema = z.object({
  message: z.string(),
  status: z.number(),
  data: z.object({
    user: UserAccountSchema,
  }),
});

// 4. Export Inferenced Types for Angular Services/Components
export type User = z.infer<typeof UserAccountSchema>;
export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;
export type LoginPayload = z.infer<typeof LoginPayloadSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
