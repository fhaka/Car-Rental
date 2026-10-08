import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { vehiclesApi } from "./api";
import { getApiErrorMessage } from "../../lib/api";

export function useVehicles(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["vehicles", params], queryFn: () => vehiclesApi.list(params) });
}

export function useVehicle(id?: string) {
  return useQuery({ queryKey: ["vehicle", id], queryFn: () => vehiclesApi.get(id as string), enabled: !!id });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => vehiclesApi.update(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicle", vars.id] });
      toast.success("Vehicle updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useChangeVehicleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) => vehiclesApi.changeStatus(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["vehicle"] });
      toast.success("Vehicle status updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useArchiveVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.archive,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle archived");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Vehicle deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Cannot delete this vehicle")),
  });
}

export function useUploadVehicleImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => vehiclesApi.uploadImages(id, files),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["vehicle", vars.id] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Images uploaded");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useRemoveVehicleImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) => vehiclesApi.removeImage(id, imageId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["vehicle", vars.id] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Image removed");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useSetPrimaryVehicleImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) => vehiclesApi.setPrimaryImage(id, imageId),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["vehicle", vars.id] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Primary photo updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
