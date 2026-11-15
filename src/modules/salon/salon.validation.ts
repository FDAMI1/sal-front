import { z } from "zod";
import { isMobile, passwordRule } from "@modules/auth/auth.validation";

const email = z.string().trim().pipe(z.email("Enter a valid email"));
const mobile = z
  .string()
  .trim()
  .refine(isMobile, "Enter a valid 10-digit mobile number");
const optionalMobile = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || isMobile(v),
    "Enter a valid 10-digit mobile number",
  );
const optionalPincode = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^[1-9]\d{5}$/.test(v),
    "Enter a 6-digit PIN code",
  );

export const registerFormSchema = z
  .object({
    salonName: z.string().trim().min(2, "Enter the salon's name").max(80),
    city: z.string().trim().min(2, "Enter the city").max(60),
    ownerName: z.string().trim().min(1, "Enter your name").max(80),
    email,
    phone: mobile,
    password: passwordRule,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
export type RegisterForm = z.infer<typeof registerFormSchema>;

export const salonProfileFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the salon's name").max(80),
  phone: optionalMobile,
  email: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || z.email().safeParse(v).success,
      "Enter a valid email",
    ),
  addressLine: z.string().trim().max(160),
  city: z.string().trim().max(60),
  state: z.string().trim().max(60),
  pincode: optionalPincode,
  timezone: z.string().min(1),
});
export type SalonProfileForm = z.infer<typeof salonProfileFormSchema>;

/** Number fields stay text in the form and are checked as whole numbers. */
const minutes = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Whole minutes only")
    .refine(
      (v) => Number(v) >= min && Number(v) <= max,
      `Between ${min} and ${max}`,
    );

export const queueSettingsFormSchema = z
  .object({
    graceMinutes: minutes(1, 60),
    autoCall: z.boolean(),
    noShowAction: z.enum(["no_show", "requeue"]),
    getReadyMinutes: minutes(1, 240),
    comeNowMinutes: minutes(0, 60),
    stopJoiningMinutesBeforeClose: minutes(0, 240),
  })
  .refine((v) => Number(v.comeNowMinutes) < Number(v.getReadyMinutes), {
    message: '"Come now" must be sooner than "get ready"',
    path: ["comeNowMinutes"],
  });
export type QueueSettingsForm = z.infer<typeof queueSettingsFormSchema>;

export const holidayFormSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  reason: z.string().trim().max(120),
});
export type HolidayForm = z.infer<typeof holidayFormSchema>;
