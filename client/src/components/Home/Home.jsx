import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../Product/ProductCard';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  Truck, Shield, RefreshCw, Lock,
  ArrowRight, Star, Quote, ChevronRight,
  ShoppingBag, Play, X
} from 'lucide-react';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const bgVideoRef = useRef(null);

  const categories = ['All', 'Gold', 'Silver', 'Diamond', 'Charms', 'Bangles', 'Beaded', 'Couples'];

  // Scroll reveal observer
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
  }, [products, loading, activeCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = activeCategory === 'All'
    ? products
    : products.filter((p) => p.category === activeCategory);

  const marqueeItems = [
    '✦ GOLD BRACELETS',
    '✦ SILVER BRACELETS',
    '✦ CHARM BRACELETS',
    '✦ COUPLE BRACELETS',
    '✦ BEADED BRACELETS',
    '✦ HANDCRAFTED',
    '✦ GOLD BRACELETS',
    '✦ SILVER BRACELETS',
    '✦ CHARM BRACELETS',
    '✦ COUPLE BRACELETS',
    '✦ BEADED BRACELETS',
    '✦ HANDCRAFTED',
  ];

  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative bg-[#131921] min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=1920&q=80"
          alt="Luxury bracelets"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#131921]/40 via-[#131921]/30 to-[#131921]"/>
        <div className="absolute inset-0"
          style={{background: 'radial-gradient(ellipse at center, rgba(26,37,53,0.3) 0%, rgba(19,25,33,0.75) 70%)'}}
        />
        {/* Subtle floating particles effect via CSS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-[#f3a847]/5"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
                animation: `gentleFloat ${5 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>
        <div className="relative text-center px-6 max-w-4xl mx-auto">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.5em] mb-8 animate-fade-in-up">
            Twistora — Handcrafted Bracelets
          </p>
          <h1 className="text-6xl md:text-8xl font-bold text-white leading-none mb-3 animate-fade-in-up delay-200">
            Wear Your
          </h1>
          <h1 className="text-6xl md:text-8xl font-bold leading-none mb-8 animate-fade-in-up delay-300">
            <span className="text-[#f3a847]">Story</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-lg italic mb-12 max-w-lg mx-auto leading-relaxed animate-fade-in-up delay-400">
            "Every bracelet we craft holds a memory, a moment, a feeling — made just for you"
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-500">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-10 py-4 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:shadow-lg hover:shadow-[#f3a847]/20 hover:-translate-y-0.5"
            >
              <ShoppingBag size={14}/>
              Shop Now
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center gap-2 border border-white text-white hover:bg-white hover:text-[#131921] font-bold px-10 py-4 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:-translate-y-0.5"
            >
              Our Story
              <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"/>
      </section>

      {/* ── MARQUEE BAR ── */}
      <section className="bg-white py-5 border-y border-gray-100 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {marqueeItems.map((item, i) => (
            <span key={i} className="text-gray-300 font-bold text-[11px] tracking-[0.3em] mx-8">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── BRACELET COLLECTIONS ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16 reveal">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Explore</p>
          <h2 className="text-4xl font-bold text-[#131921]">Our Collections</h2>
          <p className="text-gray-400 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
            Each collection is carefully crafted to suit every style and occasion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
          {[
            {
              title: 'Gold Bracelets',
              desc: 'Timeless elegance forged in pure gold',
              price: 'From Rs. 1,299',
              category: 'Gold',
              image: '/gold.jpeg',
              count: '24 Pieces',
            },
            {
              title: 'Silver Bracelets',
              desc: 'Understated luxury for the modern soul',
              price: 'From Rs. 899',
              category: 'Silver',
              image: '/silver.jpeg',
              count: '18 Pieces',
            },
            {
              title: 'Charm Bracelets',
              desc: 'Express your unique personality',
              price: 'From Rs. 799',
              category: 'Charms',
              image: '/charms.jpeg',
              count: '32 Pieces',
            },
            {
              title: 'Couple Bracelets',
              desc: 'Share the love with matching sets',
              price: 'From Rs. 1,799',
              category: 'Couples',
              image: '/couples.jpeg',
              count: '12 Pieces',
            },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => setActiveCategory(item.category)}
              className="group relative overflow-hidden cursor-pointer reveal-scale bg-[#131921]"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#131921] via-[#131921]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"/>
                <div className="absolute inset-0 bg-[#f3a847]/0 group-hover:bg-[#f3a847]/10 transition-colors duration-500"/>

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#f3a847] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"/>

                {/* Content */}
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  {/* Piece count badge */}
                  <span className="absolute top-5 right-5 bg-white/10 backdrop-blur-sm text-white/80 text-[10px] px-3 py-1 tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                    {item.count}
                  </span>

                  <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="w-10 h-px bg-[#f3a847] mb-4 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left delay-100"/>
                    <h3 className="text-white font-bold text-xl mb-2 tracking-wide">{item.title}</h3>
                    <p className="text-gray-300 text-xs leading-relaxed mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75">
                      {item.desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[#f3a847] text-xs font-semibold tracking-wide">{item.price}</p>
                      <span className="inline-flex items-center gap-2 text-white text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0 delay-100">
                        Explore <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform duration-300"/>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OUR PROMISE ── */}
      <section className="bg-[#f9f9f9] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-16 reveal">
            <div>
              <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Why Choose Us</p>
              <h2 className="text-4xl font-bold text-[#131921] leading-tight">
                Our Promise
                <br />to You
              </h2>
            </div>
            <div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Every bracelet from Twistora is handcrafted with care and attention to detail. We believe that a bracelet is more than an accessory — it is a story, a memory, a piece of your heart.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
            {[
              { title: 'Bracelet Care Guide', desc: 'Tips to keep your bracelets shining and lasting longer' },
              { title: 'Size Guide', desc: 'Find your perfect bracelet size with our easy guide' },
              { title: 'Gift Wrapping', desc: 'Beautiful premium packaging for your loved ones' },
              { title: 'Style Guide', desc: 'Learn how to stack and style your bracelets' },
            ].map((service) => (
              <div
                key={service.title}
                className="group bg-white border border-gray-100 p-6 hover:border-[#f3a847]/40 hover:shadow-lg transition-all duration-500 cursor-pointer reveal luxury-shadow"
              >
                <div className="w-6 h-0.5 bg-[#f3a847] mb-5 group-hover:w-10 transition-all duration-500"/>
                <h3 className="text-xs font-bold text-[#131921] mb-2 uppercase tracking-wide">{service.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO SECTION ── */}
      <section className="relative bg-[#131921] min-h-[600px] flex items-center justify-center overflow-hidden reveal-scale">
        {/* Video Background */}
        <video
          ref={bgVideoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/video-cover.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source
            src="/hero-video.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 video-overlay"/>
        <div className="absolute inset-0 bg-[#131921]/40"/>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <button
            onClick={() => {
              setVideoModalOpen(true);
              if (bgVideoRef.current) bgVideoRef.current.pause();
            }}
            className="group relative w-20 h-20 mx-auto mb-8"
            aria-label="Play video"
          >
            {/* Ripple rings */}
            <span className="absolute inset-0 rounded-full border border-[#f3a847]/30 scale-100 group-hover:scale-150 group-hover:opacity-0 transition-all duration-700"/>
            <span className="absolute inset-0 rounded-full border border-[#f3a847]/20 scale-100 group-hover:scale-125 group-hover:opacity-0 transition-all duration-500 delay-100"/>
            {/* Main circle */}
            <span className="absolute inset-0 rounded-full bg-[#f3a847]/10 backdrop-blur-sm border border-[#f3a847]/40 flex items-center justify-center group-hover:bg-[#f3a847]/20 group-hover:scale-110 transition-all duration-300">
              <Play size={22} className="text-[#f3a847] ml-1 group-hover:scale-110 transition-transform duration-300"/>
            </span>
          </button>

          <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-4">The Art of Craftsmanship</p>
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Crafted With
            <br />
            <span className="text-[#f3a847]">Passion & Precision</span>
          </h2>
          <p className="text-gray-300 text-sm max-w-lg mx-auto leading-relaxed mb-10">
            Each bracelet begins as a vision and transforms through the hands of master artisans.
            We source only the finest materials — from pure gold and sterling silver to precious gemstones —
            ensuring every piece tells a story of dedication and artistry.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { number: '10+', label: 'Years of Craft' },
              { number: '50K+', label: 'Happy Customers' },
              { number: '100%', label: 'Handmade' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-[#f3a847] mb-1">{stat.number}</p>
                <p className="text-gray-400 text-[11px] tracking-[0.2em] uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Video Lightbox Modal */}
        {videoModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
            onClick={() => {
              setVideoModalOpen(false);
              if (bgVideoRef.current) bgVideoRef.current.play();
            }}
          >
            <div
              className="relative w-full max-w-5xl mx-4 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => {
                  setVideoModalOpen(false);
                  if (bgVideoRef.current) bgVideoRef.current.play();
                }}
                className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2 text-xs tracking-widest uppercase"
              >
                <X size={16}/>
                Close
              </button>

              {/* Video player */}
              <div className="relative aspect-video bg-black shadow-2xl">
                <video
                  autoPlay
                  controls
                  playsInline
                  className="w-full h-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <source src="/hero-video.mp4" type="video/mp4"/>
                </video>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Latest</p>
            <h2 className="text-4xl font-bold text-[#131921]">New Arrivals</h2>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-0 mb-8 border-b border-gray-100 reveal">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-3 text-xs font-medium tracking-widest uppercase transition-all duration-300 border-b-2 ${
                  activeCategory === cat
                    ? 'text-[#131921] border-[#f3a847]'
                    : 'text-gray-400 border-transparent hover:text-[#131921]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 reveal">
              <p className="text-gray-400 text-sm">No bracelets found in this category</p>
              <button
                onClick={() => setActiveCategory('All')}
                className="mt-4 text-[#f3a847] text-xs underline"
              >
                View all bracelets
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {filteredProducts.map((product) => (
                <div key={product.id} className="reveal">
                  <ProductCard product={product} showAddToBasket={false} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10 reveal">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 border border-[#131921] text-[#131921] hover:bg-[#131921] hover:text-white font-bold px-10 py-3 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:-translate-y-0.5"
            >
              View All Bracelets
              <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FULL WIDTH BANNER ── */}
      <section className="bg-[#131921] py-28 reveal">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div>
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-4">Featured</p>
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Every Bracelet
              <br />
              <span className="text-[#f3a847]">Tells Your Story</span>
            </h2>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed mt-4">
              From gold to beaded, from charm to couple — find the bracelet that speaks your language.
            </p>
          </div>
          <Link
            to="/shop"
            className="shrink-0 inline-flex items-center gap-3 bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-10 py-4 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:shadow-lg hover:shadow-[#f3a847]/20 hover:-translate-y-0.5"
          >
            <ShoppingBag size={14}/>
            Shop Best Sellers
          </Link>
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section className="py-16 bg-[#f9f9f9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Top Picks</p>
            <h2 className="text-4xl font-bold text-[#131921]">Best Sellers</h2>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-8 h-8 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger-children">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="reveal">
                  <ProductCard product={product} showAddToBasket={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="bg-[#232f3e] py-24 reveal">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Quote size={32} className="text-[#f3a847] mx-auto mb-8 opacity-60"/>
          <p className="text-white text-2xl md:text-3xl font-light italic leading-relaxed mb-8">
            "Shine Like the Whole Universe Is Yours"
          </p>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto mb-8">
            I got a gold bracelet from Twistora as a gift — it was the most beautiful thing I had ever worn. The craftsmanship, the packaging, everything was perfect.
          </p>
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="text-[#f3a847] fill-[#f3a847]"/>
            ))}
          </div>
          <p className="text-[#f3a847] text-xs font-bold tracking-[0.3em] uppercase">Sana Malik</p>
          <p className="text-gray-500 text-xs mt-1">Loyal Customer — Lahore</p>
        </div>
      </section>

      {/* ── FEATURES BAR ── */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: <Truck size={18} className="text-[#f3a847]"/>, title: 'Free Delivery', sub: 'On orders over Rs. 5000' },
            { icon: <Shield size={18} className="text-[#f3a847]"/>, title: 'Premium Quality', sub: 'Handcrafted bracelets' },
            { icon: <RefreshCw size={18} className="text-[#f3a847]"/>, title: 'Easy Returns', sub: '7 days return policy' },
            { icon: <Lock size={18} className="text-[#f3a847]"/>, title: 'Secure Payment', sub: '100% secure checkout' },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 reveal">
              <div className="shrink-0 w-10 h-10 bg-[#f9f9f9] flex items-center justify-center">
                {item.icon}
              </div>
              <div>
                <p className="text-[#131921] text-xs font-bold uppercase tracking-wide">{item.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#131921] pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-16 pb-16 border-b border-gray-800 reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Stay Connected</p>
            <h3 className="text-white text-2xl font-bold mb-2">Subscribe to Newsletter</h3>
            <p className="text-gray-500 text-xs mb-8 tracking-wide">
              Get the latest news about new bracelets, discounts and special offers
            </p>
            <div className="flex flex-col sm:flex-row gap-0 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-5 py-3 text-xs outline-none bg-[#232f3e] text-white placeholder-gray-600 focus:ring-1 focus:ring-[#f3a847] border border-gray-700 transition-all"
              />
              <button className="bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-8 py-3 transition-colors text-xs tracking-[0.3em] uppercase">
                Subscribe
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-bold text-sm mb-6 tracking-[0.2em] uppercase">Twistora</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Handcrafted bracelets for every occasion. Made with love in Pakistan.
              </p>
            </div>
            <div>
              <h4 className="text-[#f3a847] font-semibold text-xs mb-6 tracking-[0.2em] uppercase">Customer Care</h4>
              <ul className="space-y-3">
                {['Shipping Info', 'Order Status', 'Easy Returns', 'Bracelet Care', 'FAQs'].map((item) => (
                  <li key={item}>
                    <Link to="/contact" className="text-gray-500 hover:text-white text-xs transition-colors tracking-wide">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[#f3a847] font-semibold text-xs mb-6 tracking-[0.2em] uppercase">About</h4>
              <ul className="space-y-3">
                {['Our Story', 'Our Packaging', 'Our Clients', 'Gift Cards', 'Careers'].map((item) => (
                  <li key={item}>
                    <Link to="/about" className="text-gray-500 hover:text-white text-xs transition-colors tracking-wide">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[#f3a847] font-semibold text-xs mb-6 tracking-[0.2em] uppercase">Collections</h4>
              <ul className="space-y-3">
                {['Gold Bracelets', 'Silver Bracelets', 'Diamond', 'Charm Bracelets', 'Couple Sets'].map((item) => (
                  <li key={item}>
                    <Link to="/shop" className="text-gray-500 hover:text-white text-xs transition-colors tracking-wide">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-600 text-xs tracking-widest">
              © 2024 TWISTORA. ALL RIGHTS RESERVED.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}

export default Home;