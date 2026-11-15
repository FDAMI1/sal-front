export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  pricePaise: number;
  interval: "month" | "year";
  limits: { workers: number; devicesPerUser: number | null };
  isActive: boolean;
}

export interface SalonContact {
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

/** The public booking link behind the salon's QR code. */
export interface BookingLink {
  code: string | null;
  isActive: boolean;
  /** Full customer URL, exactly what the stored QR encodes. */
  url: string | null;
  /** The QR image generated once on the server (PNG data URL), kept until regenerated. */
  qrImage: string | null;
  /** When the current QR was generated. */
  generatedAt: string | null;
  regeneratedAt: string | null;
}

/** The salon as its own admin sees it (backend salon.dto.ts). */
export interface Salon {
  id: string;
  name: string;
  slug: string;
  contact: SalonContact;
  timezone: string;
  businessHours: DayHours[];
  queueSettings: QueueSettings;
  bookingLink: BookingLink;
  approvalStatus: "pending" | "approved" | "rejected";
  plan: Plan | null;
  createdAt: string | null;
}

export interface DayHours {
  /** 0 = Sunday … 6 = Saturday. */
  day: number;
  isOpen: boolean;
  open: string;
  close: string;
}

export interface QueueSettings {
  graceMinutes: number;
  autoCall: boolean;
  noShowAction: "no_show" | "requeue";
  getReadyMinutes: number;
  comeNowMinutes: number;
  stopJoiningMinutesBeforeClose: number;
}

export interface Holiday {
  id: string;
  date: string;
  reason: string;
}

export interface RegisterSalonInput {
  salonName: string;
  city: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
}

export type ServiceGender = "men" | "women" | "unisex";

/** A master catalogue entry (backend catalog.service.ts). */
export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  gender: ServiceGender;
  description: string;
  defaultDurationMinutes: number;
  defaultPricePaise: number;
  isActive: boolean;
}

/** One service on the salon's menu (backend serviceMenu.service.ts). */
export interface MenuService {
  id: string;
  catalogId: string | null;
  name: string;
  category: string;
  gender: ServiceGender;
  description: string;
  durationMinutes: number;
  pricePaise: number;
  allowWalkIn: boolean;
  allowAppointment: boolean;
  isActive: boolean;
}

export type MenuServiceInput = Omit<
  MenuService,
  "id" | "catalogId" | "isActive"
>;
