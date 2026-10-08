import { useForm } from "react-hook-form";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormField } from "../../components/ui/FormField";
import { useAuthStore } from "../../store/authStore";
import { useChangePassword, useUpdateProfile } from "../../features/auth/useAuth";

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone: string;
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileFormValues>({
    defaultValues: { firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "" },
  });
  const passwordForm = useForm<PasswordFormValues>();

  function onProfileSubmit(values: ProfileFormValues) {
    updateProfile.mutate(values);
  }

  function onPasswordSubmit(values: PasswordFormValues) {
    if (values.newPassword !== values.confirmPassword) {
      passwordForm.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      { onSuccess: () => passwordForm.reset() }
    );
  }

  if (!user) return null;

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your account details and password" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="card space-y-4">
          <div className="flex items-center gap-4 pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-lg font-semibold text-white">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <span className="badge mt-1 bg-brand-50 text-brand-600">{user.role}</span>
            </div>
          </div>

          <FormField label="First name" required>
            <input className="input" {...profileForm.register("firstName", { required: true })} />
          </FormField>
          <FormField label="Last name" required>
            <input className="input" {...profileForm.register("lastName", { required: true })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" {...profileForm.register("phone")} />
          </FormField>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={updateProfile.isPending}>
              Save Changes
            </button>
          </div>
        </form>

        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
          <FormField label="Current password" required error={passwordForm.formState.errors.currentPassword?.message}>
            <input type="password" className="input" {...passwordForm.register("currentPassword", { required: true })} />
          </FormField>
          <FormField label="New password" required hint="At least 8 characters" error={passwordForm.formState.errors.newPassword?.message}>
            <input type="password" className="input" {...passwordForm.register("newPassword", { required: true, minLength: 8 })} />
          </FormField>
          <FormField label="Confirm new password" required error={passwordForm.formState.errors.confirmPassword?.message}>
            <input type="password" className="input" {...passwordForm.register("confirmPassword", { required: true })} />
          </FormField>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={changePassword.isPending}>
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
