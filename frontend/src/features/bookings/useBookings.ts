import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { bookingsApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useBookings(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["bookings", params], queryFn: () => bookingsApi.list(params) });
}

export function useBooking(id?: string) {
  return useQuery({ queryKey: ["booking", id], queryFn: () => bookingsApi.get(id as string), enabled: !!id });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Booking created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not create booking")),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => bookingsApi.update(id, input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking", vars.id] });
      toast.success("Booking updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useChangeBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) => bookingsApi.changeStatus(id, status, reason),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking", vars.id] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Booking status updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
