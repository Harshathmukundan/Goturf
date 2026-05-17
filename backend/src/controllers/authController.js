import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import supabase from '../lib/supabase.js';
import { createClient } from '@supabase/supabase-js';

const authSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Helper to format user for response (exclude password)
const formatUser = (user) => {
  const { password, location_city, location_area, is_verified, ...rest } = user;
  return {
    ...rest,
    isVerified: is_verified,
    location: { city: location_city, area: location_area },
  };
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, location, otpToken, method } = req.body;

    if (!otpToken) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }

    // Verify OTP first before checking/inserting anything
    let otpRes;
    const cleanEmail = email.toLowerCase().trim();
    
    if (method === 'phone') {
      // If method is phone, the 'email' field actually contains the phone string from frontend
      otpRes = await authSupabase.auth.verifyOtp({ phone: email, token: otpToken, type: 'sms' });
    } else {
      otpRes = await authSupabase.auth.verifyOtp({ email: cleanEmail, token: otpToken, type: 'email' });
    }

    if (otpRes.error) {
      return res.status(401).json({ success: false, message: otpRes.error.message });
    }

    // Check if email/phone already exists in our custom users table
    let query = supabase.from('users').select('id');
    if (method === 'phone') {
      query = query.eq('phone', email);
    } else {
      query = query.eq('email', cleanEmail);
    }

    const { data: existingUser } = await query.single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already configured. Please login.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: method === 'phone' ? `${email}@placeholder.goturf.com` : cleanEmail,
        password: hashedPassword,
        phone: method === 'phone' ? email : (phone || ''),
        location_city: location?.city || 'Chennai',
        location_area: location?.area || '',
        is_verified: true, // Officially verified by OTP
      })
      .select()
      .single();

    if (error) throw error;

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      isNewUser: true,
      user: formatUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanId = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${cleanId},phone.eq.${cleanId}`)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUser(user),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ success: true, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, location, password } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone;
    if (location?.city) updates.location_city = location.city;
    if (location?.area) updates.location_area = location.area;
    
    // Add password support directly from Profile Settings
    if (password && password.length > 3) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updates.password = hashedPassword;
    }

    updates.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/google
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Fetch user profile from Google using the access token
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!googleRes.ok) {
      throw new Error('Failed to fetch user profile from Google');
    }
    
    const payload = await googleRes.json();
    const { email, name, picture } = payload;
    
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // Auto-register new user from Google
      // Generate random password since they login via Google
      const randomPassword = Math.random().toString(36).slice(-10) + Date.now();
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          name: name || 'Google User',
          email: cleanEmail,
          password: hashedPassword,
          avatar: picture || '',
          location_city: 'Chennai', // default
          location_area: '',
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      user = newUser;
    }

    const jwtToken = generateToken(user.id);

    res.json({
      success: true,
      message: 'Google login successful',
      token: jwtToken,
      isNewUser,
      user: formatUser(user),
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
};
// POST /api/auth/send-otp
export const sendOtp = async (req, res) => {
  try {
    const { type, value } = req.body;
    
    let result;
    if (type === 'phone') {
      result = await authSupabase.auth.signInWithOtp({ phone: value });
    } else {
      result = await authSupabase.auth.signInWithOtp({ email: value });
    }

    if (result.error) {
      // If error contains "SMS provider is not configured", bubble it cleanly
      throw new Error(result.error.message);
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/auth/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, phone, role, created_at, is_verified, location_city, location_area')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/admin/users/:id/role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'turf_owner', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, name, email, role')
      .single();

    if (error) throw error;

    res.json({ success: true, message: `Role updated to ${role}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
