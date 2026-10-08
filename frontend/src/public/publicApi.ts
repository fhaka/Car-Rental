import axios from "axios";

/**
 * Standalone, token-less client for the customer-facing public API
 * (/api/public/*). Deliberately separate from the authenticated dashboard
 * client so the public site never triggers the staff refresh/redirect flow.
 */
const baseURL = import.meta.env.VITE_API_URL ?? "/api";
export const API_ORIGIN = baseURL.replace(/\/api\/?$/, "");

export const publicClient = axios.create({ baseURL });

export type Transmission = "AUTOMATIC" | "MANUAL";
export type FuelType = "PETROL" | "DIESEL" | "HYBRID" | "ELECTRIC" | "LPG";
export type VehicleStatus = "AVAILABLE" | "RESERVED" | "RENTED" | "MAINTENANCE" | "INACTIVE";

export interface PublicCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface PublicVehicleImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface PublicVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: Transmission;
  fuelType: FuelType;
  seats: number;
  doors: number;
  dailyRate: number;
  weeklyRate: number | null;
  securityDeposit: number;
  status: VehicleStatus;
  category: PublicCategory;
  images: PublicVehicleImage[];
}

export interface PublicCompany {
  companyName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  currency: string;
  cancellationPolicy: string | null;
  rentalTerms: string | null;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface VehicleQuery {
  pickupAt?: string;
  returnAt?: string;
  categoryId?: string;
  transmission?: Transmission;
  fuelType?: FuelType;
  seats?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest";
  page?: number;
  pageSize?: number;
}

export interface CreateBookingPayload {
  vehicleId: string;
  pickupAt: string;
  returnAt: string;
  pickupLocation: string;
  returnLocation: string;
  notes?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    country?: string;
    driverLicenseNumber?: string;
  };
}

export interface BookingConfirmation {
  bookingNumber: string;
  status: string;
  pickupAt: string;
  returnAt: string;
  pickupLocation: string;
  returnLocation: string;
  rentalDays: number;
  dailyRate: number;
  subtotal: number;
  tax: number;
  totalAmount: number;
  securityDeposit: number;
  vehicle: { brand: string; model: string; year: number };
  customer: { firstName: string; lastName: string; email: string };
}

export const publicApi = {
  async getCompany(): Promise<PublicCompany> {
    const { data } = await publicClient.get<PublicCompany>("/public/company");
    return data;
  },
  async getCategories(): Promise<PublicCategory[]> {
    const { data } = await publicClient.get<{ data: PublicCategory[] }>("/public/categories");
    return data.data;
  },
  async listVehicles(query: VehicleQuery = {}): Promise<Paginated<PublicVehicle>> {
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== "" && v !== null));
    const { data } = await publicClient.get<Paginated<PublicVehicle>>("/public/vehicles", { params });
    return data;
  },
  async getVehicle(id: string): Promise<PublicVehicle> {
    const { data } = await publicClient.get<{ vehicle: PublicVehicle }>(`/public/vehicles/${id}`);
    return data.vehicle;
  },
  async createBooking(payload: CreateBookingPayload): Promise<BookingConfirmation> {
    const { data } = await publicClient.post<{ booking: BookingConfirmation }>("/public/bookings", payload);
    return data.booking;
  },
};

export function fuelLabel(fuel: FuelType): string {
  return fuel.charAt(0) + fuel.slice(1).toLowerCase();
}

export function transmissionLabel(t: Transmission): string {
  return t.charAt(0) + t.slice(1).toLowerCase();
}
