require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_missing';
const stripe = require('stripe')(stripeKey);
const sgMail = require('@sendgrid/mail');

const app = express();

// ─────────────────────────────────────────────────────────────
// SENDGRID SETUP
// Gmail SMTP Railway pe block karta hai (IPv6 + port restrictions)
// SendGrid HTTPS API use karta hai — Railway pe always works
// ─────────────────────────────────────────────────────────────
const SENDGRID_READY = !!process.env.SENDGRID_API_KEY;
if (SENDGRID_READY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid ready. Sending as:', process.env.EMAIL_USER || 'undefined');
} else {
  console.error('❌ SENDGRID_API_KEY missing! Add it to Railway/Env variables.');
}

const FROM_EMAIL  = process.env.EMAIL_USER;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ─────────────────────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.startsWith('http://localhost:')) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
      console.warn('[CORS] Blocked origin:', origin);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
);

// OPTIONS preflight are handled by the global CORS middleware above.

app.use(express.json());

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const safeId    = (id)    => id != null    ? String(id).slice(0, 8).toUpperCase() : 'N/A';
const safePrice = (price) => price != null ? Number(price).toLocaleString()       : '0';
const safeName  = (d)     => `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || 'Customer';

const buildItemsHtml = (items = []) =>
  items.map((item) => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
      <span style="color:#333;">
        ${item.title || 'Item'}
        ${item.selectedColor ? `<span style="color:#999;font-size:12px;"> (${item.selectedColor})</span>` : ''}
      </span>
      <span style="color:#333;font-weight:bold;">Rs. ${safePrice(item.price)}</span>
    </div>`
  ).join('');

const buildItemImagesHtml = (items = []) =>
  items.filter((i) => i.image).map((item) =>
    `<img src="${item.image}" alt="${item.title || ''}"
      style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:8px;" />`
  ).join('');

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Twistora Backend',
    sendgrid: !!process.env.SENDGRID_API_KEY,
    missingVars: ['SENDGRID_API_KEY', 'EMAIL_USER', 'ADMIN_EMAIL']
      .filter((k) => !process.env[k]),
  });
});

// ─────────────────────────────────────────────────────────────
// STRIPE
// ─────────────────────────────────────────────────────────────
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount),
      currency: 'pkr',
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('[create-payment-intent]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SEND ORDER EMAIL
// ─────────────────────────────────────────────────────────────
app.post('/send-order-email', async (req, res) => {
  const { order } = req.body;

  if (!order) {
    return res.status(400).json({ error: 'order object is required' });
  }
  if (!order.customerDetails?.email) {
    return res.status(400).json({ error: 'order.customerDetails.email is required' });
  }

  console.log('[send-order-email] order:', safeId(order.id), '->', order.customerDetails.email);

  if (!SENDGRID_READY || !FROM_EMAIL) {
    const msg = !SENDGRID_READY ? 'SENDGRID_API_KEY missing' : 'EMAIL_USER (from) is not configured';
    console.error('[send-order-email] configuration error:', msg);
    return res.status(503).json({ error: 'Email service not configured', detail: msg });
  }

  const paymentLabel =
    order.paymentMethod === 'cod'    ? 'Cash on Delivery' :
    order.paymentMethod === 'online' ? 'Card Payment'     :
    order.paymentMethod || '—';

  const deliveryLabel =
    order.deliveryFee === 0 || order.deliveryFee == null
      ? 'FREE'
      : `Rs. ${safePrice(order.deliveryFee)}`;

  let customerEmailSent = false;
  let adminEmailSent = false;
  const errors = [];

  // ── Customer email ──
  try {
    await sgMail.send({
      from: { name: 'Twistora', email: FROM_EMAIL },
      to: order.customerDetails.email,
      subject: `Order Confirmed! #${safeId(order.id)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#131921;padding:20px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;font-size:24px;letter-spacing:2px;">TWISTORA</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#333;">Order Confirmed! 🎉</h2>
            <p style="color:#666;">Hi ${order.customerDetails?.firstName || 'Customer'},<br>
            Your order has been placed successfully!</p>

            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#333;margin-top:0;">Order Details</h3>
              <p><strong>Order ID:</strong> #${safeId(order.id)}</p>
              <p><strong>Payment Method:</strong> ${paymentLabel}</p>
            </div>

            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#333;margin-top:0;">Items Ordered</h3>
              <div style="margin-bottom:12px;">${buildItemImagesHtml(order.items)}</div>
              ${buildItemsHtml(order.items)}
              <div style="display:flex;justify-content:space-between;padding:10px 0;">
                <span style="color:#333;">Delivery Fee</span>
                <span style="color:#333;">${deliveryLabel}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;">
                <strong style="color:#333;">Total</strong>
                <strong style="color:#333;">Rs. ${safePrice(order.total)}</strong>
              </div>
            </div>

            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#333;margin-top:0;">Delivery Address</h3>
              <p style="color:#666;margin:4px 0;">${order.customerDetails?.address || '—'}</p>
              <p style="color:#666;margin:4px 0;">${order.customerDetails?.city || ''} ${order.customerDetails?.postalCode || ''}</p>
              <p style="color:#666;margin:4px 0;">${order.customerDetails?.phone || '—'}</p>
            </div>

            <p style="color:#666;text-align:center;">
              Delivery within <strong>3-5 business days</strong>! 🚚
            </p>
          </div>
          <div style="background:#131921;padding:15px;text-align:center;">
            <p style="color:#999;margin:0;font-size:12px;">© 2024 Twistora. All rights reserved.</p>
          </div>
        </div>
      `,
    });
    customerEmailSent = true;
    console.log('[send-order-email] customer email sent ✅');
  } catch (error) {
    const msg = error?.response?.body?.errors?.[0]?.message || error.message;
    console.error('[send-order-email] customer email ❌', msg);
    errors.push(`Customer email: ${msg}`);
  }

  // ── Admin email ──
  try {
    if (!ADMIN_EMAIL) throw new Error('ADMIN_EMAIL not configured');

    await sgMail.send({
      from: { name: 'Twistora', email: FROM_EMAIL },
      to: ADMIN_EMAIL,
      subject: `New Order — #${safeId(order.id)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:#131921;padding:24px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;font-size:22px;letter-spacing:2px;">TWISTORA</h1>
          </div>
          <div style="padding:32px 24px;">
            <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Order #${safeId(order.id)}</p>
            <h2 style="color:#131921;margin:0 0 16px;">New Order Received</h2>

            <div style="background:#f9f9f9;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Customer</p>
              <p style="color:#333;margin:0 0 4px;font-size:14px;"><strong>Name:</strong> ${safeName(order.customerDetails)}</p>
              <p style="color:#333;margin:0 0 4px;font-size:14px;"><strong>Email:</strong> ${order.customerDetails?.email || '—'}</p>
              <p style="color:#333;margin:0 0 4px;font-size:14px;"><strong>Phone:</strong> ${order.customerDetails?.phone || '—'}</p>
              <p style="color:#333;margin:0;font-size:14px;"><strong>Address:</strong> ${order.customerDetails?.address || '—'}, ${order.customerDetails?.city || ''}</p>
            </div>

            <div style="background:#f9f9f9;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Items</p>
              <div style="margin-bottom:12px;">${buildItemImagesHtml(order.items)}</div>
              ${buildItemsHtml(order.items)}
              <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:8px;">
                <span><strong>Payment:</strong></span>
                <span>${paymentLabel}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;">
                <strong>Total</strong>
                <strong>Rs. ${safePrice(order.total)}</strong>
              </div>
            </div>
          </div>
          <div style="background:#131921;padding:16px;text-align:center;">
            <p style="color:#888;margin:0;font-size:11px;">© 2024 TWISTORA</p>
          </div>
        </div>
      `,
    });
    adminEmailSent = true;
    console.log('[send-order-email] admin email sent ✅');
  } catch (error) {
    const msg = error?.response?.body?.errors?.[0]?.message || error.message;
    console.error('[send-order-email] admin email ❌', msg);
    errors.push(`Admin email: ${msg}`);
  }

  // ── Response ──
  if (customerEmailSent && adminEmailSent) {
    res.status(200).json({ message: 'Emails sent successfully!' });
  } else if (customerEmailSent || adminEmailSent) {
    res.status(200).json({
      message: 'Partial success - some emails sent',
      customerEmailSent,
      adminEmailSent,
      errors
    });
  } else {
    res.status(500).json({
      error: 'Failed to send emails',
      errors
    });
  }
});

// ─────────────────────────────────────────────────────────────
// SEND STATUS UPDATE EMAIL
// ─────────────────────────────────────────────────────────────
app.post('/send-status-email', async (req, res) => {
  const { order, status } = req.body;

  if (!order?.customerDetails?.email) {
    return res.status(400).json({ error: 'order.customerDetails.email required' });
  }

  console.log('[send-status-email] order:', safeId(order.id), 'status:', status);

  const firstName = order.customerDetails?.firstName || 'Customer';

  const statusConfig = {
    pending: {
      subject: 'Your order is pending',
      headline: 'Thank you for your purchase!',
      message: `Hi ${firstName}, we're getting your order ready. We will notify you once it's packed.`,
      statusLine: 'Pending · Preparing your order',
    },
    processing: {
      subject: 'Order confirmed & being packed',
      headline: 'Order confirmed & being packed',
      message: `Hi ${firstName}, your order is confirmed and being packed. We'll notify you when shipped.`,
      statusLine: 'Confirmed · Being packed at our warehouse',
    },
    shipped: {
      subject: 'Your order is on the way! 🚚',
      headline: 'Your order is on the way!',
      message: `Hi ${firstName}, great news! Your order has been shipped and is on its way to you.`,
      statusLine: 'Shipped · With our courier partner',
    },
    delivered: {
      subject: 'Your order has been delivered ✅',
      headline: 'Your order has been delivered!',
      message: `Hi ${firstName}, your order has been delivered. We hope you love your Twistora jewellery!`,
      statusLine: 'Delivered · Enjoy your bracelets ✨',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  try {
    await sgMail.send({
      from: { name: 'Twistora', email: FROM_EMAIL },
      to: order.customerDetails.email,
      subject: `${config.subject} — Order #${safeId(order.id)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:#131921;padding:24px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;font-size:22px;letter-spacing:2px;">TWISTORA</h1>
          </div>
          <div style="padding:32px 24px;">
            <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Order #${safeId(order.id)}</p>
            <h2 style="color:#131921;margin:0 0 16px;">${config.headline}</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">${config.message}</p>

            <div style="background:#f9f9f9;padding:20px;margin-bottom:20px;">
              <p style="color:#131921;font-size:14px;font-weight:bold;margin:0 0 12px;">${order.items?.length || 0} item(s)</p>
              <div style="margin-bottom:12px;">${buildItemImagesHtml(order.items)}</div>
              ${buildItemsHtml(order.items)}
            </div>

            <div style="background:#f9f9f9;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Status</p>
              <p style="color:#131921;font-size:14px;font-weight:bold;margin:0;">${config.statusLine}</p>
            </div>

            <div style="background:#f9f9f9;padding:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Order Number</p>
              <p style="color:#131921;font-size:16px;font-weight:bold;margin:0;">#${safeId(order.id)}</p>
            </div>
          </div>
          <div style="background:#131921;padding:16px;text-align:center;">
            <p style="color:#888;margin:0;font-size:11px;">© 2024 TWISTORA. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      `,
    });

    console.log('[send-status-email] sent ✅ to:', order.customerDetails.email);
    res.status(200).json({ message: 'Status email sent!' });

  } catch (error) {
    const msg = error?.response?.body?.errors?.[0]?.message || error.message;
    console.error('[send-status-email] ❌', msg);
    res.status(500).json({ error: msg });
  }
});

// ─────────────────────────────────────────────────────────────
// SEND PAYMENT VERIFICATION EMAIL
// ─────────────────────────────────────────────────────────────
app.post('/send-verification-email', async (req, res) => {
  const { email, name, orderId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  console.log('[send-verification-email] order:', safeId(orderId), '->', email);

  try {
    await sgMail.send({
      from: { name: 'Twistora', email: FROM_EMAIL },
      to: email,
      subject: `Payment Verified! Order #${safeId(orderId)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#131921;padding:20px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;">TWISTORA</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#333;">Payment Verified! ✅</h2>
            <p style="color:#666;">Hi ${name || 'Customer'},</p>
            <p style="color:#666;">Your payment has been successfully verified. Your order is now being processed.</p>
            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;">
              <p><strong>Order ID:</strong> #${safeId(orderId)}</p>
              <p><strong>Status:</strong> Payment Verified ✅</p>
            </div>
            <p style="color:#666;text-align:center;">
              Delivery within <strong>3-5 business days</strong>! 🚚
            </p>
          </div>
          <div style="background:#131921;padding:15px;text-align:center;">
            <p style="color:#999;margin:0;font-size:12px;">© 2024 Twistora. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log('[send-verification-email] sent ✅ to:', email);
    res.status(200).json({ message: 'Verification email sent!' });

  } catch (error) {
    const msg = error?.response?.body?.errors?.[0]?.message || error.message;
    console.error('[send-verification-email] ❌', msg);
    res.status(500).json({ error: msg });
  }
});

// ─────────────────────────────────────────────────────────────
// SEND CONTACT EMAIL
// ─────────────────────────────────────────────────────────────
app.post('/send-contact-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'email and message are required' });
  }

  try {
    await sgMail.send({
      from: { name: 'Twistora', email: FROM_EMAIL },
      to: ADMIN_EMAIL,
      subject: `New Contact Message: ${subject || 'No Subject'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#131921;padding:20px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;">TWISTORA</h1>
          </div>
          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#333;">New Contact Message</h2>
            <p><strong>Name:</strong> ${name || '—'}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || '—'}</p>
            <p><strong>Message:</strong></p>
            <p style="background:white;padding:15px;border-left:3px solid #f3a847;">${message}</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({ message: 'Email sent!' });
  } catch (error) {
    const msg = error?.response?.body?.errors?.[0]?.message || error.message;
    console.error('[send-contact-email] ❌', msg);
    res.status(500).json({ error: msg });
  }
});

// ─────────────────────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────
// START
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4242;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () =>
  console.log(`✅ Twistora server running on ${HOST}:${PORT}`)
);
