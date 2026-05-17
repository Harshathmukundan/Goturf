import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  try {
    console.log('🟢 Connected to Supabase');

    // Create admin user
    const hashedPass = await bcrypt.hash('admin123', 12);

    let admin;
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@goturf.com')
      .maybeSingle();

    if (existingAdmin) {
      admin = existingAdmin;
      console.log('ℹ️  Admin user already exists');
    } else {
      const { data: newAdmin, error } = await supabase
        .from('users')
        .insert({
          name: 'GoTurf Admin',
          email: 'admin@goturf.com',
          password: hashedPass,
          role: 'admin',
        })
        .select()
        .single();

      if (error) throw error;
      admin = newAdmin;
      console.log('✅ Admin user created: admin@goturf.com / admin123');
    }

    // Clear existing turfs
    await supabase.from('turfs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const turfs = [
      {
        name: 'Champions Arena',
        description: 'Premium football turf with floodlights and professional-grade artificial grass. Perfect for competitive matches.',
        owner_id: admin.id,
        location_address: '45, Anna Salai, Anna Nagar',
        location_area: 'Anna Nagar',
        location_city: 'Chennai',
        location_lat: 13.0900,
        location_lng: 80.2101,
        sports: ['Football', 'Cricket'],
        images: [
          'https://images.unsplash.com/photo-1682369368407-9ca29b7a96a3?w=800',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Changing Room', 'Water', 'First Aid'],
        dimensions: '60m x 40m',
        surface: 'Artificial Grass',
        capacity: 14,
        rating: 4.8,
        total_reviews: 234,
        price_per_hour: 1200,
        peak_hour_multiplier: 1.3,
        weather_multiplier: { sunny: 1.2, cloudy: 1.0, rainy: 0.8 },
        peak_hours: { start: '17:00', end: '21:00' },
        is_active: true,
      },
      {
        name: 'Thunder Court',
        description: 'Multi-sport court perfect for basketball, badminton and volleyball. Modern facilities.',
        owner_id: admin.id,
        location_address: '12, Usman Road, T. Nagar',
        location_area: 'T. Nagar',
        location_city: 'Chennai',
        location_lat: 13.0416,
        location_lng: 80.2338,
        sports: ['Basketball', 'Badminton', 'Volleyball'],
        images: [
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
          'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Cafeteria', 'Wi-Fi'],
        dimensions: '28m x 15m',
        surface: 'Hard Court',
        capacity: 12,
        rating: 4.6,
        total_reviews: 187,
        price_per_hour: 800,
        peak_hour_multiplier: 1.25,
        weather_multiplier: { sunny: 1.1, cloudy: 1.0, rainy: 0.9 },
        peak_hours: { start: '18:00', end: '22:00' },
        is_active: true,
      },
      {
        name: 'Smash Zone',
        description: 'Dedicated badminton and squash facility with 4 professional courts and coaching available.',
        owner_id: admin.id,
        location_address: '78, LB Road, Adyar',
        location_area: 'Adyar',
        location_city: 'Chennai',
        location_lat: 13.0012,
        location_lng: 80.2565,
        sports: ['Badminton', 'Squash'],
        images: [
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
        ],
        amenities: ['Air Conditioned', 'Racket Rental', 'Coaching', 'Water', 'Parking'],
        dimensions: '13.4m x 6.1m',
        surface: 'Hard Court',
        capacity: 4,
        rating: 4.7,
        total_reviews: 156,
        price_per_hour: 600,
        peak_hour_multiplier: 1.2,
        weather_multiplier: { sunny: 1.0, cloudy: 1.0, rainy: 1.0 },
        peak_hours: { start: '06:00', end: '09:00' },
        is_active: true,
      },
      {
        name: 'Green Pitch FC',
        description: 'Largest football turf in Chennai, hosting tournaments and leagues regularly.',
        owner_id: admin.id,
        location_address: '23, GST Road, Chromepet',
        location_area: 'Chromepet',
        location_city: 'Chennai',
        location_lat: 12.9516,
        location_lng: 80.1462,
        sports: ['Football'],
        images: [
          'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800',
        ],
        amenities: ['Floodlights', 'VIP Lounge', 'Parking', 'Changing Room', 'Canteen', 'CCTV'],
        dimensions: '100m x 60m',
        surface: 'Natural Grass',
        capacity: 22,
        rating: 4.9,
        total_reviews: 412,
        price_per_hour: 1800,
        peak_hour_multiplier: 1.4,
        weather_multiplier: { sunny: 1.2, cloudy: 1.0, rainy: 0.7 },
        peak_hours: { start: '16:00', end: '20:00' },
        is_active: true,
      },
      {
        name: 'Ace Tennis Hub',
        description: 'Professional tennis courts with clay and hard surface options. Coaching available.',
        owner_id: admin.id,
        location_address: '5, Boat Club Road, R.A. Puram',
        location_area: 'R.A. Puram',
        location_city: 'Chennai',
        location_lat: 13.0300,
        location_lng: 80.2700,
        sports: ['Tennis'],
        images: [
          'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800',
        ],
        amenities: ['Coaching', 'Racket Rental', 'Ball Machine', 'Changing Room', 'Cafeteria'],
        dimensions: '23.77m x 10.97m',
        surface: 'Hard Court',
        capacity: 4,
        rating: 4.5,
        total_reviews: 98,
        price_per_hour: 700,
        peak_hour_multiplier: 1.15,
        weather_multiplier: { sunny: 1.1, cloudy: 1.0, rainy: 0.6 },
        peak_hours: { start: '06:00', end: '09:00' },
        is_active: true,
      },
      {
        name: 'Power Play Zone',
        description: 'Box cricket and football fusion turf, great for corporate events and team outings.',
        owner_id: admin.id,
        location_address: '90, Velachery Main Road, Velachery',
        location_area: 'Velachery',
        location_city: 'Chennai',
        location_lat: 12.9810,
        location_lng: 80.2209,
        sports: ['Cricket', 'Football', 'Kabaddi'],
        images: [
          'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Canteen', 'Scoreboard', 'Sound System'],
        dimensions: '40m x 20m',
        surface: 'Artificial Grass',
        capacity: 16,
        rating: 4.4,
        total_reviews: 203,
        price_per_hour: 1000,
        peak_hour_multiplier: 1.3,
        weather_multiplier: { sunny: 1.15, cloudy: 1.0, rainy: 0.75 },
        peak_hours: { start: '17:00', end: '22:00' },
        is_active: true,
      },
    ];

    const { data: insertedTurfs, error: turfErr } = await supabase
      .from('turfs')
      .insert(turfs)
      .select();

    if (turfErr) throw turfErr;

    console.log(`✅ Created ${insertedTurfs.length} turfs`);
    console.log('\n🎉 Database seeded successfully!');
    console.log('📧 Admin login: admin@goturf.com');
    console.log('🔑 Admin password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('🔴 Seed error:', err.message);
    process.exit(1);
  }
})();
