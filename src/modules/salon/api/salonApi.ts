import { apiClient } from "@api/apiClient";
import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import type {
  DayHours,
  Holiday,
  QueueSettings,
  RegisterSalonInput,
  Salon,
  SalonContact,
} from "@modules/salon/types";

export interface SalonPatch {
  name?: string;
  contact?: Partial<SalonContact>;
  timezone?: string;
  businessHours?: DayHours[];
  queueSettings?: Partial<QueueSettings>;
}

export const salonApi = {
  /** Public: no session yet, so the plain client. */
  register: async (input: RegisterSalonInput) =>
    (
      await apiClient.post<Envelope<{ salonId: string }>>(
        "/auth/register-salon",
        input,
      )
    ).data.message,

  get: async () => (await staffApi.get<Envelope<Salon>>("/salon")).data.data,

  update: async (patch: SalonPatch) =>
    (await staffApi.patch<Envelope<Salon>>("/salon", patch)).data.data,

  holidays: async () =>
    (await staffApi.get<Envelope<Holiday[]>>("/salon/holidays")).data.data,

  addHoliday: async (input: { date: string; reason: string }) =>
    (await staffApi.post<Envelope<Holiday>>("/salon/holidays", input)).data
      .data,

  removeHoliday: (holidayId: string) =>
    staffApi.delete(`/salon/holidays/${holidayId}`),
};
