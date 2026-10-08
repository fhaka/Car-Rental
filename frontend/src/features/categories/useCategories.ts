import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { categoriesApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useCategories(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["categories", params], queryFn: () => categoriesApi.list(params) });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<{ name: string; description: string; isActive: boolean }> }) =>
      categoriesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.archive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category archived");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
