import { api } from "../../lib/api";
import { CompanySettings } from "../../types";

export const settingsApi = {
  get: () => api.get<{ settings: CompanySettings }>("/settings").then((r) => r.data.settings),
  update: (input: Partial<CompanySettings>) => api.patch<{ settings: CompanySettings }>("/settings", input).then((r) => r.data.settings),
};
