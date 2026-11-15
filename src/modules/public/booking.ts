import type { CustomerGender, PublicSalon } from "@modules/public/types";

/** Shared by the booking form and the tracking page. */
type Service = PublicSalon["services"][number];

export const GENDERS: { value: CustomerGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const servesGender = (s: Service, g: CustomerGender) =>
  s.gender === "unisex" || s.gender === (g === "male" ? "men" : "women");

export const minutesLabel = (m: number) =>
  m < 60
    ? `${m} min`
    : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
