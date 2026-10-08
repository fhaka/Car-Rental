import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { damagesApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useDamages(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["damages", params], queryFn: () => damagesApi.list(params) });
}

export function useCreateDamage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: damagesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["damages"] });
      toast.success("Damage report created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateDamage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => damagesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["damages"] });
      toast.success("Damage report updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
