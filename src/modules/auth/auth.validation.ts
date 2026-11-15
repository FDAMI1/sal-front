import { z } from "zod";

/**
 * Same rules as the server (backend validationPrimitives.ts), checked here
 * first so mistakes show next to the field without a round trip.
 */
const MOBILE = /^(?:\+91|0091|91|0)?[6-9]\d{9}$/;
export const isMobile = (v: string) => MOBILE.test(v.replace(/[\s()-]/g, ""));

export const passwordRule = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), "Use letters and numbers");

export const loginFormSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or mobile number")
    .refine(
      (v) => (v.includes("@") ? z.email().safeParse(v).success : isMobile(v)),
      "Enter a valid email or 10-digit mobile number",
    ),
  password: z.string().min(1, "Enter your password"),
});
export type LoginForm = z.infer<typeof loginFormSchema>;

export const emailFormSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email")),
});
export type EmailForm = z.infer<typeof emailFormSchema>;

export const resetFormSchema = z
  .object({
    email: z.string().trim().pipe(z.email("Enter a valid email")),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, "Enter the 6-digit code"),
    password: passwordRule,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type ResetForm = z.infer<typeof resetFormSchema>;

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  phone: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || isMobile(v),
      "Enter a valid 10-digit mobile number",
    ),
});
export type ProfileForm = z.infer<typeof profileFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordRule,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Choose a password different from the current one",
    path: ["newPassword"],
  });
export type ChangePasswordForm = z.infer<typeof changePasswordFormSchema>;
