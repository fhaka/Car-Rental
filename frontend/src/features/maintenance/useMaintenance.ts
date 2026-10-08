import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { maintenanceApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useMaintenanceRecords(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["maintenance", params], queryFn: () => maintenanceApi.list(params) });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Maintenance record created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => maintenanceApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Maintenance record updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
