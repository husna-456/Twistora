import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Phone, Mail, Clock, Send,
  ArrowRight, MessageCircle
} from 'lucide-react';
import { db } from '../../firebase';
import { getDoc, doc } from 'firebase/firestore';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const [contactInfo, setContactInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);

  // Fetch contact info from Firestore
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'contactInfo'));
        if (snap.exists()) setContactInfo(snap.data());
      } catch (err) {
        console.error('Failed to fetch contact info:', err);
      } finally {
        setInfoLoading(false);
      }
    };
    fetchContactInfo();
  }, []);

  // Scroll-reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const revealElements = document.querySelectorAll('.reveal, .reveal-scale');
    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [submitted, infoLoading]);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await fetch(`${import.meta.env.VITE_BACKEND_URL}/send-contact-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  } catch (err) {
    console.error('Failed to send message:', err);
  }
};

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const businessName = contactInfo?.businessName || 'Twistora';

  // Cards — only render rows that have data
  const infoCards = [
    {
      icon: <MapPin size={20} className="text-[#f3a847]" />,
      title: 'Visit Us',
      lines: contactInfo?.address ? [contactInfo.address] : null,
    },
    {
      icon: <Phone size={20} className="text-[#f3a847]" />,
      title: 'Call Us',
      lines: [contactInfo?.phone, contactInfo?.whatsapp ? `WhatsApp: ${contactInfo.whatsapp}` : null].filter(Boolean),
      extra: contactInfo?.whatsapp
        ? { label: 'Chat on WhatsApp', href: `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}` }
        : null,
    },
    {
      icon: <Mail size={20} className="text-[#f3a847]" />,
      title: 'Email Us',
      lines: contactInfo?.email ? [contactInfo.email] : null,
      extra: contactInfo?.email
        ? { label: 'Send Email', href: `mailto:${contactInfo.email}` }
        : null,
    },
  ].filter((c) => c.lines && c.lines.length > 0);

  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1920&q=80"
          alt="Contact Twistora"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#131921]/50" />
        <div className="relative text-center px-6 max-w-3xl mx-auto">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.5em] mb-4">Get in Touch</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-4">
            We'd Love to <span className="text-[#f3a847]">Hear</span> From You
          </h1>
          <p className="text-gray-300 text-sm max-w-lg mx-auto leading-relaxed">
            Whether you have a question about our bracelets, need styling advice, or just want to say hello — we're here for you.
          </p>
        </div>
      </section>

      {/* ── INFO CARDS ── */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
        {infoLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 border border-gray-100 animate-pulse">
                <div className="w-12 h-12 bg-gray-100 mx-auto mb-4" />
                <div className="h-3 bg-gray-100 rounded w-24 mx-auto mb-3" />
                <div className="h-2 bg-gray-100 rounded w-32 mx-auto mb-2" />
                <div className="h-2 bg-gray-100 rounded w-28 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {infoCards.map((card) => (
              <div
                key={card.title}
                className="bg-white p-6 border border-gray-100 hover:border-[#f3a847]/30 shadow-sm reveal text-center"
              >
                <div className="w-12 h-12 bg-[#f9f9f9] flex items-center justify-center mx-auto mb-4">
                  {card.icon}
                </div>
                <h3 className="text-xs font-bold text-[#131921] uppercase tracking-[0.2em] mb-2">
                  {card.title}
                </h3>
                {card.lines.map((line) => (
                  <p key={line} className="text-gray-400 text-xs">{line}</p>
                ))}
                {card.extra && (
                  <a
                    href={card.extra.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-[10px] font-bold text-[#f3a847] uppercase tracking-wider hover:underline"
                  >
                    {card.extra.label}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── FORM & MAP ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* Contact Form */}
          <div className="reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Send a Message</p>
            <h2 className="text-3xl font-bold text-[#131921] mb-8">Let's Start a Conversation</h2>

            {submitted && (
              <div className="bg-[#f3a847]/10 border border-[#f3a847]/30 p-4 mb-6">
                <p className="text-[#131921] text-sm font-medium">Thank you! Your message has been sent successfully.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#131921] uppercase tracking-wider mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#131921] uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#131921] uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#131921] uppercase tracking-wider mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#f3a847] transition-colors bg-white resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#131921] hover:bg-[#232f3e] text-white font-bold px-10 py-4 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:-translate-y-0.5"
              >
                <Send size={14} />
                Send Message
              </button>
            </form>
          </div>

          {/* Map / fallback image */}
          <div className="reveal-scale">
            <div className="h-full min-h-100 relative overflow-hidden">
              {contactInfo?.mapLink ? (
                <iframe
                  src={contactInfo.mapLink}
                  title="Store location"
                  className="w-full h-full min-h-100 border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <>
                  <img
                    src="/bracelet.png"
                    alt="Our boutique"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#131921]/20" />
                  {contactInfo?.address && (
                    <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-5">
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-[#f3a847] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[#131921] text-sm font-semibold">{businessName}</p>
                          <p className="text-gray-400 text-xs mt-1">{contactInfo.address}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#f9f9f9] py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12 reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Common Questions</p>
            <h2 className="text-3xl font-bold text-[#131921]">Frequently Asked</h2>
          </div>
          <div className="space-y-4 stagger-children">
            {[
              { q: 'How do I find my bracelet size?', a: 'We offer adjustable bracelets that fit most wrist sizes. For specific sizing, refer to our Size Guide or contact us for a personalized fitting.' },
              { q: 'What materials do you use?', a: 'We use premium materials including 18K gold plating, sterling silver, and ethically sourced gemstones. Each product page lists the specific materials used.' },
              { q: 'How long does shipping take?', a: 'Orders within Pakistan are delivered within 3-5 business days. International shipping takes 7-14 business days depending on the destination.' },
              { q: 'Can I return or exchange my bracelet?', a: 'Yes, we offer a 7-day return policy for unused items in their original packaging. Custom orders are non-returnable.' },
            ].map((faq) => (
              <div key={faq.q} className="bg-white border border-gray-100 p-6 reveal">
                <div className="flex items-start gap-3">
                  <MessageCircle size={16} className="text-[#f3a847] shrink-0 mt-1" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#131921] mb-2">{faq.q}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 reveal">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Stay Connected</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#131921] mb-4">Follow Our Journey</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Join our community for exclusive launches, styling tips, and behind-the-scenes looks at our craft.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-10 py-4 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:shadow-lg hover:shadow-[#f3a847]/20 hover:-translate-y-0.5"
          >
            Explore Collection
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

    </div>
  );
}

export default Contact;
