import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salonKey } from "@modules/salon/hooks/useSalon";
import { bookingLinkApi, type BookingLinkPatch } from "@modules/qr/api/qrApi";

/** Switches the booking link on/off or issues a new code; updates the salon in place. */
export function useUpdateBookingLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: BookingLinkPatch) => bookingLinkApi.update(patch),
    onSuccess: (salon) => qc.setQueryData(salonKey, salon),
  });
}
