import { apiClient } from "@api/apiClient";
import type { Envelope } from "@api/envelope";
import type {
  BookingInput,
  PublicSalon,
  TrackedBooking,
} from "@modules/public/types";

/** No sign-in anywhere here: the QR link and the tracking link are the keys. */
export const publicSalonApi = {
  get: async (code: string) =>
    (
      await apiClient.get<Envelope<PublicSalon>>(
        `/public/salons/${encodeURIComponent(code)}`,
      )
    ).data.data,

  book: async (code: string, input: BookingInput) =>
    (
      await apiClient.post<Envelope<TrackedBooking>>(
        `/public/salons/${encodeURIComponent(code)}/bookings`,
        input,
      )
    ).data.data,

  cancel: async (trackingCode: string) =>
    (
      await apiClient.post<Envelope<TrackedBooking>>(
        `/public/bookings/${encodeURIComponent(trackingCode)}/cancel`,
      )
    ).data.data,

  track: async (trackingCode: string) =>
    (
      await apiClient.get<Envelope<TrackedBooking>>(
        `/public/bookings/${encodeURIComponent(trackingCode)}`,
      )
    ).data.data,
};
