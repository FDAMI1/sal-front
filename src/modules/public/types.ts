/** A signed-in customer (kept for the customer portal of a later phase). */
export interface CustomerProfile {
  id: string;
  salonId: string;
  phone: string;
  name: string;
  /** The booking link code they came in through. */
  linkCode: string;
}

export type ServiceGender = "men" | "women" | "unisex";

/** GET /public/salons/:code — what the QR code opens. */
export interface PublicSalon {
  name: string;
  phone: string;
  address: string;
  timezone: string;
  businessHours: {
    day: number;
    isOpen: boolean;
    open: string;
    close: string;
  }[];
  closedToday: boolean;
  booking: {
    /** Salon-local today, YYYY-MM-DD. */
    today: string;
    maxDaysAhead: number;
    walkInOpen: boolean;
    /** Why "as soon as possible" is not offered right now. */
    walkInMessage: string | null;
    holidays: string[];
  };
  /** Staff a customer may ask for, with the services each does. */
  staff: { id: string; displayName: string; serviceIds: string[] }[];
  services: {
    id: string;
    name: string;
    category: string;
    gender: ServiceGender;
    description: string;
    durationMinutes: number;
    pricePaise: number;
    allowWalkIn: boolean;
    allowAppointment: boolean;
  }[];
}

export type CustomerGender = "male" | "female";
export type BookingMode = "now" | "scheduled";

export interface BookingInput {
  gender: CustomerGender;
  name: string;
  phone: string;
  serviceIds: string[];
  preferredWorkerId: string | null;
  mode: BookingMode;
  date?: string;
  time?: string;
}

/** GET /public/bookings/:trackingCode — the customer's own booking. */
export interface TrackedBooking {
  trackingCode: string;
  token: string;
  status:
    "booked" | "called" | "in_service" | "completed" | "no_show" | "cancelled";
  mode: BookingMode;
  businessDate: string;
  scheduledTime: string | null;
  customerName: string;
  items: { name: string; durationMinutes: number; pricePaise: number }[];
  totalPaise: number;
  totalMinutes: number;
  preferredWorkerName: string | null;
  /** Who is serving them, once called. */
  assignedWorkerName: string | null;
  /** Walk-ins still waiting: earlier tokens still waiting. Otherwise null. */
  peopleAhead: number | null;
  salonName: string;
  salonPhone: string;
  createdAt: string | null;
}
