import supabase from '../lib/supabase.js';

// Helper to format team for response
const formatTeam = (team, members = [], captain = null) => {
  if (!team) return null;
  return {
    _id: team.id,
    name: team.name,
    captain: captain ? { _id: captain.id, name: captain.name, email: captain.email, avatar: captain.avatar } : team.captain_id,
    booking: team.booking_data || team.booking_id,
    sport: team.sport,
    maxPlayers: team.max_players,
    members: members.map(m => ({
      _id: m.id,
      user: m.user_data || m.user_id,
      email: m.email,
      name: m.name,
      status: m.status,
      invitedAt: m.invited_at,
      respondedAt: m.responded_at,
    })),
    inviteCode: team.invite_code,
    isComplete: team.is_complete,
    createdAt: team.created_at,
    updatedAt: team.updated_at,
  };
};

// Generate invite code
const generateInviteCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

// POST /api/teams - Create team for a booking
export const createTeam = async (req, res) => {
  try {
    const { name, bookingId, sport, maxPlayers = 6, invitees = [] } = req.body;

    // Verify booking belongs to user
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .eq('user_id', req.user.id)
      .single();

    if (bErr || !booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Create team
    const inviteCode = generateInviteCode();
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        name,
        captain_id: req.user.id,
        booking_id: bookingId,
        sport,
        max_players: maxPlayers,
        invite_code: inviteCode,
        is_complete: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert members
    if (invitees.length > 0) {
      const memberRows = invitees.map(email => ({
        team_id: team.id,
        email,
        name: email.split('@')[0],
        status: 'pending',
      }));
      await supabase.from('team_members').insert(memberRows);
    }

    // Link team to booking
    await supabase.from('bookings').update({ team_id: team.id }).eq('id', bookingId);

    // Fetch captain info for response
    const { data: captain } = await supabase
      .from('users')
      .select('id, name, email, avatar')
      .eq('id', req.user.id)
      .single();

    // Fetch members
    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id);

    res.status(201).json({ success: true, data: formatTeam(team, members || [], captain) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/teams/:id
export const getTeam = async (req, res) => {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Get captain
    const { data: captain } = await supabase
      .from('users')
      .select('id, name, email, avatar')
      .eq('id', team.captain_id)
      .single();

    // Get booking
    let bookingData = null;
    if (team.booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', team.booking_id)
        .single();
      bookingData = booking;
    }

    // Get members with user data
    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id);

    // For members that have user_id, fetch user info
    const membersWithUser = await Promise.all(
      (members || []).map(async (m) => {
        if (m.user_id) {
          const { data: user } = await supabase
            .from('users')
            .select('id, name, email, avatar')
            .eq('id', m.user_id)
            .single();
          return { ...m, user_data: user ? { _id: user.id, name: user.name, email: user.email, avatar: user.avatar } : null };
        }
        return m;
      })
    );

    res.json({ success: true, data: formatTeam({ ...team, booking_data: bookingData }, membersWithUser, captain) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/teams/invite/:code - Get team by invite code
export const getTeamByInviteCode = async (req, res) => {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('invite_code', req.params.code)
      .single();

    if (error || !team) return res.status(404).json({ success: false, message: 'Invalid invite code' });

    // Get captain
    const { data: captain } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', team.captain_id)
      .single();

    // Get booking
    let bookingData = null;
    if (team.booking_id) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', team.booking_id)
        .single();
      bookingData = booking;
    }

    // Get members
    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id);

    res.json({ success: true, data: formatTeam({ ...team, booking_data: bookingData }, members || [], captain) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/teams/:id/invite - Add member to team
export const inviteMember = async (req, res) => {
  try {
    const { email } = req.body;

    // Verify team ownership
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('*')
      .eq('id', req.params.id)
      .eq('captain_id', req.user.id)
      .single();

    if (teamErr || !team) return res.status(404).json({ success: false, message: 'Team not found or unauthorized' });

    // Check member count
    const { count } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', team.id);

    if ((count || 0) + 1 >= team.max_players) {
      return res.status(400).json({ success: false, message: 'Team is full' });
    }

    // Check if already invited
    const { data: existing } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team.id)
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: 'Player already invited' });
    }

    // Add member
    await supabase.from('team_members').insert({
      team_id: team.id,
      email,
      name: email.split('@')[0],
      status: 'pending',
    });

    // Return updated team
    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id);

    const { data: captain } = await supabase
      .from('users')
      .select('id, name, email, avatar')
      .eq('id', team.captain_id)
      .single();

    res.json({ success: true, data: formatTeam(team, members || [], captain) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/teams/:id/respond - Accept or decline invite
export const respondToInvite = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' | 'declined'

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', req.user.id)
      .single();

    // Find and update the member record
    const { data: member, error: memberErr } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', req.params.id)
      .eq('email', user.email)
      .single();

    if (memberErr || !member) {
      return res.status(404).json({ success: false, message: 'Team or invite not found' });
    }

    await supabase
      .from('team_members')
      .update({
        status,
        user_id: user.id,
        name: user.name,
        responded_at: new Date().toISOString(),
      })
      .eq('id', member.id);

    // Check if team is complete
    const { data: allMembers } = await supabase
      .from('team_members')
      .select('status')
      .eq('team_id', req.params.id);

    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('id', req.params.id)
      .single();

    const acceptedCount = (allMembers || []).filter(m => m.status === 'accepted').length;
    const isComplete = acceptedCount + 1 >= (team?.max_players || 6); // +1 for captain

    await supabase
      .from('teams')
      .update({ is_complete: isComplete, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    // Get updated members
    const { data: updatedMembers } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', req.params.id);

    const { data: captain } = await supabase
      .from('users')
      .select('id, name, email, avatar')
      .eq('id', team.captain_id)
      .single();

    res.json({
      success: true,
      data: formatTeam({ ...team, is_complete: isComplete }, updatedMembers || [], captain),
      message: `Invite ${status}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
