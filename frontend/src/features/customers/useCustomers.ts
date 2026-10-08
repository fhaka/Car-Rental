import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { customersApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useCustomers(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["customers", params], queryFn: () => customersApi.list(params) });
}

export function useCustomer(id?: string) {
  return useQuery({ queryKey: ["customer", id], queryFn: () => customersApi.get(id as string), enabled: !!id });
}

export function useCustomerBookings(id?: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["customer-bookings", id, params], queryFn: () => customersApi.bookings(id as string, params), enabled: !!id });
}
export function useCustomerRentals(id?: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["customer-rentals", id, params], queryFn: () => customersApi.rentals(id as string, params), enabled: !!id });
}
export function useCustomerPayments(id?: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["customer-payments", id, params], queryFn: () => customersApi.payments(id as string, params), enabled: !!id });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => customersApi.update(id, input),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", vars.id] });
      toast.success("Customer updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeactivateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deactivated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
