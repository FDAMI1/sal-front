import { z } from "zod";
import type { ServiceGender } from "@modules/salon/types";
import { rupeesToPaise } from "@shared/format";

/** Form rules shared by the master catalogue and a branch's menu. */
export const GENDER_OPTIONS: { value: ServiceGender; label: string }[] = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];

export const GENDER_LABEL: Record<ServiceGender, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

export const serviceFieldsSchema = z.object({
  name: z.string().trim().min(2, "Enter the service name").max(80),
  category: z.string().trim().min(2, "Enter a category").max(40),
  gender: z.enum(["men", "women", "unisex"]),
  description: z.string().trim().max(300),
  duration: z
    .string()
    .trim()
    .regex(/^\d+$/, "Whole minutes")
    .refine((v) => Number(v) >= 5 && Number(v) <= 600, "5 to 600 minutes"),
  price: z
    .string()
    .refine(
      (v) => rupeesToPaise(v) !== null,
      "Enter an amount like 499 or 499.50",
    ),
});
export type ServiceFields = z.infer<typeof serviceFieldsSchema>;

export const minutesLabel = (m: number) =>
  m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;
