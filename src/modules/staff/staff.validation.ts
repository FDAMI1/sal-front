import { z } from "zod";
import { isMobile, passwordRule } from "@modules/auth/auth.validation";

const optionalMobile = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || isMobile(v),
    "Enter a valid 10-digit mobile number",
  );
const name = z.string().trim().min(1, "Enter a name").max(80);

export const newPasswordSchema = z
  .object({ password: passwordRule, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type NewPasswordForm = z.infer<typeof newPasswordSchema>;

export const createStaffFormSchema = z
  .object({
    name,
    displayName: z.string().trim().max(40, "Use at most 40 characters"),
    email: z.string().trim().pipe(z.email("Enter a valid email")),
    phone: optionalMobile,
  })
  .and(newPasswordSchema);
export type CreateStaffForm = z.infer<typeof createStaffFormSchema>;

export const staffProfileFormSchema = z.object({
  name,
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name")
    .max(40, "Use at most 40 characters"),
  phone: optionalMobile,
});
export type StaffProfileForm = z.infer<typeof staffProfileFormSchema>;

export const timeOffFormSchema = z
  .object({
    from: z.string().min(1, "Pick the first day"),
    to: z.string().min(1, "Pick the last day"),
    reason: z.string().trim().max(120, "Use at most 120 characters"),
  })
  .refine((v) => v.from === "" || v.to === "" || v.from <= v.to, {
    message: "The last day must be on or after the first",
    path: ["to"],
  });
export type TimeOffForm = z.infer<typeof timeOffFormSchema>;

const cap = (max: number) =>
  z
    .string()
    .trim()
    .refine(
      (v) => /^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= max,
      `Enter a whole number from 1 to ${max}`,
    );

/** A box is only checked when "use the subscription maximum" is off. */
export const policyFormSchema = z
  .object({
    maxStaffAuto: z.boolean(),
    maxStaff: z.string(),
    devicesAuto: z.boolean(),
    devicesPerStaff: z.string(),
  })
  .superRefine((v, ctx) => {
    const checks = [
      {
        auto: v.maxStaffAuto,
        path: "maxStaff",
        value: v.maxStaff,
        max: 10_000,
      },
      {
        auto: v.devicesAuto,
        path: "devicesPerStaff",
        value: v.devicesPerStaff,
        max: 50,
      },
    ];
    for (const c of checks) {
      if (c.auto) continue;
      const result = cap(c.max).safeParse(c.value);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          path: [c.path],
          message: result.error.issues[0]?.message ?? "Invalid number",
        });
      }
    }
  });
export type PolicyForm = z.infer<typeof policyFormSchema>;
