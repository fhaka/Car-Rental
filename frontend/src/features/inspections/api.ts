import { api } from "../../lib/api";
import { Paginated } from "../../types";

export interface Inspection {
  id: string;
  vehicleId: string;
  vehicle?: { id: string; plateNumber: string; brand: string; model: string };
  rentalId?: string | null;
  rental?: { id: string; rentalNumber: string } | null;
  type: "PRE_RENTAL" | "POST_RENTAL";
  inspectionDate: string;
  inspector?: { id: string; firstName: string; lastName: string };
  mileage: number;
  fuelLevel: number;
  cleanliness: string;
  exteriorCondition: string;
  interiorCondition: string;
  tireCondition: string;
  windshieldCondition: string;
  notes?: string | null;
}

export const inspectionsApi = {
  list: (params: Record<string, unknown> = {}) => api.get<Paginated<Inspection>>("/inspections", { params }).then((r) => r.data),
  create: (input: Record<string, unknown>) => api.post<{ inspection: Inspection }>("/inspections", input).then((r) => r.data.inspection),
};
