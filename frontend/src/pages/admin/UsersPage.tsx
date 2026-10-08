import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/DataTable";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { FormField } from "../../components/ui/FormField";
import { useCreateUser, useUpdateUser, useUsersList } from "../../features/users/useUsers";
import { useAuthStore } from "../../store/authStore";
import { formatDate } from "../../lib/format";
import { UserAccount } from "../../types";

interface FormValues {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isActive: boolean;
}

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700",
  MANAGER: "bg-blue-50 text-blue-700",
  EMPLOYEE: "bg-slate-100 text-slate-600",
};

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const { data, isLoading } = useUsersList({ page, pageSize: 10, role: role || undefined });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const { register, handleSubmit, reset } = useForm<FormValues>();

  function openCreate() {
    setEditing(null);
    reset({ email: "", password: "", firstName: "", lastName: "", phone: "", role: "EMPLOYEE", isActive: true });
    setModalOpen(true);
  }
  function openEdit(user: UserAccount) {
    setEditing(user);
    reset({ email: user.email, password: "", firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "", role: user.role, isActive: user.isActive });
    setModalOpen(true);
  }

  function onSubmit(values: FormValues) {
    if (editing) {
      updateUser.mutate(
        {
          id: editing.id,
          input: {
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            role: values.role,
            isActive: String(values.isActive) === "true",
          },
        },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createUser.mutate(
        { email: values.email, password: values.password, firstName: values.firstName, lastName: values.lastName, phone: values.phone, role: values.role },
        { onSuccess: () => setModalOpen(false) }
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage staff accounts and role-based access"
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add User
          </button>
        }
      />

      <div className="card mb-4 !p-4">
        <select className="input !w-48" value={role} onChange={(e) => (setRole(e.target.value), setPage(1))}>
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>

      <div className="card !p-0">
        <DataTable
          rowKey={(u) => u.id}
          isLoading={isLoading}
          data={data?.data ?? []}
          onRowClick={openEdit}
          emptyTitle="No users found"
          columns={[
            { header: "Name", accessor: (u) => `${u.firstName} ${u.lastName}${u.id === currentUser?.id ? " (you)" : ""}` },
            { header: "Email", accessor: (u) => u.email },
            { header: "Phone", accessor: (u) => u.phone ?? "—" },
            { header: "Role", accessor: (u) => <span className={`badge ${ROLE_STYLES[u.role]}`}>{u.role}</span> },
            { header: "Status", accessor: (u) => <span className={`badge ${u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.isActive ? "Active" : "Inactive"}</span> },
            { header: "Last login", accessor: (u) => formatDate(u.lastLoginAt) },
            { header: "Joined", accessor: (u) => formatDate(u.createdAt) },
          ]}
        />
        {data && <Pagination meta={data.meta} onPageChange={setPage} />}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit User" : "Add User"}
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
          <FormField label="First name" required>
            <input className="input" {...register("firstName", { required: true })} />
          </FormField>
          <FormField label="Last name" required>
            <input className="input" {...register("lastName", { required: true })} />
          </FormField>
          <FormField label="Email" required>
            <input type="email" className="input" {...register("email", { required: true })} disabled={!!editing} />
          </FormField>
          <FormField label="Phone">
            <input className="input" {...register("phone")} />
          </FormField>
          {!editing && (
            <FormField label="Temporary password" required hint="At least 8 characters">
              <input type="password" className="input" {...register("password", { required: true, minLength: 8 })} />
            </FormField>
          )}
          <FormField label="Role" required>
            <select className="input" {...register("role", { required: true })} disabled={editing?.id === currentUser?.id}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </FormField>
          {editing && (
            <FormField label="Status">
              <select className="input" {...register("isActive")} disabled={editing.id === currentUser?.id}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </FormField>
          )}
        </form>
      </Modal>
    </div>
  );
}
