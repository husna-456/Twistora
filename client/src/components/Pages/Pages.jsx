import { Link } from 'react-router-dom';
import { ChevronRight, FileText, ShoppingBag, User, Lock, HelpCircle } from 'lucide-react';

function Pages() {
  const pageLinks = [
    { title: 'Shop', path: '/shop', icon: <ShoppingBag size={18} />, desc: 'Browse all bracelets' },
    { title: 'About Us', path: '/about', icon: <User size={18} />, desc: 'Our story and mission' },
    { title: 'Contact', path: '/contact', icon: <HelpCircle size={18} />, desc: 'Get in touch with us' },
    { title: 'Orders', path: '/orders', icon: <FileText size={18} />, desc: 'Track your orders' },
    { title: 'Admin Login', path: '/admin/login', icon: <Lock size={18} />, desc: 'Admin access' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-[#131921] py-24 text-center">
        <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Navigation</p>
        <h1 className="text-4xl md:text-6xl font-bold text-white">All Pages</h1>
        <p className="text-gray-400 text-sm mt-4 max-w-md mx-auto">
          Quick access to all sections of Twistora
        </p>
      </section>

      {/* Links Grid */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pageLinks.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className="group flex items-center gap-4 p-6 border border-gray-100 hover:border-[#f3a847]/40 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 bg-[#f9f9f9] flex items-center justify-center text-[#f3a847] group-hover:bg-[#f3a847] group-hover:text-black transition-all duration-300">
                {page.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#131921] uppercase tracking-wide">{page.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{page.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-[#f3a847] group-hover:translate-x-1 transition-all duration-300" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Pages;