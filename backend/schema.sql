-- GoTurf Database Schema for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'turf_owner')),
  is_verified BOOLEAN DEFAULT false,
  location_city TEXT DEFAULT 'Chennai',
  location_area TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Turfs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turfs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  location_address TEXT NOT NULL DEFAULT '',
  location_area TEXT NOT NULL DEFAULT '',
  location_city TEXT DEFAULT 'Chennai',
  location_lat DOUBLE PRECISION DEFAULT 13.0827,
  location_lng DOUBLE PRECISION DEFAULT 80.2707,
  sports TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  dimensions TEXT DEFAULT '',
  surface TEXT DEFAULT 'Artificial Grass' CHECK (surface IN ('Natural Grass', 'Artificial Grass', 'Hard Court')),
  capacity INTEGER DEFAULT 12,
  rating DOUBLE PRECISION DEFAULT 4.0,
  total_reviews INTEGER DEFAULT 0,
  price_per_hour NUMERIC NOT NULL,
  peak_hour_multiplier DOUBLE PRECISION DEFAULT 1.3,
  weather_multiplier JSONB DEFAULT '{"sunny": 1.2, "cloudy": 1.0, "rainy": 0.8}',
  peak_hours JSONB DEFAULT '{"start": "17:00", "end": "21:00"}',
  is_active BOOLEAN DEFAULT true,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_turfs_city ON turfs(location_city);
CREATE INDEX IF NOT EXISTS idx_turfs_area ON turfs(location_area);
CREATE INDEX IF NOT EXISTS idx_turfs_active ON turfs(is_active);

-- ─── Teams ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  captain_id UUID REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID, -- FK added after bookings table
  sport TEXT NOT NULL,
  max_players INTEGER DEFAULT 6,
  invite_code TEXT UNIQUE,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Team Members ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);

-- ─── Bookings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id TEXT UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  turf_id UUID REFERENCES turfs(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration NUMERIC NOT NULL,
  sport TEXT NOT NULL,
  player_count INTEGER NOT NULL DEFAULT 1,
  pricing JSONB DEFAULT '{}',
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment JSONB DEFAULT '{"status": "pending", "method": "online", "transactionId": "", "paidAt": null}',
  chat_room_id TEXT UNIQUE,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_turf_date ON bookings(turf_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Add FK from teams.booking_id -> bookings.id
ALTER TABLE teams ADD CONSTRAINT fk_teams_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT DEFAULT '',
  message TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'system', 'image')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chatroom ON messages(chat_room_id, created_at DESC);

-- ─── Booking ID sequence helper ───────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS booking_id_seq START 1;
