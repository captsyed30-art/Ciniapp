import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/cinebook";

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production" ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
});

async function runSeed() {
  console.log("🌱 Starting CineBook Database Initialization & Seeding...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create Enums if they don't exist
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE screen_type AS ENUM ('STANDARD', 'IMAX', '4DX', 'VIP', 'DOLBY');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE seat_type AS ENUM ('STANDARD', 'VIP', 'RECLINER', 'COUPLE', 'ACCESSIBLE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE movie_rating AS ENUM ('G', 'PG', 'PG_13', 'R', 'NC_17');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE showtime_format AS ENUM ('2D', '3D', 'IMAX', '4DX');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Create Tables with UUIDs and Constraints
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role user_role NOT NULL DEFAULT 'USER',
        phone VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS genres (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS movies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        synopsis TEXT NOT NULL,
        poster_url TEXT NOT NULL,
        backdrop_url TEXT NOT NULL,
        trailer_url TEXT,
        duration_mins INTEGER NOT NULL,
        release_date TIMESTAMPTZ NOT NULL,
        rating movie_rating NOT NULL,
        language VARCHAR(100) NOT NULL DEFAULT 'English',
        director VARCHAR(255),
        cast TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS movie_genres (
        movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
        PRIMARY KEY (movie_id, genre_id)
      );

      CREATE TABLE IF NOT EXISTS cinemas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20),
        latitude VARCHAR(50),
        longitude VARCHAR(50),
        phone VARCHAR(50),
        amenities TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS auditoriums (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cinema_id UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        screen_type screen_type NOT NULL DEFAULT 'STANDARD',
        total_seats INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_auditorium_name_per_cinema UNIQUE (cinema_id, name)
      );

      CREATE TABLE IF NOT EXISTS seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auditorium_id UUID NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
        row VARCHAR(10) NOT NULL,
        number INTEGER NOT NULL,
        seat_type seat_type NOT NULL DEFAULT 'STANDARD',
        price_multiplier_cents INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_seat_position_per_auditorium UNIQUE (auditorium_id, row, number)
      );

      CREATE TABLE IF NOT EXISTS showtimes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
        auditorium_id UUID NOT NULL REFERENCES auditoriums(id) ON DELETE CASCADE,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        price_cents INTEGER NOT NULL,
        format showtime_format NOT NULL DEFAULT '2D',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS showtime_seats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
        seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        status seat_status NOT NULL DEFAULT 'AVAILABLE',
        held_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        held_until TIMESTAMPTZ,
        booking_id UUID,
        version INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_showtime_seat UNIQUE (showtime_id, seat_id)
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reference_code VARCHAR(32) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
        status booking_status NOT NULL DEFAULT 'PENDING',
        subtotal_cents INTEGER NOT NULL,
        service_fee_cents INTEGER NOT NULL DEFAULT 0,
        tax_cents INTEGER NOT NULL DEFAULT 0,
        total_cents INTEGER NOT NULL,
        idempotency_key VARCHAR(255),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS booking_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        showtime_seat_id UUID NOT NULL REFERENCES showtime_seats(id) ON DELETE CASCADE,
        seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
        seat_label VARCHAR(20) NOT NULL,
        seat_type seat_type NOT NULL,
        price_cents INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        payment_intent_id VARCHAR(255) NOT NULL,
        provider VARCHAR(50) NOT NULL DEFAULT 'test_gateway',
        status payment_status NOT NULL DEFAULT 'PENDING',
        amount_cents INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'usd',
        idempotency_key VARCHAR(255) NOT NULL UNIQUE,
        card_brand VARCHAR(50),
        last4 VARCHAR(10),
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        ticket_code VARCHAR(64) NOT NULL UNIQUE,
        qr_code_data TEXT NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        showtime_seat_id UUID NOT NULL REFERENCES showtime_seats(id) ON DELETE CASCADE,
        seat_label VARCHAR(20) NOT NULL,
        is_checked_in BOOLEAN NOT NULL DEFAULT false,
        checked_in_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100),
        payload JSONB,
        ip_address VARCHAR(100),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Helpful Indexes
      CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
      CREATE INDEX IF NOT EXISTS movies_slug_idx ON movies(slug);
      CREATE INDEX IF NOT EXISTS showtimes_movie_idx ON showtimes(movie_id);
      CREATE INDEX IF NOT EXISTS showtimes_start_time_idx ON showtimes(start_time);
      CREATE INDEX IF NOT EXISTS showtime_seats_status_idx ON showtime_seats(showtime_id, status);
      CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id);
    `);

    // 3. Clear existing data for fresh seed
    await client.query(`
      TRUNCATE tickets, payments, booking_items, bookings, showtime_seats, showtimes, seats, auditoriums, cinemas, movie_genres, movies, genres, users, audit_logs CASCADE;
    `);

    // 4. Seed Users
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash("admin123", salt);
    const userHash = await bcrypt.hash("alex123", salt);
    const user2Hash = await bcrypt.hash("sarah123", salt);

    const adminUserRes = await client.query(
      `INSERT INTO users (email, password_hash, name, role, phone)
       VALUES ('admin@cinebook.com', $1, 'Chief Admin', 'ADMIN', '+1 (555) 019-2831')
       RETURNING id`,
      [adminHash]
    );
    const adminId = adminUserRes.rows[0].id;

    const demoUserRes = await client.query(
      `INSERT INTO users (email, password_hash, name, role, phone)
       VALUES ('alex@cinebook.com', $1, 'Alex Mercer', 'USER', '+1 (555) 012-3456')
       RETURNING id`,
      [userHash]
    );
    const demoUserId = demoUserRes.rows[0].id;

    await client.query(
      `INSERT INTO users (email, password_hash, name, role, phone)
       VALUES ('sarah@cinebook.com', $1, 'Sarah Connor', 'USER', '+1 (555) 987-6543')`,
      [user2Hash]
    );

    console.log("✅ Seeded Users (Admin: admin@cinebook.com / admin123, User: alex@cinebook.com / alex123)");

    // 5. Seed Genres
    const genreList = [
      { name: "Action", slug: "action" },
      { name: "Sci-Fi", slug: "sci-fi" },
      { name: "Thriller", slug: "thriller" },
      { name: "Drama", slug: "drama" },
      { name: "Animation", slug: "animation" },
      { name: "Adventure", slug: "adventure" },
      { name: "Horror", slug: "horror" },
      { name: "IMAX Experience", slug: "imax-experience" },
    ];

    const genreMap: Record<string, string> = {};
    for (const g of genreList) {
      const res = await client.query(
        `INSERT INTO genres (name, slug) VALUES ($1, $2) RETURNING id`,
        [g.name, g.slug]
      );
      genreMap[g.slug] = res.rows[0].id;
    }
    console.log(`✅ Seeded ${genreList.length} Genres`);

    // 6. Seed Movies
    const movieList = [
      {
        title: "Dune: Part Two",
        slug: "dune-part-two",
        synopsis:
          "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
        posterUrl:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        durationMins: 166,
        releaseDate: new Date("2024-03-01"),
        rating: "PG_13",
        language: "English",
        director: "Denis Villeneuve",
        cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem",
        genres: ["action", "sci-fi", "adventure", "imax-experience"],
      },
      {
        title: "Oppenheimer",
        slug: "oppenheimer",
        synopsis:
          "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
        posterUrl:
          "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=uYPbbksJxIg",
        durationMins: 180,
        releaseDate: new Date("2023-07-21"),
        rating: "R",
        language: "English",
        director: "Christopher Nolan",
        cast: "Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr.",
        genres: ["drama", "thriller", "imax-experience"],
      },
      {
        title: "Spider-Man: Across the Spider-Verse",
        slug: "spider-man-across-the-spider-verse",
        synopsis:
          "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence. When the heroes clash on how to handle a new threat, Miles must redefine what it means to be a hero.",
        posterUrl:
          "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=800&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=cqGjhVJWtEg",
        durationMins: 140,
        releaseDate: new Date("2023-06-02"),
        rating: "PG",
        language: "English",
        director: "Joaquim Dos Santos, Kemp Powers",
        cast: "Shameik Moore, Hailee Steinfeld, Oscar Isaac, Daniel Kaluuya",
        genres: ["animation", "action", "adventure"],
      },
      {
        title: "Interstellar: 10th Anniversary IMAX",
        slug: "interstellar-10th-anniversary",
        synopsis:
          "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        posterUrl:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
        durationMins: 169,
        releaseDate: new Date("2014-11-07"),
        rating: "PG_13",
        language: "English",
        director: "Christopher Nolan",
        cast: "Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine",
        genres: ["sci-fi", "drama", "imax-experience"],
      },
      {
        title: "Cyberpunk: Neon Horizon",
        slug: "cyberpunk-neon-horizon",
        synopsis:
          "In the high-tech megalopolis of Neo-Veridia, a rogue neural hacker uncovers a megacorporation's covert syndicate plotting to hijack collective human memory.",
        posterUrl:
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop",
        backdropUrl:
          "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1600&auto=format&fit=crop",
        trailerUrl: "https://www.youtube.com/watch?v=Way9Dexny3w",
        durationMins: 135,
        releaseDate: new Date("2026-05-15"),
        rating: "R",
        language: "English",
        director: "Karin Vance",
        cast: "Elena Ramos, Takeru Sato, Maya Hawke",
        genres: ["sci-fi", "action", "thriller"],
      },
    ];

    const movieMap: Record<string, string> = {};
    for (const m of movieList) {
      const res = await client.query(
        `INSERT INTO movies (title, slug, synopsis, poster_url, backdrop_url, trailer_url, duration_mins, release_date, rating, language, director, cast, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
         RETURNING id`,
        [
          m.title,
          m.slug,
          m.synopsis,
          m.posterUrl,
          m.backdropUrl,
          m.trailerUrl,
          m.durationMins,
          m.releaseDate,
          m.rating,
          m.language,
          m.director,
          m.cast,
        ]
      );
      const movieId = res.rows[0].id;
      movieMap[m.slug] = movieId;

      for (const gSlug of m.genres) {
        if (genreMap[gSlug]) {
          await client.query(
            `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [movieId, genreMap[gSlug]]
          );
        }
      }
    }
    console.log(`✅ Seeded ${movieList.length} Movies & linked genres`);

    // 7. Seed Cinemas
    const cinemaList = [
      {
        name: "CineBook Grand IMAX Central",
        slug: "grand-imax-central",
        address: "742 Broadway, Times Square",
        city: "New York",
        state: "NY",
        postalCode: "10003",
        amenities: [
          "IMAX Laser 4K",
          "Dolby Atmos",
          "VIP Dine-In Lounge",
          "Heated Recliners",
          "Bar & Bistro",
        ],
      },
      {
        name: "CineBook Luxe Metropolis",
        slug: "luxe-metropolis",
        address: "6801 Hollywood Blvd",
        city: "Los Angeles",
        state: "CA",
        postalCode: "90028",
        amenities: [
          "Dolby Cinema",
          "VIP Butler Service",
          "Laser Projection",
          "Cocktail Bar",
        ],
      },
      {
        name: "CineBook Starlight Multiplex",
        slug: "starlight-multiplex",
        address: "500 N Michigan Ave",
        city: "Chicago",
        state: "IL",
        postalCode: "60611",
        amenities: [
          "4DX Motion Seats",
          "RealD 3D",
          "Gourmet Concessions",
          "Arcade Lounge",
        ],
      },
    ];

    const cinemaMap: Record<string, string> = {};
    for (const c of cinemaList) {
      const res = await client.query(
        `INSERT INTO cinemas (name, slug, address, city, state, postal_code, amenities)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [c.name, c.slug, c.address, c.city, c.state, c.postalCode, c.amenities]
      );
      cinemaMap[c.slug] = res.rows[0].id;
    }
    console.log(`✅ Seeded ${cinemaList.length} Cinemas`);

    // 8. Seed Auditoriums & Seats
    const auditoriumsConfig = [
      {
        cinemaSlug: "grand-imax-central",
        name: "Screen 1 - IMAX Grand Laser",
        screenType: "IMAX",
        rows: ["A", "B", "C", "D", "E", "F", "G", "H"],
        cols: 12,
      },
      {
        cinemaSlug: "grand-imax-central",
        name: "Screen 2 - Dolby VIP Lounge",
        screenType: "DOLBY",
        rows: ["A", "B", "C", "D", "E", "F"],
        cols: 10,
      },
      {
        cinemaSlug: "luxe-metropolis",
        name: "Auditorium A - Luxe Premiere",
        screenType: "VIP",
        rows: ["A", "B", "C", "D", "E", "F", "G"],
        cols: 10,
      },
      {
        cinemaSlug: "starlight-multiplex",
        name: "Theater 1 - 4DX Experience",
        screenType: "4DX",
        rows: ["A", "B", "C", "D", "E", "F"],
        cols: 10,
      },
    ];

    const auditoriumMap: Record<string, { id: string; seatIds: string[] }> = {};

    for (const aud of auditoriumsConfig) {
      const cinemaId = cinemaMap[aud.cinemaSlug];
      const totalSeats = aud.rows.length * aud.cols;

      const audRes = await client.query(
        `INSERT INTO auditoriums (cinema_id, name, screen_type, total_seats)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [cinemaId, aud.name, aud.screenType, totalSeats]
      );
      const audId = audRes.rows[0].id;
      const seatIds: string[] = [];

      for (let rIdx = 0; rIdx < aud.rows.length; rIdx++) {
        const row = aud.rows[rIdx];
        for (let col = 1; col <= aud.cols; col++) {
          let seatType = "STANDARD";
          let multiplierCents = 0;

          // Back rows are VIP / Recliner
          if (rIdx >= aud.rows.length - 2) {
            seatType = "VIP";
            multiplierCents = 600;
          } else if (rIdx >= aud.rows.length - 4) {
            seatType = "RECLINER";
            multiplierCents = 450;
          } else if (rIdx === 0 && (col === 1 || col === aud.cols)) {
            seatType = "ACCESSIBLE";
            multiplierCents = 0;
          }

          const sRes = await client.query(
            `INSERT INTO seats (auditorium_id, row, number, seat_type, price_multiplier_cents)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [audId, row, col, seatType, multiplierCents]
          );
          seatIds.push(sRes.rows[0].id);
        }
      }

      auditoriumMap[aud.name] = { id: audId, seatIds };
    }
    console.log(`✅ Seeded Auditoriums and Seat Layouts`);

    // 9. Seed Showtimes and populate showtime_seats
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    const showtimeSchedules = [
      // Today
      {
        movieSlug: "dune-part-two",
        audName: "Screen 1 - IMAX Grand Laser",
        dayOffset: 0,
        hour: 14,
        minute: 0,
        priceCents: 1800,
        format: "IMAX",
      },
      {
        movieSlug: "dune-part-two",
        audName: "Screen 1 - IMAX Grand Laser",
        dayOffset: 0,
        hour: 18,
        minute: 30,
        priceCents: 2100,
        format: "IMAX",
      },
      {
        movieSlug: "oppenheimer",
        audName: "Screen 2 - Dolby VIP Lounge",
        dayOffset: 0,
        hour: 15,
        minute: 0,
        priceCents: 1600,
        format: "2D",
      },
      {
        movieSlug: "oppenheimer",
        audName: "Screen 2 - Dolby VIP Lounge",
        dayOffset: 0,
        hour: 19,
        minute: 45,
        priceCents: 1850,
        format: "2D",
      },
      {
        movieSlug: "spider-man-across-the-spider-verse",
        audName: "Auditorium A - Luxe Premiere",
        dayOffset: 0,
        hour: 16,
        minute: 15,
        priceCents: 1500,
        format: "2D",
      },
      {
        movieSlug: "cyberpunk-neon-horizon",
        audName: "Theater 1 - 4DX Experience",
        dayOffset: 0,
        hour: 20,
        minute: 0,
        priceCents: 2200,
        format: "4DX",
      },
      // Tomorrow
      {
        movieSlug: "dune-part-two",
        audName: "Screen 1 - IMAX Grand Laser",
        dayOffset: 1,
        hour: 13,
        minute: 0,
        priceCents: 1800,
        format: "IMAX",
      },
      {
        movieSlug: "dune-part-two",
        audName: "Screen 1 - IMAX Grand Laser",
        dayOffset: 1,
        hour: 17,
        minute: 30,
        priceCents: 2100,
        format: "IMAX",
      },
      {
        movieSlug: "interstellar-10th-anniversary",
        audName: "Screen 1 - IMAX Grand Laser",
        dayOffset: 1,
        hour: 21,
        minute: 30,
        priceCents: 2200,
        format: "IMAX",
      },
      {
        movieSlug: "spider-man-across-the-spider-verse",
        audName: "Auditorium A - Luxe Premiere",
        dayOffset: 1,
        hour: 14,
        minute: 30,
        priceCents: 1500,
        format: "2D",
      },
      // Day After Tomorrow
      {
        movieSlug: "interstellar-10th-anniversary",
        audName: "Screen 1 - IMAX Grand Laser",
        dayOffset: 2,
        hour: 19,
        minute: 0,
        priceCents: 2200,
        format: "IMAX",
      },
    ];

    let createdShowtimes = 0;
    let createdShowtimeSeats = 0;

    for (const s of showtimeSchedules) {
      const movieId = movieMap[s.movieSlug];
      const audInfo = auditoriumMap[s.audName];

      if (!movieId || !audInfo) continue;

      const startTime = new Date(baseDate);
      startTime.setDate(startTime.getDate() + s.dayOffset);
      startTime.setHours(s.hour, s.minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 150);

      const stRes = await client.query(
        `INSERT INTO showtimes (movie_id, auditorium_id, start_time, end_time, price_cents, format, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id`,
        [movieId, audInfo.id, startTime, endTime, s.priceCents, s.format]
      );
      const showtimeId = stRes.rows[0].id;
      createdShowtimes++;

      // Populate showtime_seats
      for (const seatId of audInfo.seatIds) {
        await client.query(
          `INSERT INTO showtime_seats (showtime_id, seat_id, status)
           VALUES ($1, $2, 'AVAILABLE')`,
          [showtimeId, seatId]
        );
        createdShowtimeSeats++;
      }
    }
    console.log(
      `✅ Seeded ${createdShowtimes} Showtimes & ${createdShowtimeSeats} Showtime Seats`
    );

    // 10. Pre-seed a sample confirmed booking for Alex Mercer to show on first load
    const firstShowtimeRes = await client.query(
      `SELECT id, price_cents FROM showtimes ORDER BY start_time ASC LIMIT 1`
    );
    if (firstShowtimeRes.rows.length > 0) {
      const targetShowtimeId = firstShowtimeRes.rows[0].id;
      const basePrice = firstShowtimeRes.rows[0].price_cents;

      const targetSeatsRes = await client.query(
        `SELECT ss.id as showtime_seat_id, ss.seat_id, s.row, s.number, s.seat_type
         FROM showtime_seats ss
         JOIN seats s ON s.id = ss.seat_id
         WHERE ss.showtime_id = $1
         ORDER BY s.row DESC, s.number ASC
         LIMIT 2`,
        [targetShowtimeId]
      );

      if (targetSeatsRes.rows.length === 2) {
        const seat1 = targetSeatsRes.rows[0];
        const seat2 = targetSeatsRes.rows[1];
        const subtotal = basePrice * 2 + 1200;
        const fee = 300;
        const tax = Math.round((subtotal + fee) * 0.0825);
        const total = subtotal + fee + tax;

        const bookingRes = await client.query(
          `INSERT INTO bookings (reference_code, user_id, showtime_id, status, subtotal_cents, service_fee_cents, tax_cents, total_cents, idempotency_key, expires_at)
           VALUES ('CB-DEMO01', $1, $2, 'CONFIRMED', $3, $4, $5, $6, 'idemp_demo_alex_001', NOW() + interval '1 day')
           RETURNING id`,
          [demoUserId, targetShowtimeId, subtotal, fee, tax, total]
        );
        const demoBookingId = bookingRes.rows[0].id;

        // Mark seats BOOKED
        await client.query(
          `UPDATE showtime_seats SET status = 'BOOKED', booking_id = $1 WHERE id = ANY($2)`,
          [demoBookingId, [seat1.showtime_seat_id, seat2.showtime_seat_id]]
        );

        // Add booking items
        await client.query(
          `INSERT INTO booking_items (booking_id, showtime_seat_id, seat_id, seat_label, seat_type, price_cents)
           VALUES ($1, $2, $3, $4, $5, $6), ($1, $7, $8, $9, $10, $11)`,
          [
            demoBookingId,
            seat1.showtime_seat_id,
            seat1.seat_id,
            `${seat1.row}${seat1.number}`,
            seat1.seat_type,
            basePrice + 600,
            seat2.showtime_seat_id,
            seat2.seat_id,
            `${seat2.row}${seat2.number}`,
            seat2.seat_type,
            basePrice + 600,
          ]
        );

        // Add payment
        await client.query(
          `INSERT INTO payments (booking_id, payment_intent_id, provider, status, amount_cents, idempotency_key, card_brand, last4)
           VALUES ($1, 'pi_demo_alex_001', 'test_gateway', 'SUCCEEDED', $2, 'idemp_demo_alex_001', 'Visa', '4242')`,
          [demoBookingId, total]
        );

        // Add tickets with demo QR
        const qrSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="white" width="100" height="100"/><rect fill="black" x="10" y="10" width="30" height="30"/><rect fill="black" x="60" y="10" width="30" height="30"/><rect fill="black" x="10" y="60" width="30" height="30"/><rect fill="black" x="50" y="50" width="20" height="20"/></svg>`;

        await client.query(
          `INSERT INTO tickets (booking_id, ticket_code, qr_code_data, user_id, showtime_seat_id, seat_label)
           VALUES ($1, 'TCKT-DEMO-001A', $2, $3, $4, $5),
                  ($1, 'TCKT-DEMO-001B', $2, $3, $6, $7)`,
          [
            demoBookingId,
            qrSvg,
            demoUserId,
            seat1.showtime_seat_id,
            `${seat1.row}${seat1.number}`,
            seat2.showtime_seat_id,
            `${seat2.row}${seat2.number}`,
          ]
        );

        console.log("✅ Pre-seeded demo confirmed booking (CB-DEMO01)");
      }
    }

    await client.query("COMMIT");
    console.log("✨ CineBook database seeding completed successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
