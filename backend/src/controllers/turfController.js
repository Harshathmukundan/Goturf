import supabase from '../lib/supabase.js';
import { calculateDynamicPrice, fetchWeather } from '../utils/pricing.js';

// Helper to format turf data for API response (matches original Mongoose shape)
const formatTurf = (turf) => {
  if (!turf) return null;
  const {
    owner_id, location_address, location_area, location_city,
    location_lat, location_lng, price_per_hour, peak_hour_multiplier,
    weather_multiplier, peak_hours, is_active, total_bookings,
    total_reviews, created_at, updated_at,
    owner_name, owner_email, owner_phone,
    ...rest
  } = turf;

  return {
    ...rest,
    _id: turf.id,
    owner: owner_name ? { _id: owner_id, name: owner_name, email: owner_email, phone: owner_phone } : owner_id,
    location: {
      address: location_address,
      area: location_area,
      city: location_city,
      coordinates: { lat: location_lat, lng: location_lng },
    },
    pricePerHour: price_per_hour,
    peakHourMultiplier: peak_hour_multiplier,
    peakHours: peak_hours,
    isActive: is_active,
    totalBookings: total_bookings,
    totalReviews: total_reviews,
    createdAt: created_at,
    updatedAt: updated_at,
  };
};

// GET /api/turfs - List all turfs with filters
export const getTurfs = async (req, res) => {
  try {
    const {
      city = 'Chennai',
      sport,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    let query = supabase
      .from('turfs')
      .select('*, users!turfs_owner_id_fkey(name, email)', { count: 'exact' })
      .eq('is_active', true);

    if (city) query = query.ilike('location_city', `%${city}%`);
    if (sport) query = query.contains('sports', [sport]);
    if (minPrice) query = query.gte('price_per_hour', Number(minPrice));
    if (maxPrice) query = query.lte('price_per_hour', Number(maxPrice));
    if (search) {
      query = query.or(`name.ilike.%${search}%,location_area.ilike.%${search}%`);
    }

    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: turfs, count, error } = await query;
    if (error) throw error;

    const formatted = turfs.map(t => {
      const owner = t.users;
      return formatTurf({
        ...t,
        owner_name: owner?.name,
        owner_email: owner?.email,
        users: undefined,
      });
    });

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/turfs/owner/my-turfs
export const getOwnerTurfs = async (req, res) => {
  try {
    const { data: turfs, error } = await supabase
      .from('turfs')
      .select('*, users!turfs_owner_id_fkey(name, email)')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = turfs.map(t => {
      const owner = t.users;
      return formatTurf({
        ...t,
        owner_name: owner?.name,
        owner_email: owner?.email,
        users: undefined,
      });
    });

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/turfs/:id
export const getTurf = async (req, res) => {
  try {
    const { data: turf, error } = await supabase
      .from('turfs')
      .select('*, users!turfs_owner_id_fkey(name, email, phone)')
      .eq('id', req.params.id)
      .single();

    if (error || !turf) return res.status(404).json({ success: false, message: 'Turf not found' });

    const owner = turf.users;
    const formatted = formatTurf({
      ...turf,
      owner_name: owner?.name,
      owner_email: owner?.email,
      owner_phone: owner?.phone,
      users: undefined,
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/turfs/:id/slots?date=2024-03-15
export const getTurfSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const { data: turf, error: turfErr } = await supabase
      .from('turfs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (turfErr || !turf) return res.status(404).json({ success: false, message: 'Turf not found' });

    // Get bookings for this turf on the given date
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time')
      .eq('turf_id', turf.id)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    const bookedSlots = (bookings || []).map(b => b.start_time);
    const bookedSlotCount = bookedSlots.length;
    const totalSlots = 18; // 6AM to midnight

    // ─── Weather Data ──────────────────────────────────────────────────────
    const weather = await fetchWeather(turf.location_lat, turf.location_lng);

    // Generate slots (6AM to midnight)
    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      const startTime = `${String(hour).padStart(2, '0')}:00`;
      const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
      
      const pricing = calculateDynamicPrice(
        turf, 
        startTime, 
        1, 
        date, 
        bookedSlotCount, 
        totalSlots, 
        weather
      );

      slots.push({
        startTime,
        endTime,
        ...pricing,
        isAvailable: !bookedSlots.includes(startTime),
      });
    }

    res.json({
      success: true,
      data: {
        turf: formatTurf(turf),
        slots,
        date,
        isWeekend,
        occupancyRate: Math.round(occupancyRate * 100),
        peakHours: turf.peak_hours,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/turfs - Admin/Owner create turf
export const createTurf = async (req, res) => {
  try {
    const body = req.body;
    const insertData = {
      name: body.name,
      description: body.description || '',
      owner_id: req.user.id,
      location_address: body.location?.address || '',
      location_area: body.location?.area || '',
      location_city: body.location?.city || 'Chennai',
      location_lat: body.location?.coordinates?.lat || 13.0827,
      location_lng: body.location?.coordinates?.lng || 80.2707,
      sports: body.sports || [],
      images: body.images || [],
      amenities: body.amenities || [],
      dimensions: body.dimensions || '',
      surface: body.surface || 'Artificial Grass',
      capacity: body.capacity || 12,
      price_per_hour: body.pricePerHour,
      peak_hour_multiplier: body.peakHourMultiplier || 1.3,
      peak_hours: body.peakHours || { start: '17:00', end: '21:00' },
    };

    const { data: turf, error } = await supabase
      .from('turfs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: formatTurf(turf) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/turfs/:id
export const updateTurf = async (req, res) => {
  try {
    const body = req.body;
    const updates = { updated_at: new Date().toISOString() };

    // Map incoming body fields to DB columns
    if (body.name) updates.name = body.name;
    if (body.description) updates.description = body.description;
    if (body.location) {
      if (body.location.address) updates.location_address = body.location.address;
      if (body.location.area) updates.location_area = body.location.area;
      if (body.location.city) updates.location_city = body.location.city;
    }
    if (body.sports) updates.sports = body.sports;
    if (body.images) updates.images = body.images;
    if (body.amenities) updates.amenities = body.amenities;
    if (body.pricePerHour) updates.price_per_hour = body.pricePerHour;
    if (body.peakHourMultiplier) updates.peak_hour_multiplier = body.peakHourMultiplier;
    if (body.peakHours) updates.peak_hours = body.peakHours;
    if (body.surface) updates.surface = body.surface;
    if (body.capacity) updates.capacity = body.capacity;

    const { data: turf, error } = await supabase
      .from('turfs')
      .update(updates)
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error || !turf) return res.status(404).json({ success: false, message: 'Turf not found or unauthorized' });
    res.json({ success: true, data: formatTurf(turf) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/turfs/:id (soft delete)
export const deleteTurf = async (req, res) => {
  try {
    const { data: turf, error } = await supabase
      .from('turfs')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select()
      .single();

    if (error || !turf) return res.status(404).json({ success: false, message: 'Turf not found or unauthorized' });
    res.json({ success: true, message: 'Turf deactivated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
