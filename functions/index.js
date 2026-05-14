require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app = express();

// ─────────────────────────────────────────────────────────────
// BUG 1 FIX — CORS
// Problem:  Frontend Railway URL aur koi bhi future domain block
//           ho jata tha kyunki sirf 2 hardcoded origins the.
//           Jab browser preflight (OPTIONS) request bhejta hai
//           aur origin allowed list mein nahi hoti → 500/CORS error.
// Fix:      Saare common origins add kiye + Railway wildcard +
//           credentials support. Agar aap custom domain use
//           karte hain to woh bhi yahan add karein.
// ─────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://twistora.vercel.app',
  // Railway pe jo bhi URL ho — env variable se aata hai
  process.env.FRONTEND_URL,
].filter(Boolean); // undefined entries hata do

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('[CORS] Blocked origin:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// OPTIONS preflight — cors() middleware automatically handle karta hai
// Note: app.options('*') hata diya — path-to-regexp version conflict se crash hota tha

app.use(express.json());

// ─────────────────────────────────────────────────────────────
// BUG 2 FIX — ENV VARIABLES CHECK ON STARTUP
// Problem:  Railway pe EMAIL_PASS ya ADMIN_EMAIL set na ho to
//           transporter silently fail karta aur 500 aata.
// Fix:      Startup pe required vars check karo aur clearly log karo.
// ─────────────────────────────────────────────────────────────
const REQUIRED_ENV = ['EMAIL_USER', 'EMAIL_PASS', 'ADMIN_EMAIL'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(
    '❌ MISSING ENVIRONMENT VARIABLES on Railway:',
    missingEnv.join(', ')
  );
  console.error('Set these in Railway → Variables tab, then redeploy.');
  // Crash nahi karte — server chalta rahe lekin emails fail honge with clear message
}

// ─────────────────────────────────────────────────────────────
// BUG 3 FIX — GMAIL APP PASSWORD / TRANSPORTER CONFIG
// Problem:  Gmail ne 2FA enable hone ke baad regular passwords
//           block kar diye. "App Password" ka format bhi important
//           hai — spaces nahi hone chahiye.
// Fix:      Spaces strip karo, aur 'gmail' service ki jagah explicit
//           SMTP host/port use karo jo Railway pe reliable hai.
// ─────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,        // Railway port 465 block karta hai, 587 use karo
  secure: false,    // 587 ke liye false (STARTTLS), 465 ke liye true hota
  requireTLS: true, // Force TLS upgrade
  family: 4,        // CRITICAL: IPv4 force — Railway IPv6 block karta hai
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// Verify on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter FAILED:', error.message);
    console.error(
      'Check: (1) EMAIL_USER correct? (2) EMAIL_PASS is Gmail App Password (not regular password)? (3) 2FA enabled on Gmail account?'
    );
  } else {
    console.log('✅ Email transporter ready. Sending as:', process.env.EMAIL_USER);
  }
});

// ─────────────────────────────────────────────────────────────
// HELPER — safe string operations
// ─────────────────────────────────────────────────────────────

// BUG 4 FIX: order.id ya koi bhi field undefined ho sakti hai
// Har jagah .slice() direct call karna crash karta tha
const safeId = (id) => (id ? String(id).slice(0, 8).toUpperCase() : 'N/A');
const safePrice = (price) =>
  price != null ? Number(price).toLocaleString() : '0';
const safeName = (details) =>
  `${details?.firstName || ''} ${details?.lastName || ''}`.trim() || 'Customer';

// ─────────────────────────────────────────────────────────────
// ROUTE: Health check — Railway deployment verify ke liye
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Twistora Backend',
    emailReady: !missingEnv.includes('EMAIL_USER'),
    missingEnv: missingEnv.length > 0 ? missingEnv : 'none',
  });
});

// ─────────────────────────────────────────────────────────────
// ROUTE: Stripe payment intent
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
    console.error('[create-payment-intent] error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: Send order confirmation email
// ─────────────────────────────────────────────────────────────
app.post('/send-order-email', async (req, res) => {
  const { order } = req.body;

  // BUG 4 FIX: Validate required fields before doing ANYTHING
  // Pehle crash hota tha kyunki order.id ya order.customerDetails
  // undefined hoti thi aur .slice() / .email directly call hota tha
  if (!order) {
    return res.status(400).json({ error: 'order object is required' });
  }
  if (!order.customerDetails?.email) {
    return res
      .status(400)
      .json({ error: 'order.customerDetails.email is required' });
  }

  console.log(
    '[send-order-email] order:', safeId(order.id),
    '→', order.customerDetails.email
  );

  // BUG 4 FIX: Safe item HTML — price/title undefined se crash avoid
  const buildItemsHtml = (items = []) =>
    items
      .map(
        (item) => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
          <span style="color:#333;">${item.title || 'Item'}${item.selectedColor ? ` <span style="color:#999;font-size:12px;">(${item.selectedColor})</span>` : ''}</span>
          <span style="color:#333;font-weight:bold;">Rs. ${safePrice(item.price)}</span>
        </div>`
      )
      .join('');

  const buildItemImagesHtml = (items = []) =>
    items
      .filter((item) => item.image)
      .map(
        (item) =>
          `<img src="${item.image}" alt="${item.title || ''}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:8px;" />`
      )
      .join('');

  try {
    // ── Customer email ──
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: order.customerDetails.email,
      subject: `Order Confirmed! #${safeId(order.id)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">

          <div style="background:#131921;padding:20px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;">Twistora</h1>
          </div>

          <div style="padding:30px;background:#f9f9f9;">
            <h2 style="color:#333;">Order Confirmed! 🎉</h2>
            <p style="color:#666;">Hi ${order.customerDetails?.firstName || 'Customer'}, your order has been placed successfully!</p>

            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#333;margin-top:0;">Order Details</h3>
              <p><strong>Order ID:</strong> #${safeId(order.id)}</p>
              <p><strong>Payment Method:</strong> ${
                order.paymentMethod === 'cod'
                  ? 'Cash on Delivery'
                  : order.paymentMethod === 'online'
                  ? 'Card Payment'
                  : order.paymentMethod || '—'
              }</p>
            </div>

            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#333;margin-top:0;">Items Ordered</h3>
              <div style="margin-bottom:12px;">${buildItemImagesHtml(order.items)}</div>
              ${buildItemsHtml(order.items)}
              <div style="display:flex;justify-content:space-between;padding:10px 0;">
                <span style="color:#333;">Delivery Fee</span>
                <span style="color:#333;">${
                  order.deliveryFee === 0 || order.deliveryFee == null
                    ? 'FREE'
                    : `Rs. ${safePrice(order.deliveryFee)}`
                }</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;">
                <strong style="color:#333;">Total</strong>
                <strong style="color:#333;">Rs. ${safePrice(order.total)}</strong>
              </div>
            </div>

            <div style="background:white;border-radius:8px;padding:20px;margin:20px 0;">
              <h3 style="color:#333;margin-top:0;">Delivery Address</h3>
              <p style="color:#666;margin:0;">${order.customerDetails?.address || '—'}</p>
              <p style="color:#666;margin:0;">${order.customerDetails?.city || ''} ${order.customerDetails?.postalCode || ''}</p>
              <p style="color:#666;margin:0;">${order.customerDetails?.phone || '—'}</p>
            </div>

            <p style="color:#666;text-align:center;">
              Your order will be delivered within <strong>3-5 business days</strong>! 🚚
            </p>
          </div>

          <div style="background:#131921;padding:15px;text-align:center;">
            <p style="color:#999;margin:0;font-size:12px;">© 2024 Twistora. All rights reserved.</p>
          </div>

        </div>
      `,
    });
    console.log('[send-order-email] customer email sent ✅');

    // ── Admin email ──
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Received — #${safeId(order.id)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">

          <div style="background:#131921;padding:24px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;font-size:22px;letter-spacing:2px;text-transform:uppercase;">Twistora</h1>
          </div>

          <div style="padding:32px 24px;">
            <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Order #${safeId(order.id)}</p>
            <h2 style="color:#131921;margin:0 0 16px;font-size:26px;">New Order Received</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">A new order has been placed. Please review the details below.</p>

            <div style="background:#f9f9f9;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Customer Details</p>
              <p style="color:#333;margin:0 0 4px;font-size:14px;"><strong>Name:</strong> ${safeName(order.customerDetails)}</p>
              <p style="color:#333;margin:0 0 4px;font-size:14px;"><strong>Email:</strong> ${order.customerDetails?.email || '—'}</p>
              <p style="color:#333;margin:0 0 4px;font-size:14px;"><strong>Phone:</strong> ${order.customerDetails?.phone || '—'}</p>
              <p style="color:#333;margin:0;font-size:14px;"><strong>Address:</strong> ${order.customerDetails?.address || '—'}, ${order.customerDetails?.city || ''}</p>
            </div>

            <div style="background:#f9f9f9;padding:20px;margin-bottom:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Order Items</p>
              <div style="margin-bottom:12px;">${buildItemImagesHtml(order.items)}</div>
              ${buildItemsHtml(order.items)}
              <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:8px;">
                <span style="color:#333;"><strong>Payment:</strong></span>
                <span style="color:#333;">${
                  order.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : order.paymentMethod === 'online'
                    ? 'Card Payment'
                    : order.paymentMethod || '—'
                }</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #333;">
                <strong style="color:#333;">Total</strong>
                <strong style="color:#333;">Rs. ${safePrice(order.total)}</strong>
              </div>
            </div>

            <div style="background:#f9f9f9;padding:20px;">
              <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Order ID</p>
              <p style="color:#131921;font-size:16px;font-weight:bold;margin:0;">#${safeId(order.id)}</p>
            </div>
          </div>

          <div style="background:#131921;padding:16px;text-align:center;">
            <p style="color:#888;margin:0;font-size:11px;letter-spacing:1px;">© 2024 TWISTORA. ALL RIGHTS RESERVED.</p>
          </div>

        </div>
      `,
    });
    console.log('[send-order-email] admin email sent ✅');

    res.status(200).json({ message: 'Emails sent successfully!' });

  } catch (error) {
    console.error('[send-order-email] ❌ error:', error.message);
    // Detailed error response taake frontend mein exact reason dikhay
    res.status(500).json({
      error: error.message,
      hint: error.message.includes('auth')
        ? 'Gmail App Password wrong hai. Railway Variables mein EMAIL_PASS check karo — spaces nahi hone chahiye.'
        : error.message.includes('ECONNREFUSED') || error.message.includes('timeout')
        ? 'Railway se Gmail SMTP connect nahi ho raha. Port 465 try karo.'
        : 'Server logs check karo Railway dashboard mein.',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: Send order status update email
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
      message: `Hi ${firstName}, we're getting your order ready. We will notify you once it's packed and handed to our courier.`,
      statusLine: 'Pending · Preparing your order',
    },
    processing: {
      subject: 'Order confirmed & being packed',
      headline: 'Order confirmed & being packed',
      message: `Hi ${firstName}, your order has been confirmed and is being packed. We'll notify you once it's shipped.`,
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

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #eee;">
        <span style="color:#333;">${item.title || 'Item'}${item.selectedColor ? ` (${item.selectedColor})` : ''}</span>
        <span style="color:#333;font-weight:bold;">Rs. ${safePrice(item.price)}</span>
      </div>`
    )
    .join('');

  const itemImagesHtml = (order.items || [])
    .filter((item) => item.image)
    .map(
      (item) =>
        `<img src="${item.image}" alt="" style="width:50px;height:50px;object-fit:cover;border-radius:4px;margin-right:8px;" />`
    )
    .join('');

  try {
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: order.customerDetails.email,
      subject: `${config.subject} — Order #${safeId(order.id)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">

          <div style="background:#131921;padding:24px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;font-size:22px;letter-spacing:2px;text-transform:uppercase;">Twistora</h1>
          </div>

          <div style="padding:32px 24px;">
            <p style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Order #${safeId(order.id)}</p>
            <h2 style="color:#131921;margin:0 0 16px;font-size:26px;">${config.headline}</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">${config.message}</p>

            <div style="background:#f9f9f9;padding:20px;margin-bottom:20px;">
              <p style="color:#131921;font-size:14px;font-weight:bold;margin:0 0 12px;">${order.items?.length || 0} item(s)</p>
              <div style="margin-bottom:12px;">${itemImagesHtml}</div>
              ${itemsHtml}
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
            <p style="color:#888;margin:0;font-size:11px;letter-spacing:1px;">© 2024 TWISTORA. ALL RIGHTS RESERVED.</p>
          </div>

        </div>
      `,
    });

    console.log('[send-status-email] sent ✅ to:', order.customerDetails.email);
    res.status(200).json({ message: 'Status email sent!' });

  } catch (error) {
    console.error('[send-status-email] ❌ error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: Payment verification email
// ─────────────────────────────────────────────────────────────
app.post('/send-verification-email', async (req, res) => {
  const { email, name, orderId } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  console.log('[send-verification-email] order:', safeId(orderId), '→', email);

  try {
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Payment Verified! Order #${safeId(orderId)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#131921;padding:20px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;">Twistora</h1>
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
              Your order will be delivered within <strong>3-5 business days</strong>! 🚚
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
    console.error('[send-verification-email] ❌ error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ROUTE: Contact form email
// ─────────────────────────────────────────────────────────────
app.post('/send-contact-email', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'email and message are required' });
  }

  try {
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Message: ${subject || 'No Subject'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#131921;padding:20px;text-align:center;">
            <h1 style="color:#f3a847;margin:0;">Twistora</h1>
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
  } catch (err) {
    console.error('[send-contact-email] ❌ error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// START SERVER
// Railway automatically assigns PORT env variable
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4242;
app.listen(PORT, () =>
  console.log(`✅ Twistora server running on port ${PORT}`)
);
