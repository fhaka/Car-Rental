import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Archive } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Modal, ConfirmDialog } from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";
import { useArchiveCategory, useCategories, useCreateCategory, useUpdateCategory } from "../../features/categories/useCategories";
import { VehicleCategory } from "../../types";

interface FormValues {
  name: string;
  description: string;
}

export default function CategoriesPage() {
  const { data, isLoading } = useCategories({ pageSize: 50 });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const archiveCategory = useArchiveCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleCategory | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<VehicleCategory | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  function openCreate() {
    setEditing(null);
    reset({ name: "", description: "" });
    setModalOpen(true);
  }
  function openEdit(cat: VehicleCategory) {
    setEditing(cat);
    reset({ name: cat.name, description: cat.description ?? "" });
    setModalOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      updateCategory.mutate({ id: editing.id, input: values }, { onSuccess: () => setModalOpen(false) });
    } else {
      createCategory.mutate(values, { onSuccess: () => setModalOpen(false) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Vehicle Categories"
        description="Organize your fleet into rental classes"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Category
          </button>
        }
      />

      <div className="card !p-0">
        <DataTable
          rowKey={(c) => c.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          emptyTitle="No categories yet"
          emptyDescription="Create your first vehicle category, e.g. Economy or SUV."
          columns={[
            { header: "Name", accessor: (c) => <span className="font-medium text-slate-800">{c.name}</span> },
            { header: "Description", accessor: (c) => c.description || "—" },
            { header: "Vehicles", accessor: (c) => c.vehicleCount ?? 0 },
            { header: "Status", accessor: (c) => (c.isActive ? <span className="badge bg-emerald-50 text-emerald-700">Active</span> : <span className="badge bg-slate-100 text-slate-500">Archived</span>) },
            {
              header: "",
              accessor: (c) => (
                <div className="flex justify-end gap-2">
                  <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  {c.isActive && (
                    <button className="btn-ghost !py-1.5 !px-3 text-xs text-red-500" onClick={() => setArchiveTarget(c)}>
                      <Archive size={14} />
                    </button>
                  )}
                </div>
              ),
              className: "text-right",
            },
          ]}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Category" : "Add Category"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={createCategory.isPending || updateCategory.isPending}>
              Save
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField label="Name" required error={errors.name?.message}>
            <input className="input" {...register("name", { required: "Name is required" })} />
          </FormField>
          <FormField label="Description">
            <textarea className="input" rows={3} {...register("description")} />
          </FormField>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && archiveCategory.mutate(archiveTarget.id, { onSuccess: () => setArchiveTarget(null) })}
        title="Archive category"
        message={`Archive "${archiveTarget?.name}"? Vehicles already in this category are not affected.`}
        confirmLabel="Archive"
        loading={archiveCategory.isPending}
      />
    </div>
  );
}
