import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { rentalsApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useRentals(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["rentals", params], queryFn: () => rentalsApi.list(params) });
}

export function useRental(id?: string) {
  return useQuery({ queryKey: ["rental", id], queryFn: () => rentalsApi.get(id as string), enabled: !!id });
}

function invalidateAfterRentalChange(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["rentals"] });
  qc.invalidateQueries({ queryKey: ["rental"] });
  qc.invalidateQueries({ queryKey: ["vehicles"] });
  qc.invalidateQueries({ queryKey: ["vehicle"] });
  qc.invalidateQueries({ queryKey: ["bookings"] });
  qc.invalidateQueries({ queryKey: ["booking"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useCheckoutRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rentalsApi.checkout,
    onSuccess: () => {
      invalidateAfterRentalChange(qc);
      toast.success("Vehicle checked out successfully");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not check out this vehicle")),
  });
}

export function useExtendRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newExpectedReturnAt }: { id: string; newExpectedReturnAt: string }) => rentalsApi.extend(id, newExpectedReturnAt),
    onSuccess: () => {
      invalidateAfterRentalChange(qc);
      toast.success("Rental extended");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useCheckinRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => rentalsApi.checkin(id, input),
    onSuccess: () => {
      invalidateAfterRentalChange(qc);
      toast.success("Vehicle checked in successfully");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useCancelRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rentalsApi.cancel(id, reason),
    onSuccess: () => {
      invalidateAfterRentalChange(qc);
      toast.success("Rental cancelled");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
