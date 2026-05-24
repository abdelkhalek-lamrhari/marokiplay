export type MachineStatus = "available" | "booked" | "maintenance";
export type PerformanceTier = "Ultra" | "Elite" | "Pro" | "Standard";
export type ReservationStatus = "pending" | "approved" | "completed" | "cancelled";
export type Platform = "PC" | "Mobile" | "Both";

export interface GamingMachine {
  id: string;
  name: string;
  tier: PerformanceTier;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  status: MachineStatus;
  pricePerHour: number;
  image: string;
  description: string;
  features: string[];
  availability: string[];
  platforms: Platform[];
  latency: string;
  ipAddress: string | null;
  connectionInstructions: string | null;
  installedGames: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface Reservation {
  id: string;
  machineId: string;
  machineName: string;
  machineTier: PerformanceTier;
  userName: string;
  userEmail: string;
  date: string;
  timeSlot: string;
  duration: number;
  totalPrice: number;
  status: ReservationStatus;
  createdAt: string;
  paymentMethod?: string;
  cardLast4?: string;
}

export const TIER_RANK: Record<PerformanceTier, number> = {
  Standard: 1,
  Pro: 2,
  Elite: 3,
  Ultra: 4,
};

export const TIER_COLORS: Record<PerformanceTier, string> = {
  Ultra: "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
  Elite: "text-purple-400 border-purple-400/50 bg-purple-400/10",
  Pro: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  Standard: "text-green-400 border-green-400/50 bg-green-400/10",
};

export const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "text-yellow-400 border-yellow-400/50 bg-yellow-400/10",
  approved: "text-cyan-400 border-cyan-400/50 bg-cyan-400/10",
  completed: "text-green-400 border-green-400/50 bg-green-400/10",
  cancelled: "text-red-400 border-red-400/50 bg-red-400/10",
};

export function mapMachineRow(row: Record<string, unknown>): GamingMachine {
  return {
    id: row.id as string,
    name: row.name as string,
    tier: row.tier as PerformanceTier,
    cpu: row.cpu as string,
    gpu: row.gpu as string,
    ram: row.ram as string,
    storage: row.storage as string,
    status: row.status as MachineStatus,
    pricePerHour: Number(row.price_per_hour),
    image: row.image as string,
    description: row.description as string,
    features: (row.features as string[]) ?? [],
    availability: (row.availability as string[]) ?? [],
    platforms: (row.platforms as Platform[]) ?? [],
    latency: row.latency as string,
    ipAddress: (row.ip_address as string | null) ?? null,
    connectionInstructions: (row.connection_instructions as string | null) ?? null,
    installedGames: Array.isArray(row.machine_games)
      ? (row.machine_games as { game_id: string }[]).map((mg) => mg.game_id)
      : Array.isArray(row.installed_games)
      ? (row.installed_games as string[])
      : [],
  };
}
