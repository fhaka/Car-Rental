import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Car as CarIcon, Edit, Archive, Trash2, Upload, X, Star, Loader2 } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import {
  useArchiveVehicle,
  useChangeVehicleStatus,
  useDeleteVehicle,
  useUploadVehicleImages,
  useRemoveVehicleImage,
  useSetPrimaryVehicleImage,
  useVehicle,
} from "../../features/vehicles/useVehicles";
import { formatCurrency, formatDate } from "../../lib/format";

export default function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id);
  const changeStatus = useChangeVehicleStatus();
  const archiveVehicle = useArchiveVehicle();
  const deleteVehicle = useDeleteVehicle();
  const uploadImages = useUploadVehicleImages();
  const removeImage = useRemoveVehicleImage();
  const setPrimaryImage = useSetPrimaryVehicleImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading || !vehicle) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${vehicle.brand} ${vehicle.model}`}
        description={`${vehicle.year} · ${vehicle.plateNumber} · VIN ${vehicle.vin}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={vehicle.status} />
            <button className="btn-secondary" onClick={() => navigate(`/vehicles/${id}/edit`)}>
              <Edit size={16} /> Edit
            </button>
            {vehicle.isActive && (
              <button className="btn-secondary" onClick={() => archiveVehicle.mutate(vehicle.id)}>
                <Archive size={16} /> Archive
              </button>
            )}
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={16} /> Delete
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Photos</h3>
              <button
                className="btn-secondary !py-1.5 !px-3 text-xs"
                disabled={uploadImages.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadImages.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploadImages.isPending ? "Uploading…" : "Upload"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length && id) {
                    uploadImages.mutate({ id, files: Array.from(e.target.files) });
                  }
                  e.target.value = "";
                }}
              />
            </div>
            <p className="mb-4 text-xs text-slate-400">
              The <span className="font-medium text-slate-500">primary</span> photo is the one shown on the public website. JPEG,
              PNG, WEBP or GIF · up to 8&nbsp;MB each.
            </p>
            {vehicle.images.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-colors hover:border-brand-300 hover:text-brand-500"
              >
                <CarIcon size={40} strokeWidth={1.2} />
                <span className="text-xs font-medium">Upload the first photo</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {vehicle.images.map((img) => {
                  const busy = setPrimaryImage.isPending || removeImage.isPending;
                  return (
                    <div
                      key={img.id}
                      className={`group relative aspect-video overflow-hidden rounded-lg bg-slate-100 ring-2 ${
                        img.isPrimary ? "ring-brand-500" : "ring-transparent"
                      }`}
                    >
                      <img src={img.url} className="h-full w-full object-cover" alt="" />

                      {img.isPrimary && (
                        <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                          <Star size={10} fill="currentColor" /> Primary
                        </span>
                      )}

                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {!img.isPrimary && (
                          <button
                            title="Set as primary"
                            disabled={busy}
                            onClick={() => id && setPrimaryImage.mutate({ id, imageId: img.id })}
                            className="rounded-md bg-white/90 p-1.5 text-slate-700 hover:bg-white disabled:opacity-50"
                          >
                            <Star size={13} />
                          </button>
                        )}
                        <button
                          title="Remove photo"
                          disabled={busy}
                          onClick={() => id && removeImage.mutate({ id, imageId: img.id })}
                          className="rounded-md bg-white/90 p-1.5 text-red-600 hover:bg-white disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Specifications</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Spec label="Category" value={vehicle.category?.name ?? "—"} />
              <Spec label="Transmission" value={vehicle.transmission} />
              <Spec label="Fuel Type" value={vehicle.fuelType} />
              <Spec label="Seats" value={String(vehicle.seats)} />
              <Spec label="Doors" value={String(vehicle.doors)} />
              <Spec label="Color" value={vehicle.color} />
              <Spec label="Mileage" value={`${vehicle.mileage.toLocaleString()} km`} />
              <Spec label="Location" value={vehicle.currentLocation ?? "—"} />
            </dl>
          </div>

          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Documentation</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <Spec label="Insurance expiry" value={formatDate(vehicle.insuranceExpiry)} />
              <Spec label="Registration expiry" value={formatDate(vehicle.registrationExpiry)} />
              <Spec label="Last service" value={formatDate(vehicle.lastServiceDate)} />
              <Spec label="Next service" value={formatDate(vehicle.nextServiceDate)} />
            </dl>
            {vehicle.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{vehicle.notes}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Pricing</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Daily rate</span>
                <span className="font-medium text-slate-800">{formatCurrency(vehicle.dailyRate)}</span>
              </div>
              {vehicle.weeklyRate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Weekly rate</span>
                  <span className="font-medium text-slate-800">{formatCurrency(vehicle.weeklyRate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Security deposit</span>
                <span className="font-medium text-slate-800">{formatCurrency(vehicle.securityDeposit)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Change Status</h3>
            <div className="flex flex-col gap-2">
              {["AVAILABLE", "MAINTENANCE", "INACTIVE"].map((s) => (
                <button
                  key={s}
                  disabled={vehicle.status === s || vehicle.status === "RENTED"}
                  onClick={() => id && changeStatus.mutate({ id, status: s })}
                  className="btn-secondary justify-start disabled:opacity-40"
                >
                  Mark as {s.toLowerCase()}
                </button>
              ))}
              {vehicle.status === "RENTED" && (
                <p className="text-xs text-slate-400">Status changes automatically when the active rental is checked in.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => id && deleteVehicle.mutate(id, { onSuccess: () => navigate("/vehicles") })}
        title="Delete vehicle"
        message="This permanently deletes the vehicle. Only vehicles with no booking, rental, expense or maintenance history can be deleted — otherwise, archive it instead."
        confirmLabel="Delete"
        loading={deleteVehicle.isPending}
      />
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
