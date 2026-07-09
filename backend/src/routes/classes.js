const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const squareClient = require('../config/square');
const router = express.Router();

const MAX_SEATS = 10;

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString('en-AU', {
      timeZone: 'Australia/Melbourne',
      weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return new Date(d).toISOString();
  }
}

async function sendBookingEmail(booking, session) {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'noreply@flipsidedigital.site',
        to: booking.email,
        subject: `You're booked — ${session.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <img src="https://rafael-coffee-subscriptions.vercel.app/Rafaels_Coffee_logo-with-ESB.png" alt="Rafael's Coffee" style="height: 60px; margin-bottom: 24px;" />
            <h2 style="font-size: 22px; color: #262626;">See you soon, ${booking.name}!</h2>
            <p style="color: #555; line-height: 1.6;">Your booking for <strong>${session.title}</strong> is confirmed.</p>
            <div style="background:#faf7f2; border:1px solid #eee; border-radius:8px; padding:16px 20px; margin:20px 0; color:#402020;">
              <p style="margin:0 0 6px;"><strong>When:</strong> ${fmtDate(session.starts_at)}</p>
              <p style="margin:0 0 6px;"><strong>Seats:</strong> ${booking.seats}</p>
              <p style="margin:0;"><strong>Paid:</strong> $${(booking.amount_cents / 100).toFixed(2)}</p>
            </div>
            <p style="color:#555; line-height:1.6;">Held at our Lancefield roastery. Reply to this email if you need to change anything.</p>
            <hr style="border:none; border-top:1px solid #eee; margin:24px 0;" />
            <p style="color:#bbb; font-size:12px;">Rafael's Coffee · Lancefield, Victoria</p>
          </div>`,
      }),
    });
  } catch (err) {
    console.error('Booking email error:', err.message);
  }
}

// GET /api/classes — upcoming active sessions with seats remaining
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, COALESCE(SUM(b.seats), 0)::int AS booked
      FROM class_sessions s
      LEFT JOIN class_bookings b ON b.session_id = s.id AND b.status = 'confirmed'
      WHERE s.active = TRUE AND s.starts_at > NOW()
      GROUP BY s.id
      ORDER BY s.starts_at ASC`);
    res.json(result.rows.map((r) => ({ ...r, seats_remaining: Math.max(0, r.capacity - r.booked) })));
  } catch (err) {
    console.error('Classes list error:', err);
    res.status(500).json({ error: 'Failed to load classes' });
  }
});

// POST /api/classes/book — public booking + Square payment + confirmation email
router.post('/book', async (req, res) => {
  const { session_id, name, email, phone, seats, card_token } = req.body || {};
  const n = parseInt(seats, 10) || 1;
  if (!session_id || !name || !email || !card_token) return res.status(400).json({ error: 'Missing booking details' });
  if (n < 1 || n > MAX_SEATS) return res.status(400).json({ error: 'Invalid number of seats' });

  try {
    const sres = await db.query(`
      SELECT s.*, COALESCE(SUM(b.seats), 0)::int AS booked
      FROM class_sessions s
      LEFT JOIN class_bookings b ON b.session_id = s.id AND b.status = 'confirmed'
      WHERE s.id = $1 AND s.active = TRUE GROUP BY s.id`, [session_id]);
    const session = sres.rows[0];
    if (!session) return res.status(404).json({ error: 'Class not found' });
    if (new Date(session.starts_at) < new Date()) return res.status(400).json({ error: 'This class has already run' });
    const remaining = session.capacity - session.booked;
    if (n > remaining) return res.status(400).json({ error: `Only ${remaining} seat(s) left for this class` });

    const amount_cents = session.price_cents * n;

    let paymentId = null;
    try {
      const { result } = await squareClient.paymentsApi.createPayment({
        sourceId: card_token,
        idempotencyKey: uuidv4(),
        amountMoney: { amount: BigInt(amount_cents), currency: 'AUD' },
        note: `Class: ${session.title}`,
      });
      paymentId = result?.payment?.id || null;
    } catch (err) {
      const m = err?.result?.errors?.map((e) => e.detail || e.code).join(', ');
      console.error('Class payment error:', m || err.message);
      return res.status(402).json({ error: m || 'Payment could not be processed. Please check your card and try again.' });
    }

    let bookingId = null;
    try {
      const ins = await db.query(
        `INSERT INTO class_bookings (session_id, name, email, phone, seats, amount_cents, square_payment_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed') RETURNING id`,
        [session_id, name, email, phone || null, n, amount_cents, paymentId]
      );
      bookingId = ins.rows[0].id;
    } catch (err) {
      console.error('Booking insert failed after payment:', err.message, paymentId);
    }

    sendBookingEmail({ name, email, seats: n, amount_cents }, session);

    res.json({ booking_id: bookingId, title: session.title, starts_at: session.starts_at, seats: n, amount_cents, email, name });
  } catch (err) {
    console.error('Class booking error:', err);
    res.status(500).json({ error: 'Booking failed. Please try again.' });
  }
});

module.exports = router;
