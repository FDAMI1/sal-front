import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import type { Salon } from "@modules/salon/types";

export interface BookingLinkPatch {
  isActive?: boolean;
  regenerate?: true;
}

export const bookingLinkApi = {
  update: async (patch: BookingLinkPatch) =>
    (await staffApi.patch<Envelope<Salon>>("/salon/booking-link", patch)).data
      .data,
};
