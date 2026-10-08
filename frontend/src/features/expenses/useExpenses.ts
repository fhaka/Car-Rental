import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { expensesApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useExpenses(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["expenses", params], queryFn: () => expensesApi.list(params) });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["expenses"] });
  qc.invalidateQueries({ queryKey: ["transactions"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["reports"] });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => expensesApi.create(input),
    onSuccess: () => {
      invalidate(qc);
      toast.success("Expense recorded");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => expensesApi.update(id, input),
    onSuccess: () => {
      invalidate(qc);
      toast.success("Expense updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useArchiveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.archive(id),
    onSuccess: () => {
      invalidate(qc);
      toast.success("Expense archived");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
