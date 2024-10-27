import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().min(4).max(20),
  email: z.string().email(),
  password: z.string().min(6).max(12),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  username: z.string().min(4).max(20),
  password: z.string().min(6).max(12),
});

export type SigninInput = z.infer<typeof signinSchema>;

export const createBlogSchema = z.object({
  title: z.string().min(4).max(50),
  content: z.string().min(10),
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
