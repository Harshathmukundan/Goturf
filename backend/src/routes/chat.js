import express from 'express';
import supabase from '../lib/supabase.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/chat/:chatRoomId/messages
router.get('/:chatRoomId/messages', async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, users:sender_id(name, avatar)')
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    // Format and reverse (oldest first)
    const formatted = (messages || []).reverse().map(m => ({
      _id: m.id,
      chatRoomId: m.chat_room_id,
      booking: m.booking_id,
      sender: m.users ? { _id: m.sender_id, name: m.users.name, avatar: m.users.avatar } : m.sender_id,
      senderName: m.sender_name,
      senderAvatar: m.sender_avatar,
      message: m.message,
      type: m.type,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/chat/:chatRoomId/messages
router.post('/:chatRoomId/messages', async (req, res) => {
  try {
    const { chatRoomId } = req.params;
    const { message } = req.body;

    // Verify user has access to this chat room
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id')
      .eq('chat_room_id', chatRoomId)
      .single();

    if (bErr || !booking) {
      return res.status(404).json({ success: false, message: 'Chat room not found' });
    }

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        booking_id: booking.id,
        sender_id: req.user.id,
        sender_name: req.user.name,
        sender_avatar: req.user.avatar || '',
        message,
      })
      .select('*, users:sender_id(name, avatar)')
      .single();

    if (error) throw error;

    const formatted = {
      _id: newMessage.id,
      chatRoomId: newMessage.chat_room_id,
      booking: newMessage.booking_id,
      sender: newMessage.users ? { _id: newMessage.sender_id, name: newMessage.users.name, avatar: newMessage.users.avatar } : newMessage.sender_id,
      senderName: newMessage.sender_name,
      senderAvatar: newMessage.sender_avatar,
      message: newMessage.message,
      type: newMessage.type,
      createdAt: newMessage.created_at,
      updatedAt: newMessage.updated_at,
    };

    res.status(201).json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
