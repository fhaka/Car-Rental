import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { paymentsApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function usePayments(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["payments", params], queryFn: () => paymentsApi.list(params) });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["booking"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["rental"] });
      qc.invalidateQueries({ queryKey: ["rentals"] });
      qc.invalidateQueries({ queryKey: ["customer"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Payment recorded");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
