require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'] }));
app.use(express.json());

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error.message);
  } else {
    console.log('Email transporter ready. EMAIL_USER:', process.env.EMAIL_USER);
  }
});

// Stripe payment intent
app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'pkr',
    });
    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send order email
app.post('/send-order-email', async (req, res) => {
  const { order } = req.body;
  console.log('[send-order-email] received for order:', order?.id, 'to:', order?.customerDetails?.email);

  try {
    // User ko email
    console.log('[send-order-email] sending user email to:', order.customerDetails.email);
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: order.customerDetails.email,
      subject: `Order Confirmed! #${order.id.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          
          <div style="background: #131921; padding: 20px; text-align: center;">
            <h1 style="color: #f3a847; margin: 0;">Twistora</h1>
          </div>

          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Order Confirmed! 🎉</h2>
            <p style="color: #666;">Hi ${order.customerDetails.firstName}, your order has been placed successfully!</p>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}</p>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Items Ordered</h3>
              ${order.items.map(item => `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #333;">${item.title}</span>
                  <span style="color: #333; font-weight: bold;">Rs. ${item.price.toLocaleString()}</span>
                </div>
              `).join('')}
              <div style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 8px;">
                <span style="color: #333;">Delivery Fee</span>
                <span style="color: #333;">${order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #333;">
                <strong style="color: #333;">Total</strong>
                <strong style="color: #333;">Rs. ${order.total.toLocaleString()}</strong>
              </div>
            </div>

            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Delivery Address</h3>
              <p style="color: #666; margin: 0;">${order.customerDetails.address}</p>
              <p style="color: #666; margin: 0;">${order.customerDetails.city} ${order.customerDetails.postalCode}</p>
              <p style="color: #666; margin: 0;">${order.customerDetails.phone}</p>
            </div>

            <p style="color: #666; text-align: center;">
              Your order will be delivered within <strong>3-5 business days</strong>! 🚚
            </p>
          </div>

          <div style="background: #131921; padding: 15px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Twistora. All rights reserved.</p>
          </div>

        </div>
      `,
    });

    // Admin ko email
    const adminItemsHtml = order.items?.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
        <span style="color: #333;">${item.title}</span>
        <span style="color: #333; font-weight: bold;">Rs. ${item.price?.toLocaleString()}</span>
      </div>
    `).join('') || '';

    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Received — #${order.id.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">

          <div style="background: #131921; padding: 24px; text-align: center;">
            <h1 style="color: #f3a847; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">Twistora</h1>
          </div>

          <div style="padding: 32px 24px; background: #ffffff;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Order #${order.id.slice(0, 8).toUpperCase()}</p>
            <h2 style="color: #131921; margin: 0 0 16px; font-size: 26px; line-height: 1.3;">New Order Received</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">A new order has been placed. Please review the details below.</p>

            <div style="background: #f9f9f9; padding: 20px; margin-bottom: 20px;">
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Customer Details</p>
              <p style="color: #333; margin: 0 0 4px; font-size: 14px;"><strong>Name:</strong> ${order.customerDetails?.firstName || ''} ${order.customerDetails?.lastName || ''}</p>
              <p style="color: #333; margin: 0 0 4px; font-size: 14px;"><strong>Email:</strong> ${order.customerDetails?.email || ''}</p>
              <p style="color: #333; margin: 0 0 4px; font-size: 14px;"><strong>Phone:</strong> ${order.customerDetails?.phone || ''}</p>
              <p style="color: #333; margin: 0; font-size: 14px;"><strong>Address:</strong> ${order.customerDetails?.address || ''}, ${order.customerDetails?.city || ''}</p>
            </div>

            <div style="background: #f9f9f9; padding: 20px; margin-bottom: 20px;">
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Order Details</p>
              <p style="color: #333; margin: 0 0 4px; font-size: 14px;"><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'online' ? 'Card Payment' : order.paymentMethod || '—'}</p>
              <p style="color: #333; margin: 0 0 12px; font-size: 14px;"><strong>Total:</strong> Rs. ${order.total?.toLocaleString()}</p>
              ${adminItemsHtml}
            </div>

            <div style="background: #f9f9f9; padding: 20px;">
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Order number</p>
              <p style="color: #131921; font-size: 16px; font-weight: bold; margin: 0;">${order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div style="background: #131921; padding: 16px; text-align: center;">
            <p style="color: #888; margin: 0; font-size: 11px; letter-spacing: 1px;">© 2024 TWISTORA. ALL RIGHTS RESERVED.</p>
          </div>

        </div>
      `,
    });

    console.log('[send-order-email] admin email sent');
    res.status(200).json({ message: 'Emails sent successfully!' });

  } catch (error) {
    console.error('[send-order-email] error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Send status update email
app.post('/send-status-email', async (req, res) => {
  const { order, status } = req.body;
  console.log('[send-status-email] received for order:', order?.id, 'status:', status, 'to:', order?.customerDetails?.email);

  const statusConfig = {
    pending: {
      subject: 'Your order is pending',
      headline: 'Thank you for your purchase!',
      message: `Hi ${order.customerDetails?.firstName || 'Customer'}, we're getting your order ready for delivery. We will notify you via email once it is packed and handed to our courier partner.`,
      statusLine: 'Pending · We are preparing your order',
    },
    processing: {
      subject: 'Order is confirmed & being Packed',
      headline: 'Order confirmed & being Packed',
      message: `Hi ${order.customerDetails?.firstName || 'Customer'}, your order has been confirmed and is now being packed. We'll notify you once it's shipped.`,
      statusLine: 'Confirmed · Being packed at our warehouse',
    },
    shipped: {
      subject: 'Your order is on the way',
      headline: 'Your order is on the way',
      message: `Hi ${order.customerDetails?.firstName || 'Customer'}, your order has been shipped and is on its way to you!`,
      statusLine: 'Shipped · With our courier partner',
    },
    delivered: {
      subject: 'Your order has been delivered',
      headline: 'Your order has been delivered',
      message: `Hi ${order.customerDetails?.firstName || 'Customer'}, your order has been delivered. We hope you love your purchase!`,
      statusLine: 'Delivered · Enjoy your bracelets',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  const itemsHtml = order.items?.map(item => `
    <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
      <span style="color: #333;">${item.title}</span>
      <span style="color: #333; font-weight: bold;">Rs. ${item.price?.toLocaleString()}</span>
    </div>
  `).join('') || '';

  const itemImagesHtml = order.items?.map(item => `
    <img src="${item.image || ''}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 8px;" />
  `).join('') || '';

  try {
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: order.customerDetails?.email,
      subject: `${config.subject} — Order #${order.id.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">

          <div style="background: #131921; padding: 24px; text-align: center;">
            <h1 style="color: #f3a847; margin: 0; font-size: 22px; letter-spacing: 2px; text-transform: uppercase;">Twistora</h1>
          </div>

          <div style="padding: 32px 24px; background: #ffffff;">
            <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Order #${order.id.slice(0, 8).toUpperCase()}</p>
            <h2 style="color: #131921; margin: 0 0 16px; font-size: 26px; line-height: 1.3;">${config.headline}</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">${config.message}</p>

            <div style="background: #f9f9f9; padding: 20px; margin-bottom: 20px;">
              <p style="color: #131921; font-size: 14px; font-weight: bold; margin: 0 0 12px;">${order.items?.length || 0} item(s) from Twistora</p>
              <div style="margin-bottom: 12px;">${itemImagesHtml}</div>
              ${itemsHtml}
            </div>

            <div style="background: #f9f9f9; padding: 20px; margin-bottom: 20px;">
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Status</p>
              <p style="color: #131921; font-size: 14px; margin: 0;">${config.statusLine}</p>
            </div>

            <div style="background: #f9f9f9; padding: 20px;">
              <p style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Order number</p>
              <p style="color: #131921; font-size: 16px; font-weight: bold; margin: 0;">${order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>

          <div style="background: #131921; padding: 16px; text-align: center;">
            <p style="color: #888; margin: 0; font-size: 11px; letter-spacing: 1px;">© 2024 TWISTORA. ALL RIGHTS RESERVED.</p>
          </div>

        </div>
      `,
    });

    console.log('[send-status-email] sent to:', order.customerDetails?.email);
    res.status(200).json({ message: 'Status email sent!' });
  } catch (error) {
    console.error('[send-status-email] error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Send payment verification email
app.post('/send-verification-email', async (req, res) => {
  const { email, name, orderId } = req.body;
  console.log('[send-verification-email] received for order:', orderId, 'to:', email);

  try {
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Payment Verified! Order #${orderId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #131921; padding: 20px; text-align: center;">
            <h1 style="color: #f3a847; margin: 0;">Twistora</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Payment Verified! ✅</h2>
            <p style="color: #666;">Hi ${name || 'Customer'},</p>
            <p style="color: #666;">
              Your payment has been successfully verified. Your order is now being processed and delivery is on the way.
            </p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p><strong>Order ID:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
              <p><strong>Status:</strong> Payment Verified ✅</p>
            </div>
            <p style="color: #666; text-align: center;">
              Your order will be delivered within <strong>3-5 business days</strong>! 🚚
            </p>
          </div>
          <div style="background: #131921; padding: 15px; text-align: center;">
            <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Twistora. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log('[send-verification-email] sent to:', email);
    res.status(200).json({ message: 'Verification email sent!' });
  } catch (error) {
    console.error('[send-verification-email] error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/send-contact-email', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    await transporter.sendMail({
      from: `"Twistora" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Message: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #131921; padding: 20px; text-align: center;">
            <h1 style="color: #f3a847; margin: 0;">Twistora</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">New Contact Message</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p style="background: white; padding: 15px; border-left: 3px solid #f3a847;">${message}</p>
          </div>
        </div>
      `,
    });
    res.status(200).json({ message: 'Email sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4242, () => console.log('Server running on port 4242'));