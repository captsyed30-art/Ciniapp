import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);
export const screenTypeEnum = pgEnum("screen_type", [
  "STANDARD",
  "IMAX",
  "4DX",
  "VIP",
  "DOLBY",
]);
export const seatTypeEnum = pgEnum("seat_type", [
  "STANDARD",
  "VIP",
  "RECLINER",
  "COUPLE",
  "ACCESSIBLE",
]);
export const movieRatingEnum = pgEnum("movie_rating", [
  "G",
  "PG",
  "PG_13",
  "R",
  "NC_17",
]);
export const showtimeFormatEnum = pgEnum("showtime_format", [
  "2D",
  "3D",
  "IMAX",
  "4DX",
]);
export const seatStatusEnum = pgEnum("seat_status", [
  "AVAILABLE",
  "HELD",
  "BOOKED",
  "BLOCKED",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
]);

// -----------------------------------------------------------------------------
// 1. Users
// -----------------------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: userRoleEnum("role").default("USER").notNull(),
    phone: varchar("phone", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

// -----------------------------------------------------------------------------
// 2. Genres
// -----------------------------------------------------------------------------
export const genres = pgTable(
  "genres",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: index("genres_slug_idx").on(table.slug),
  })
);

// -----------------------------------------------------------------------------
// 3. Movies
// -----------------------------------------------------------------------------
export const movies = pgTable(
  "movies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    synopsis: text("synopsis").notNull(),
    posterUrl: text("poster_url").notNull(),
    backdropUrl: text("backdrop_url").notNull(),
    trailerUrl: text("trailer_url"),
    durationMins: integer("duration_mins").notNull(),
    releaseDate: timestamp("release_date", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    rating: movieRatingEnum("rating").notNull(),
    language: varchar("language", { length: 100 }).default("English").notNull(),
    director: varchar("director", { length: 255 }),
    cast: text("cast"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugIdx: index("movies_slug_idx").on(table.slug),
    activeIdx: index("movies_active_idx").on(table.isActive),
  })
);

// -----------------------------------------------------------------------------
// 4. Movie Genres (Join Table)
// -----------------------------------------------------------------------------
export const movieGenres = pgTable(
  "movie_genres",
  {
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    genreId: uuid("genre_id")
      .notNull()
      .references(() => genres.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: uniqueIndex("movie_genres_pk").on(table.movieId, table.genreId),
  })
);

// -----------------------------------------------------------------------------
// 5. Cinemas
// -----------------------------------------------------------------------------
export const cinemas = pgTable(
  "cinemas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    address: varchar("address", { length: 255 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    latitude: varchar("latitude", { length: 50 }),
    longitude: varchar("longitude", { length: 50 }),
    phone: varchar("phone", { length: 50 }),
    amenities: text("amenities").array(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    cityIdx: index("cinemas_city_idx").on(table.city),
    slugIdx: index("cinemas_slug_idx").on(table.slug),
  })
);

// -----------------------------------------------------------------------------
// 6. Auditoriums
// -----------------------------------------------------------------------------
export const auditoriums = pgTable(
  "auditoriums",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cinemaId: uuid("cinema_id")
      .notNull()
      .references(() => cinemas.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    screenType: screenTypeEnum("screen_type").default("STANDARD").notNull(),
    totalSeats: integer("total_seats").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueScreenPerCinema: uniqueIndex("unique_auditorium_name_per_cinema").on(
      table.cinemaId,
      table.name
    ),
  })
);

// -----------------------------------------------------------------------------
// 7. Seats
// -----------------------------------------------------------------------------
export const seats = pgTable(
  "seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    row: varchar("row", { length: 10 }).notNull(),
    number: integer("number").notNull(),
    seatType: seatTypeEnum("seat_type").default("STANDARD").notNull(),
    priceMultiplierCents: integer("price_multiplier_cents").default(0).notNull(), // additional fee in minor units
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueSeatPosition: uniqueIndex("unique_seat_position_per_auditorium").on(
      table.auditoriumId,
      table.row,
      table.number
    ),
  })
);

// -----------------------------------------------------------------------------
// 8. Showtimes
// -----------------------------------------------------------------------------
export const showtimes = pgTable(
  "showtimes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    movieId: uuid("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    auditoriumId: uuid("auditorium_id")
      .notNull()
      .references(() => auditoriums.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    endTime: timestamp("end_time", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    priceCents: integer("price_cents").notNull(), // Base ticket price in minor units (e.g. 1500 = $15.00)
    format: showtimeFormatEnum("format").default("2D").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    movieIdx: index("showtimes_movie_idx").on(table.movieId),
    auditoriumIdx: index("showtimes_auditorium_idx").on(table.auditoriumId),
    startTimeIdx: index("showtimes_start_time_idx").on(table.startTime),
  })
);

// -----------------------------------------------------------------------------
// 9. Showtime Seats (Seat Availability / Realtime Hold Locking)
// -----------------------------------------------------------------------------
export const showtimeSeats = pgTable(
  "showtime_seats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    status: seatStatusEnum("status").default("AVAILABLE").notNull(),
    heldByUserId: uuid("held_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    heldUntil: timestamp("held_until", {
      withTimezone: true,
      mode: "date",
    }),
    bookingId: uuid("booking_id"),
    version: integer("version").default(1).notNull(), // Optimistic/Pessimistic concurrency lock
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uniqueShowtimeSeat: uniqueIndex("unique_showtime_seat").on(
      table.showtimeId,
      table.seatId
    ),
    showtimeStatusIdx: index("showtime_seats_status_idx").on(
      table.showtimeId,
      table.status
    ),
    heldUntilIdx: index("showtime_seats_held_until_idx").on(table.heldUntil),
  })
);

// -----------------------------------------------------------------------------
// 10. Bookings
// -----------------------------------------------------------------------------
export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referenceCode: varchar("reference_code", { length: 32 }).notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showtimeId: uuid("showtime_id")
      .notNull()
      .references(() => showtimes.id, { onDelete: "cascade" }),
    status: bookingStatusEnum("status").default("PENDING").notNull(),
    subtotalCents: integer("subtotal_cents").notNull(),
    serviceFeeCents: integer("service_fee_cents").default(0).notNull(),
    taxCents: integer("tax_cents").default(0).notNull(),
    totalCents: integer("total_cents").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("bookings_user_idx").on(table.userId),
    refIdx: index("bookings_ref_idx").on(table.referenceCode),
    statusIdx: index("bookings_status_idx").on(table.status),
    expiresIdx: index("bookings_expires_idx").on(table.expiresAt),
  })
);

// -----------------------------------------------------------------------------
// 11. Booking Items
// -----------------------------------------------------------------------------
export const bookingItems = pgTable(
  "booking_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "cascade" }),
    seatId: uuid("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    seatLabel: varchar("seat_label", { length: 20 }).notNull(), // e.g. "F-12"
    seatType: seatTypeEnum("seat_type").notNull(),
    priceCents: integer("price_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    bookingIdx: index("booking_items_booking_idx").on(table.bookingId),
  })
);

// -----------------------------------------------------------------------------
// 12. Payments
// -----------------------------------------------------------------------------
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    paymentIntentId: varchar("payment_intent_id", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 50 }).default("test_gateway").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 10 }).default("usd").notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull().unique(),
    cardBrand: varchar("card_brand", { length: 50 }),
    last4: varchar("last4", { length: 10 }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    bookingIdx: index("payments_booking_idx").on(table.bookingId),
    idempotencyIdx: index("payments_idempotency_idx").on(table.idempotencyKey),
  })
);

// -----------------------------------------------------------------------------
// 13. Tickets
// -----------------------------------------------------------------------------
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    ticketCode: varchar("ticket_code", { length: 64 }).notNull().unique(),
    qrCodeData: text("qr_code_data").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    showtimeSeatId: uuid("showtime_seat_id")
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: "cascade" }),
    seatLabel: varchar("seat_label", { length: 20 }).notNull(),
    isCheckedIn: boolean("is_checked_in").default(false).notNull(),
    checkedInAt: timestamp("checked_in_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    bookingIdx: index("tickets_booking_idx").on(table.bookingId),
    userIdx: index("tickets_user_idx").on(table.userId),
    ticketCodeIdx: index("tickets_code_idx").on(table.ticketCode),
  })
);

// -----------------------------------------------------------------------------
// 14. Audit Logs
// -----------------------------------------------------------------------------
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }),
    payload: jsonb("payload"),
    ipAddress: varchar("ip_address", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    actionIdx: index("audit_logs_action_idx").on(table.action),
    entityIdx: index("audit_logs_entity_idx").on(
      table.entityType,
      table.entityId
    ),
  })
);

// -----------------------------------------------------------------------------
// Relations
// -----------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  tickets: many(tickets),
  auditLogs: many(auditLogs),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(
  showtimeSeats,
  ({ one, many }) => ({
    showtime: one(showtimes, {
      fields: [showtimeSeats.showtimeId],
      references: [showtimes.id],
    }),
    seat: one(seats, {
      fields: [showtimeSeats.seatId],
      references: [seats.id],
    }),
    heldByUser: one(users, {
      fields: [showtimeSeats.heldByUserId],
      references: [users.id],
    }),
    bookingItems: many(bookingItems),
    tickets: many(tickets),
  })
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  bookingItems: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
  seat: one(seats, {
    fields: [bookingItems.seatId],
    references: [seats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [tickets.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
}));
