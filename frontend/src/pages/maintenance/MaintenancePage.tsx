import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Modal } from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";
import { useCreateMaintenance, useMaintenanceRecords, useUpdateMaintenance } from "../../features/maintenance/useMaintenance";
import { useVehicles } from "../../features/vehicles/useVehicles";
import { formatCurrency, formatDate } from "../../lib/format";
import { MaintenanceRecord } from "../../types";

interface FormValues {
  vehicleId: string;
  serviceType: string;
  serviceDate: string;
  mileage: number;
  cost: number;
  provider: string;
  description: string;
  nextServiceDate: string;
  status: string;
}

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useMaintenanceRecords({ page, pageSize: 10, status: statusFilter || undefined });
  const { data: vehicles } = useVehicles({ pageSize: 100 });
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  function openCreate() {
    setEditing(null);
    reset({ vehicleId: "", serviceType: "", serviceDate: "", mileage: 0, cost: 0, provider: "", description: "", nextServiceDate: "", status: "SCHEDULED" });
    setModalOpen(true);
  }
  function openEdit(record: MaintenanceRecord) {
    setEditing(record);
    reset({
      vehicleId: record.vehicleId,
      serviceType: record.serviceType,
      serviceDate: record.serviceDate.slice(0, 10),
      mileage: record.mileage,
      cost: Number(record.cost),
      provider: record.provider ?? "",
      description: record.description ?? "",
      nextServiceDate: record.nextServiceDate?.slice(0, 10) ?? "",
      status: record.status,
    });
    setModalOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      updateMaintenance.mutate({ id: editing.id, input: { ...values } }, { onSuccess: () => setModalOpen(false) });
    } else {
      createMaintenance.mutate({ ...values }, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Track service history and schedule upcoming work"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Record
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <select className="input !w-52" value={statusFilter} onChange={(e) => (setStatusFilter(e.target.value), setPage(1))}>
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(r) => r.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={openEdit}
          emptyTitle="No maintenance records"
          columns={[
            { header: "Vehicle", accessor: (r) => `${r.vehicle?.brand} ${r.vehicle?.model} (${r.vehicle?.plateNumber})` },
            { header: "Service", accessor: (r) => r.serviceType },
            { header: "Date", accessor: (r) => formatDate(r.serviceDate) },
            { header: "Cost", accessor: (r) => formatCurrency(r.cost) },
            { header: "Next Service", accessor: (r) => formatDate(r.nextServiceDate) },
            { header: "Status", accessor: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Maintenance Record" : "Add Maintenance Record"}
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
          <FormField label="Service type" required>
            <input className="input" {...register("serviceType", { required: true })} />
          </FormField>
          <FormField label="Service date" required>
            <input type="date" className="input" {...register("serviceDate", { required: true })} />
          </FormField>
          <FormField label="Mileage at service">
            <input type="number" className="input" {...register("mileage")} />
          </FormField>
          <FormField label="Cost">
            <input type="number" step="0.01" className="input" {...register("cost")} />
          </FormField>
          <FormField label="Provider / workshop">
            <input className="input" {...register("provider")} />
          </FormField>
          <FormField label="Next service date">
            <input type="date" className="input" {...register("nextServiceDate")} />
          </FormField>
          <FormField label="Status">
            <select className="input" {...register("status")}>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Description">
              <textarea className="input" rows={3} {...register("description")} />
            </FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
