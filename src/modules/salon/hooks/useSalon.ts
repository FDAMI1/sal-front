import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salonApi, type SalonPatch } from "@modules/salon/api/salonApi";

export const salonKey = ["salon"] as const;
const holidaysKey = ["salon", "holidays"] as const;

export const useRegisterSalon = () =>
  useMutation({ mutationFn: salonApi.register });

export const useSalon = () =>
  useQuery({ queryKey: salonKey, queryFn: salonApi.get });

export function useUpdateSalon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SalonPatch) => salonApi.update(patch),
    onSuccess: (salon) => qc.setQueryData(salonKey, salon),
  });
}

export const useHolidays = () =>
  useQuery({ queryKey: holidaysKey, queryFn: salonApi.holidays });

export function useAddHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salonApi.addHoliday,
    onSuccess: () => qc.invalidateQueries({ queryKey: holidaysKey }),
  });
}

export function useRemoveHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salonApi.removeHoliday,
    onSuccess: () => qc.invalidateQueries({ queryKey: holidaysKey }),
  });
}
