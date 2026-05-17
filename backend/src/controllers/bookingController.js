import supabase from '../lib/supabase.js';
import { calculateDynamicPrice, fetchWeather } from '../utils/pricing.js';

// ─── Dynamic Pricing Engine ─────────────────────────────────────────────────
// Removed local logic - now using unified pricing utility from ../utils/pricing.js

// Helper to format booking for response
const formatBooking = (b) => {
  if (!b) return null;
  return {
    _id: b.id,
    bookingId: b.booking_id,
    user: b.user_data || b.user_id,
    turf: b.turf_data || b.turf_id,
    date: b.date,
    startTime: b.start_time,
    endTime: b.end_time,
    duration: b.duration,
    sport: b.sport,
    playerCount: b.player_count,
    pricing: b.pricing,
    team: b.team_data || b.team_id,
    status: b.status,
    payment: b.payment,
    chatRoomId: b.chat_room_id,
    cancelledAt: b.cancelled_at,
    cancelReason: b.cancel_reason,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
};

// POST /api/bookings - Create booking
export const createBooking = async (req, res) => {
  try {
    const { turfId, date, startTime, duration, sport, playerCount } = req.body;

    // Get turf
    const { data: turf, error: turfErr } = await supabase
      .from('turfs')
      .select('*')
      .eq('id', turfId)
      .single();

    if (turfErr || !turf) return res.status(404).json({ success: false, message: 'Turf not found' });

    // Check slot availability
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('turf_id', turfId)
      .eq('date', date)
      .eq('start_time', startTime)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (existingBooking) {
      return res.status(409).json({ success: false, message: 'Slot already booked' });
    }

    // Count booked slots for demand-based pricing
    const { data: dateBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('turf_id', turfId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    const bookedSlotCount = (dateBookings || []).length;

    // ─── Weather Data ──────────────────────────────────────────────────────
    const weather = await fetchWeather(turf.location_lat, turf.location_lng);

    // Calculate end time
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = startHour + duration;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;

    // Calculate pricing with unified dynamic engine
    const pricing = calculateDynamicPrice(turf, startTime, duration, date, bookedSlotCount, 18, weather);

    // Generate booking ID
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    const bookingIdStr = `CHE-${String((count || 0) + 1).padStart(3, '0')}`;
    const chatRoomId = `chat_${bookingIdStr}_${Date.now()}`;

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        booking_id: bookingIdStr,
        user_id: req.user.id,
        turf_id: turfId,
        date,
        start_time: startTime,
        end_time: endTime,
        duration,
        sport,
        player_count: playerCount,
        pricing,
        status: 'pending',
        chat_room_id: chatRoomId,
      })
      .select()
      .single();

    if (error) throw error;

    // Update turf booking count (manual update since RPC may not exist)
    try {
      await supabase
        .from('turfs')
        .update({ total_bookings: (turf.total_bookings || 0) + 1 })
        .eq('id', turfId);
    } catch {
      // Non-critical — ignore if total_bookings column doesn't exist
    }

    // Fetch user and turf info for response
    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', req.user.id)
      .single();

    const formatted = formatBooking({
      ...booking,
      user_data: userData ? { _id: userData.id, name: userData.name, email: userData.email } : null,
      turf_data: {
        _id: turf.id,
        name: turf.name,
        location: {
          address: turf.location_address,
          area: turf.location_area,
          city: turf.location_city,
        },
        images: turf.images,
      },
    });

    res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/my - Get user bookings
export const getUserBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('bookings')
      .select('*, turfs(id, name, location_address, location_area, location_city, images, price_per_hour), teams!bookings_team_id_fkey(id, name, sport, max_players, invite_code)', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: bookings, count, error } = await query;
    if (error) throw error;

    const formatted = (bookings || []).map(b => {
      const turf = b.turfs;
      const team = b.teams;
      return formatBooking({
        ...b,
        turf_data: turf ? {
          _id: turf.id,
          name: turf.name,
          location: { address: turf.location_address, area: turf.location_area, city: turf.location_city },
          images: turf.images,
          pricePerHour: turf.price_per_hour,
        } : null,
        team_data: team || null,
        turfs: undefined,
        teams: undefined,
      });
    });

    res.json({ success: true, data: formatted, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/:id
export const getBooking = async (req, res) => {
  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, turfs(id, name, location_address, location_area, location_city, images, price_per_hour, amenities), users!bookings_user_id_fkey(id, name, email, phone), teams!bookings_team_id_fkey(id, name, sport, max_players, invite_code)')
      .eq('id', req.params.id)
      .single();

    if (error || !booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only allow owner or admin
    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const user = booking.users;
    const turf = booking.turfs;
    const team = booking.teams;

    const formatted = formatBooking({
      ...booking,
      user_data: user ? { _id: user.id, name: user.name, email: user.email, phone: user.phone } : null,
      turf_data: turf ? {
        _id: turf.id,
        name: turf.name,
        location: { address: turf.location_address, area: turf.location_area, city: turf.location_city },
        images: turf.images,
        pricePerHour: turf.price_per_hour,
        amenities: turf.amenities,
      } : null,
      team_data: team || null,
      users: undefined,
      turfs: undefined,
      teams: undefined,
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/bookings/:id/confirm - Confirm payment
export const confirmBooking = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment: {
          status: 'paid',
          method: 'online',
          transactionId: transactionId || `TXN${Date.now()}`,
          paidAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('*, turfs(id, name, location_address, location_area, location_city)')
      .single();

    if (error || !booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const turf = booking.turfs;
    const formatted = formatBooking({
      ...booking,
      turf_data: turf ? {
        _id: turf.id,
        name: turf.name,
        location: { address: turf.location_address, area: turf.location_area, city: turf.location_city },
      } : null,
      turfs: undefined,
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/bookings/:id - Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: reason,
        payment: { status: 'refunded', method: 'online', transactionId: '', paidAt: null },
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .in('status', ['pending', 'confirmed'])
      .select()
      .single();

    if (error || !booking) return res.status(404).json({ success: false, message: 'Booking not found or cannot be cancelled' });
    res.json({ success: true, message: 'Booking cancelled successfully', data: formatBooking(booking) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/admin/all - Admin: all bookings
export const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, startDate, endDate } = req.query;

    let query = supabase
      .from('bookings')
      .select('*, users!bookings_user_id_fkey(id, name, email), turfs(id, name, location_address, location_area, location_city)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: bookings, count, error } = await query;
    if (error) throw error;

    const formatted = (bookings || []).map(b => {
      const user = b.users;
      const turf = b.turfs;
      return formatBooking({
        ...b,
        user_data: user ? { _id: user.id, name: user.name, email: user.email } : null,
        turf_data: turf ? {
          _id: turf.id,
          name: turf.name,
          location: { address: turf.location_address, area: turf.location_area, city: turf.location_city },
        } : null,
        users: undefined,
        turfs: undefined,
      });
    });

    res.json({ success: true, data: formatted, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/admin/stats - Revenue & analytics
export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total revenue (paid bookings)
    const { data: paidBookings } = await supabase
      .from('bookings')
      .select('pricing, created_at, status')
      .eq('payment->>status', 'paid');

    const totalRevenue = (paidBookings || []).reduce((sum, b) => sum + (b.pricing?.finalPrice || 0), 0);

    // Monthly revenue
    const monthlyPaid = (paidBookings || []).filter(b => b.created_at >= startOfMonth);
    const monthlyRevenue = monthlyPaid.reduce((sum, b) => sum + (b.pricing?.finalPrice || 0), 0);

    // Total bookings count
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    // Active bookings
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed']);

    // Revenue by month (from paid bookings)
    const revenueByMonth = {};
    (paidBookings || []).forEach(b => {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!revenueByMonth[key]) revenueByMonth[key] = { _id: { month: d.getMonth() + 1, year: d.getFullYear() }, revenue: 0, bookings: 0 };
      revenueByMonth[key].revenue += b.pricing?.finalPrice || 0;
      revenueByMonth[key].bookings += 1;
    });

    // Peak vs Non-peak
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('pricing');

    const peakCount = (allBookings || []).filter(b => b.pricing?.isPeak).length;
    const nonPeakCount = (allBookings || []).filter(b => !b.pricing?.isPeak).length;

    res.json({
      success: true,
      data: {
        totalRevenue,
        monthlyRevenue,
        totalBookings: totalBookings || 0,
        activeBookings: activeBookings || 0,
        revenueByMonth: Object.values(revenueByMonth).sort((a, b) =>
          a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month
        ),
        peakStats: [
          { _id: true, count: peakCount },
          { _id: false, count: nonPeakCount },
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/owner/my-bookings
export const getOwnerBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('bookings')
      .select('*, users!bookings_user_id_fkey(id, name, email), turfs!inner(id, name, location_address, location_area, location_city, owner_id)', { count: 'exact' })
      .eq('turfs.owner_id', req.user.id)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: bookings, count, error } = await query;
    if (error) throw error;

    const formatted = (bookings || []).map(b => {
      const user = b.users;
      const turf = b.turfs;
      return formatBooking({
        ...b,
        user_data: user ? { _id: user.id, name: user.name, email: user.email } : null,
        turf_data: turf ? {
          _id: turf.id,
          name: turf.name,
          location: { address: turf.location_address, area: turf.location_area, city: turf.location_city }
        } : null,
        users: undefined,
        turfs: undefined,
      });
    });

    res.json({ success: true, data: formatted, pagination: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bookings/owner/stats
export const getOwnerStats = async (req, res) => {
  try {
    // 1. Fetch ALL bookings that belong to this owner's turfs
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, turfs!inner(owner_id)')
      .eq('turfs.owner_id', req.user.id);
      
    if (error) throw error;

    const totalBookings = bookings?.length || 0;
    const activeBookings = (bookings || []).filter(b => ['pending', 'confirmed'].includes(b.status)).length;
    
    // Revenue calculations
    const paidBookings = (bookings || []).filter(b => b.payment?.status === 'paid');
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.pricing?.finalPrice || 0), 0);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyPaid = paidBookings.filter(b => b.created_at >= startOfMonth);
    const monthlyRevenue = monthlyPaid.reduce((sum, b) => sum + (b.pricing?.finalPrice || 0), 0);

    // Month by month break down
    const revenueByMonth = {};
    paidBookings.forEach(b => {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!revenueByMonth[key]) revenueByMonth[key] = { _id: { month: d.getMonth() + 1, year: d.getFullYear() }, revenue: 0, bookings: 0 };
      revenueByMonth[key].revenue += b.pricing?.finalPrice || 0;
      revenueByMonth[key].bookings += 1;
    });

    const peakCount = (bookings || []).filter(b => b.pricing?.isPeak).length;
    const nonPeakCount = (bookings || []).filter(b => !b.pricing?.isPeak).length;

    res.json({
      success: true,
      data: {
        totalRevenue,
        monthlyRevenue,
        totalBookings,
        activeBookings,
        revenueByMonth: Object.values(revenueByMonth).sort((a, b) =>
          a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month
        ),
        peakStats: [
          { _id: true, count: peakCount },
          { _id: false, count: nonPeakCount },
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
