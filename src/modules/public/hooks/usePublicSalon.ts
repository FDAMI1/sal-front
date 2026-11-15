import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { publicSalonApi } from "@modules/public/api/publicSalonApi";
import type { BookingInput } from "@modules/public/types";

export const usePublicSalon = (code: string) =>
  useQuery({
    queryKey: ["public-salon", code],
    queryFn: () => publicSalonApi.get(code),
    retry: false,
    staleTime: 60_000,
  });

export const useCreateBooking = (code: string) =>
  useMutation({
    mutationFn: (input: BookingInput) => publicSalonApi.book(code, input),
  });

const OPEN = new Set(["booked", "called", "in_service"]);

/** Refreshes every 15 s while the visit is still going on. */
export const useTrackedBooking = (trackingCode: string) =>
  useQuery({
    queryKey: ["booking", trackingCode],
    queryFn: () => publicSalonApi.track(trackingCode),
    retry: false,
    refetchInterval: (q) =>
      q.state.data && OPEN.has(q.state.data.status) ? 15_000 : false,
  });

export function useCancelBooking(trackingCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => publicSalonApi.cancel(trackingCode),
    onSuccess: (b) => qc.setQueryData(["booking", trackingCode], b),
  });
}
