import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  try {
    console.log('🟢 Connected to Supabase');

    // Get admin user
    const { data: admin, error: adminErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@goturf.com')
      .single();

    if (adminErr || !admin) {
      console.log('Error finding admin user. Please run original seed script first.');
      process.exit(1);
    }

    const turfs = [
      // Mumbai
      {
        name: 'Bandra FC Arena',
        description: 'Prime location at Bandra West. 5v5 and 7v7 pitches available with premium FIFA certified grass.',
        owner_id: admin.id,
        location_address: '15, Hill Road, Bandra West',
        location_area: 'Bandra',
        location_city: 'Mumbai',
        location_lat: 19.0596,
        location_lng: 72.8295,
        sports: ['Football'],
        images: [
          'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800',
          'https://images.unsplash.com/photo-1555800057-04332bdca4e3?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Washrooms', 'First Aid', 'Cafe'],
        dimensions: '70m x 45m',
        surface: 'Artificial Grass',
        capacity: 14,
        rating: 4.9,
        total_reviews: 412,
        price_per_hour: 2000,
        peak_hour_multiplier: 1.4,
        peak_hours: { start: '18:00', end: '22:00' },
        is_active: true,
      },
      {
        name: 'Andheri Sports Complex',
        description: 'Large multi-sport facility serving all of Andheri. Perfect for cricket netting and football practice.',
        owner_id: admin.id,
        location_address: 'Veera Desai Road, Andheri West',
        location_area: 'Andheri',
        location_city: 'Mumbai',
        location_lat: 19.1136,
        location_lng: 72.8697,
        sports: ['Football', 'Cricket'],
        images: [
          'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
          'https://images.unsplash.com/photo-1624880357913-a8539238165b?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Changing Room'],
        dimensions: '80m x 55m',
        surface: 'Artificial Grass',
        capacity: 22,
        rating: 4.7,
        total_reviews: 298,
        price_per_hour: 1800,
        peak_hour_multiplier: 1.3,
        peak_hours: { start: '17:00', end: '21:00' },
        is_active: true,
      },
      // Bangalore
      {
        name: 'Koramangala Turf Club',
        description: 'Best turf in South Bangalore. Very popular among techies for post-work games.',
        owner_id: admin.id,
        location_address: '5th Block, Koramangala',
        location_area: 'Koramangala',
        location_city: 'Bangalore',
        location_lat: 12.9352,
        location_lng: 77.6245,
        sports: ['Football', 'Basketball'],
        images: [
          'https://images.unsplash.com/photo-1505251119515-586b6255bd88?w=800',
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Locker Room'],
        dimensions: '55m x 35m',
        surface: 'Artificial Grass',
        capacity: 12,
        rating: 4.8,
        total_reviews: 580,
        price_per_hour: 1500,
        peak_hour_multiplier: 1.5,
        peak_hours: { start: '18:00', end: '22:00' },
        is_active: true,
      },
      {
        name: 'Indiranagar Sports Hub',
        description: 'Premium indoor and outdoor facilities in the heart of Indiranagar.',
        owner_id: admin.id,
        location_address: '100ft Road, Indiranagar',
        location_area: 'Indiranagar',
        location_city: 'Bangalore',
        location_lat: 12.9784,
        location_lng: 77.6408,
        sports: ['Badminton', 'Tennis'],
        images: [
          'https://images.unsplash.com/photo-1622279457486-62d74eca1556?w=800',
          'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=800',
        ],
        amenities: ['Indoor Lighting', 'Parking', 'Equipment Rental'],
        dimensions: 'Standard',
        surface: 'Hard Court',
        capacity: 4,
        rating: 4.6,
        total_reviews: 145,
        price_per_hour: 500,
        peak_hour_multiplier: 1.25,
        peak_hours: { start: '06:00', end: '09:00' },
        is_active: true,
      },
      // Hyderabad
      {
        name: 'Hitech City Smashers',
        description: 'Huge sports complex near the IT corridor.',
        owner_id: admin.id,
        location_address: 'Mindspace IT Park, Hitech City',
        location_area: 'Hitech City',
        location_city: 'Hyderabad',
        location_lat: 17.4435,
        location_lng: 78.3772,
        sports: ['Cricket', 'Football'],
        images: [
          'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
          'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Cafeteria', 'Bowling Machine'],
        dimensions: '90m x 60m',
        surface: 'Artificial Grass',
        capacity: 22,
        rating: 4.5,
        total_reviews: 320,
        price_per_hour: 1600,
        peak_hour_multiplier: 1.3,
        peak_hours: { start: '17:00', end: '22:00' },
        is_active: true,
      },
      // Delhi
      {
        name: 'Saket Sports Complex',
        description: 'Elite sporting facilities with great connectivity in South Delhi.',
        owner_id: admin.id,
        location_address: 'Near Select Citywalk, Saket',
        location_area: 'Saket',
        location_city: 'Delhi',
        location_lat: 28.5245,
        location_lng: 77.2066,
        sports: ['Football', 'Basketball', 'Tennis'],
        images: [
          'https://images.unsplash.com/photo-1518605368461-1ee7c5320de5?w=800',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        ],
        amenities: ['Floodlights', 'Parking', 'Washrooms', 'First Aid'],
        dimensions: '60m x 40m',
        surface: 'Artificial Grass',
        capacity: 14,
        rating: 4.7,
        total_reviews: 215,
        price_per_hour: 1400,
        peak_hour_multiplier: 1.35,
        peak_hours: { start: '18:00', end: '21:00' },
        is_active: true,
      }
    ];

    const { error } = await supabase.from('turfs').insert(turfs);
    if (error) throw error;

    console.log(`✅ Successfully added ${turfs.length} turfs across Mumbai, Bangalore, Hyderabad, and Delhi!`);
    
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
})();
