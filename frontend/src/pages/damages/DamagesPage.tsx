import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";
import { useCreateDamage, useDamages, useUpdateDamage } from "../../features/damages/useDamages";
import { useVehicles } from "../../features/vehicles/useVehicles";
import { formatCurrency, formatDate } from "../../lib/format";
import { DamageReport } from "../../types";

interface FormValues {
  vehicleId: string;
  description: string;
  location: string;
  estimatedRepairCost?: number;
  actualRepairCost?: number;
  customerResponsible: boolean;
  insuranceInvolved: boolean;
  status: string;
}

export default function DamagesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useDamages({ page, pageSize: 10, status: statusFilter || undefined });
  const { data: vehicles } = useVehicles({ pageSize: 100 });
  const createDamage = useCreateDamage();
  const updateDamage = useUpdateDamage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DamageReport | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  function openCreate() {
    setEditing(null);
    reset({ vehicleId: "", description: "", location: "", customerResponsible: false, insuranceInvolved: false, status: "REPORTED" });
    setModalOpen(true);
  }
  function openEdit(d: DamageReport) {
    setEditing(d);
    reset({
      vehicleId: d.vehicleId,
      description: d.description,
      location: d.location,
      estimatedRepairCost: d.estimatedRepairCost ? Number(d.estimatedRepairCost) : undefined,
      actualRepairCost: d.actualRepairCost ? Number(d.actualRepairCost) : undefined,
      customerResponsible: d.customerResponsible,
      insuranceInvolved: d.insuranceInvolved,
      status: d.status,
    });
    setModalOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      const { vehicleId, ...rest } = values;
      updateDamage.mutate({ id: editing.id, input: rest }, { onSuccess: () => setModalOpen(false) });
    } else {
      createDamage.mutate({ ...values }, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Damage Reports"
        description="Track vehicle damage, repair costs and responsibility"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Report Damage
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <select className="input !w-52" value={statusFilter} onChange={(e) => (setStatusFilter(e.target.value), setPage(1))}>
          <option value="">All statuses</option>
          <option value="REPORTED">Reported</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="REPAIR_SCHEDULED">Repair scheduled</option>
          <option value="REPAIRED">Repaired</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(d) => d.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={openEdit}
          emptyTitle="No damage reports"
          columns={[
            { header: "Vehicle", accessor: (d) => `${d.vehicle?.brand} ${d.vehicle?.model} (${d.vehicle?.plateNumber})` },
            { header: "Description", accessor: (d) => <span className="line-clamp-1 max-w-xs">{d.description}</span> },
            { header: "Reported", accessor: (d) => formatDate(d.dateReported) },
            { header: "Est. Cost", accessor: (d) => (d.estimatedRepairCost ? formatCurrency(d.estimatedRepairCost) : "—") },
            { header: "Responsible", accessor: (d) => (d.customerResponsible ? "Customer" : "Company") },
            { header: "Status", accessor: (d) => <StatusBadge status={d.status} /> },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Update Damage Report" : "Report Damage"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)}>
              Save
            </button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Vehicle" required>
            <select className="input" {...register("vehicleId", { required: true })} disabled={!!editing}>
              <option value="">Select vehicle</option>
              {vehicles?.data.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.plateNumber})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Damage location" required>
            <input className="input" placeholder="e.g. Front bumper" {...register("location", { required: true })} />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Description" required>
              <textarea className="input" rows={2} {...register("description", { required: true })} />
            </FormField>
          </div>
          <FormField label="Estimated repair cost">
            <input type="number" step="0.01" className="input" {...register("estimatedRepairCost")} />
          </FormField>
          {editing && (
            <FormField label="Actual repair cost">
              <input type="number" step="0.01" className="input" {...register("actualRepairCost")} />
            </FormField>
          )}
          <FormField label="Status">
            <select className="input" {...register("status")}>
              <option value="REPORTED">Reported</option>
              <option value="UNDER_REVIEW">Under review</option>
              <option value="REPAIR_SCHEDULED">Repair scheduled</option>
              <option value="REPAIRED">Repaired</option>
              <option value="CLOSED">Closed</option>
            </select>
          </FormField>
          <div className="flex items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...register("customerResponsible")} /> Customer responsible
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" {...register("insuranceInvolved")} /> Insurance involved
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
