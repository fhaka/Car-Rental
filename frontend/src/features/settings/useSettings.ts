import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { settingsApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";
import { CompanySettings } from "../../types";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: settingsApi.get, staleTime: 5 * 60_000 });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CompanySettings>) => settingsApi.update(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
