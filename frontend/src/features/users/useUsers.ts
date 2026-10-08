import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usersApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useUsersList(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["users", params], queryFn: () => usersApi.list(params) });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => usersApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => usersApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
