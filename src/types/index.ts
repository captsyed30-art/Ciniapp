export type UserRole = "USER" | "ADMIN";
export type ScreenType = "STANDARD" | "IMAX" | "4DX" | "VIP" | "DOLBY";
export type SeatType = "STANDARD" | "VIP" | "RECLINER" | "COUPLE" | "ACCESSIBLE";
export type MovieRating = "G" | "PG" | "PG_13" | "R" | "NC_17";
export type ShowtimeFormat = "2D" | "3D" | "IMAX" | "4DX";
export type SeatStatus = "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
}

export interface MovieWithGenres {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string | null;
  durationMins: number;
  releaseDate: Date | string;
  rating: MovieRating;
  language: string;
  director?: string | null;
  cast?: string | null;
  isActive: boolean;
  genres: Array<{ id: string; name: string; slug: string }>;
}

export interface ShowtimeDetail {
  id: string;
  movieId: string;
  auditoriumId: string;
  startTime: Date | string;
  endTime: Date | string;
  priceCents: number;
  format: ShowtimeFormat;
  isActive: boolean;
  movie?: MovieWithGenres;
  auditorium?: {
    id: string;
    name: string;
    screenType: ScreenType;
    totalSeats: number;
    cinema: {
      id: string;
      name: string;
      slug: string;
      address: string;
      city: string;
      state?: string | null;
      amenities?: string[] | null;
    };
  };
}

export interface SeatWithState {
  seatId: string;
  showtimeSeatId: string;
  row: string;
  number: number;
  seatType: SeatType;
  priceMultiplierCents: number;
  status: SeatStatus;
  heldByUserId?: string | null;
  heldUntil?: Date | string | null;
  isMyHold?: boolean;
  priceCents: number; // base showtime price + multiplier
}

export interface BookingHoldResponse {
  bookingId: string;
  referenceCode: string;
  expiresAt: string;
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
  seats: Array<{
    seatId: string;
    showtimeSeatId: string;
    seatLabel: string;
    seatType: SeatType;
    priceCents: number;
  }>;
}

export interface DigitalTicketData {
  ticketCode: string;
  bookingReference: string;
  movieTitle: string;
  moviePoster: string;
  rating: string;
  format: string;
  cinemaName: string;
  cinemaAddress: string;
  auditoriumName: string;
  startTime: string;
  seatLabel: string;
  seatType: string;
  userName: string;
  userEmail: string;
  totalCents: number;
  qrCodeDataUrl: string;
  isCheckedIn: boolean;
}
