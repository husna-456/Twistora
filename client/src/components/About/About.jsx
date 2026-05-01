import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Gem, Heart, Award, Truck,
  Shield, Users, Sparkles
} from 'lucide-react';

function About() {
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
  }, []);

  return (
    <div className="bg-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden flex items-center justify-center">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80"
          alt="About Twistora"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#131921]/50"/>
        <div className="relative text-center px-6 max-w-3xl mx-auto">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.5em] mb-4 animate-fade-in-up">Our Story</p>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-4 animate-fade-in-up delay-200">
            Crafted With <span className="text-[#f3a847]">Purpose</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed animate-fade-in-up delay-300">
            Every piece tells a story. Ours began with a simple belief — that jewelry should be as meaningful as the moments it celebrates.
          </p>
        </div>
      </section>

      {/* ── BRAND STORY ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Since 2014</p>
            <h2 className="text-4xl font-bold text-[#131921] leading-tight mb-6">
              We Believe in the <br/><span className="text-[#f3a847]">Power of Detail</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Twistora was born from a passion for craftsmanship and an unwavering commitment to quality. 
              What started as a small workshop in Lahore has grown into a beloved brand, trusted by thousands 
              who seek jewelry that resonates with their personal journey.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Each bracelet is meticulously handcrafted by artisans who have honed their skills over decades. 
              We source only the finest materials — from ethically mined gold to sustainably harvested silver — 
              ensuring that every piece not only looks exquisite but also carries a conscience.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-[#131921] hover:bg-[#232f3e] text-white font-bold px-8 py-3 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:-translate-y-0.5"
            >
              Explore Collection
              <ArrowRight size={14}/>
            </Link>
          </div>
          <div className="reveal-scale">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=800&q=80"
                alt="Craftsmanship"
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-[#f3a847] p-6 hidden md:block">
                <p className="text-4xl font-bold text-[#131921]">10+</p>
                <p className="text-[#131921] text-xs uppercase tracking-widest mt-1">Years of Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-[#f9f9f9] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">What Drives Us</p>
            <h2 className="text-4xl font-bold text-[#131921]">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {[
              { icon: <Gem size={24} className="text-[#f3a847]"/>, title: 'Authentic Materials', desc: 'We use only genuine gold, silver, and ethically sourced gemstones in every piece.' },
              { icon: <Heart size={24} className="text-[#f3a847]"/>, title: 'Made with Love', desc: 'Every bracelet is handcrafted with care, attention, and genuine passion.' },
              { icon: <Award size={24} className="text-[#f3a847]"/>, title: 'Uncompromising Quality', desc: 'Rigorous quality checks ensure each piece meets our premium standards.' },
              { icon: <Users size={24} className="text-[#f3a847]"/>, title: 'Community First', desc: 'We empower local artisans and give back to the communities we serve.' },
            ].map((val) => (
              <div key={val.title} className="group bg-white p-8 border border-gray-100 hover:border-[#f3a847]/30 luxury-shadow reveal">
                <div className="w-12 h-12 bg-[#f9f9f9] flex items-center justify-center mb-5 group-hover:bg-[#f3a847]/10 transition-colors duration-300">
                  {val.icon}
                </div>
                <h3 className="text-sm font-bold text-[#131921] mb-3 uppercase tracking-wide">{val.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">The Journey</p>
            <h2 className="text-4xl font-bold text-[#131921]">How We Create</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Design', desc: 'Our designers sketch concepts inspired by art, nature, and the stories of our customers.' },
              { step: '02', title: 'Craft', desc: 'Master artisans transform raw materials into wearable art using time-honored techniques.' },
              { step: '03', title: 'Perfect', desc: 'Every piece undergoes detailed inspection and finishing before it reaches your hands.' },
            ].map((item, i) => (
              <div key={item.step} className="text-center reveal">
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-[#131921] flex items-center justify-center">
                    <span className="text-[#f3a847] text-2xl font-bold">{item.step}</span>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/2 left-[60%] w-[80%] h-px bg-gray-200"/>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#131921] mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-[#131921] py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: '50K+', label: 'Happy Customers' },
            { number: '10+', label: 'Years Experience' },
            { number: '100%', label: 'Handcrafted' },
            { number: '4.9', label: 'Average Rating' },
          ].map((stat) => (
            <div key={stat.label} className="text-center reveal">
              <p className="text-4xl md:text-5xl font-bold text-[#f3a847] mb-2">{stat.number}</p>
              <p className="text-gray-400 text-xs uppercase tracking-[0.2em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRUST BADGES ── */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: <Truck size={18} className="text-[#f3a847]"/>, title: 'Free Delivery', sub: 'On orders over Rs. 5000' },
            { icon: <Shield size={18} className="text-[#f3a847]"/>, title: 'Premium Quality', sub: 'Handcrafted bracelets' },
            { icon: <Sparkles size={18} className="text-[#f3a847]"/>, title: 'Artisan Made', sub: 'By master craftsmen' },
            { icon: <Heart size={18} className="text-[#f3a847]"/>, title: 'Gift Ready', sub: 'Premium packaging' },
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

      {/* ── CTA ── */}
      <section className="py-24 reveal">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Join the Family</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#131921] mb-4">
            Become Part of Our Story
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Discover bracelets that speak to your soul. Every piece is waiting to become part of your journey.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[#f3a847] hover:bg-[#e8a020] text-black font-bold px-10 py-4 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:shadow-lg hover:shadow-[#f3a847]/20 hover:-translate-y-0.5"
          >
            Shop Now
            <ArrowRight size={14}/>
          </Link>
        </div>
      </section>

    </div>
  );
}

export default About;