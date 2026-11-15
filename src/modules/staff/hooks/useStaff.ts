import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffManagementApi as api } from "@modules/staff/api/staffManagementApi";
import type {
  ScheduleDay,
  StaffPolicyInput,
  TimeOffInput,
  UpdateStaffInput,
  WorkerListItem,
} from "@modules/staff/types";

/** Every staff query lives under this key; every staff mutation invalidates it. */
export const staffKey = ["staff"] as const;
const listKey = [...staffKey, "list"] as const;
const accessKey = [...staffKey, "access"] as const;
/** Same key the service menu uses for GET /services. */
const servicesKey = ["services"] as const;

export const useStaffList = () =>
  useQuery({ queryKey: listKey, queryFn: api.list });

export const useStaffMember = (id: string) =>
  useQuery({ queryKey: [...staffKey, id], queryFn: () => api.get(id) });

export const useTimeOff = (id: string) =>
  useQuery({
    queryKey: [...staffKey, id, "time-off"],
    queryFn: () => api.timeOff(id),
  });

export const useMenuServices = () =>
  useQuery({ queryKey: servicesKey, queryFn: api.services });

export const useStaffAccess = () =>
  useQuery({ queryKey: accessKey, queryFn: api.access });

/** A mutation that refreshes lists, details and the access overview after. */
function useStaffMutation<V, R>(mutationFn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: staffKey }),
  });
}

export const useCreateStaff = () => useStaffMutation(api.create);

export const useUpdateStaff = () =>
  useStaffMutation((v: { id: string; patch: UpdateStaffInput }) =>
    api.update(v.id, v.patch),
  );

export const useSetSkills = () =>
  useStaffMutation((v: { id: string; serviceIds: string[] }) =>
    api.setSkills(v.id, v.serviceIds),
  );

export const useSetSchedule = () =>
  useStaffMutation((v: { id: string; weeklySchedule: ScheduleDay[] }) =>
    api.setSchedule(v.id, v.weeklySchedule),
  );

export const useAddTimeOff = () =>
  useStaffMutation((v: { id: string; input: TimeOffInput }) =>
    api.addTimeOff(v.id, v.input),
  );

export const useRemoveTimeOff = () =>
  useStaffMutation((v: { id: string; timeOffId: string }) =>
    api.removeTimeOff(v.id, v.timeOffId),
  );

export const useUpdatePolicy = () =>
  useStaffMutation((input: StaffPolicyInput) => api.updatePolicy(input));

export const useRevokeDevice = () =>
  useStaffMutation((v: { id: string; sessionId: string }) =>
    api.revokeDevice(v.id, v.sessionId),
  );

export const useSignOutEverywhere = () =>
  useStaffMutation((id: string) => api.signOutEverywhere(id));

/**
 * Removal marks staff data stale without refetching: the detail screen is
 * still mounted and would refetch a 404 before it navigates away.
 */
export function useRemoveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: (_res, id) => {
      qc.setQueryData<WorkerListItem[]>(listKey, (list) =>
        list?.filter((w) => w.id !== id),
      );
      return qc.invalidateQueries({ queryKey: staffKey, refetchType: "none" });
    },
  });
}
