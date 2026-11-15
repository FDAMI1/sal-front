import { staffApi } from "@api/clients";
import type { Envelope } from "@api/envelope";
import type {
  CreateStaffInput,
  MenuItem,
  ScheduleDay,
  StaffAccess,
  StaffLimits,
  StaffPolicyInput,
  TimeOff,
  TimeOffInput,
  UpdateStaffInput,
  WorkerDetail,
  WorkerListItem,
} from "@modules/staff/types";

export const staffManagementApi = {
  list: async () =>
    (await staffApi.get<Envelope<WorkerListItem[]>>("/staff")).data.data,

  get: async (id: string) =>
    (await staffApi.get<Envelope<WorkerDetail>>(`/staff/${id}`)).data.data,

  create: async (input: CreateStaffInput) =>
    (await staffApi.post<Envelope<WorkerDetail>>("/staff", input)).data.data,

  update: async (id: string, patch: UpdateStaffInput) =>
    (await staffApi.patch<Envelope<WorkerDetail>>(`/staff/${id}`, patch)).data
      .data,

  remove: (id: string) => staffApi.delete(`/staff/${id}`),

  setSkills: async (id: string, serviceIds: string[]) =>
    (
      await staffApi.put<Envelope<WorkerDetail>>(`/staff/${id}/skills`, {
        serviceIds,
      })
    ).data.data,

  setSchedule: async (id: string, weeklySchedule: ScheduleDay[]) =>
    (
      await staffApi.put<Envelope<WorkerDetail>>(`/staff/${id}/schedule`, {
        weeklySchedule,
      })
    ).data.data,

  timeOff: async (id: string) =>
    (await staffApi.get<Envelope<TimeOff[]>>(`/staff/${id}/time-off`)).data
      .data,

  addTimeOff: async (id: string, input: TimeOffInput) =>
    (await staffApi.post<Envelope<TimeOff>>(`/staff/${id}/time-off`, input))
      .data.data,

  removeTimeOff: (id: string, timeOffId: string) =>
    staffApi.delete(`/staff/${id}/time-off/${timeOffId}`),

  /** The salon's menu, for the skills picker. */
  services: async () =>
    (await staffApi.get<Envelope<MenuItem[]>>("/services")).data.data,

  access: async () =>
    (await staffApi.get<Envelope<StaffAccess>>("/staff/access")).data.data,

  updatePolicy: async (input: StaffPolicyInput) =>
    (await staffApi.patch<Envelope<StaffLimits>>("/staff/access/policy", input))
      .data.data,

  revokeDevice: (id: string, sessionId: string) =>
    staffApi.delete(`/staff/${id}/sessions/${sessionId}`),

  signOutEverywhere: async (id: string) =>
    (
      await staffApi.post<Envelope<{ endedSessions: number }>>(
        `/staff/${id}/sessions/sign-out-all`,
      )
    ).data.data,
};
