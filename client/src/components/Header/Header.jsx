import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useStateValue } from '../../StateContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

function Header() {
  const { state } = useStateValue();
  const { basket, user } = state;
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    if (user) {
      signOut(auth);
      setMenuOpen(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    navigate(`/shop?${params.toString()}`);
  };

  return (
    <nav className="sticky top-0 z-50">
      <div className="bg-[#131921] px-3 py-2">

        {/* ===== MOBILE LAYOUT ===== */}
        <div className="flex flex-col gap-2 md:hidden">

          {/* Row 1: Logo + Account + Basket + Hamburger */}
          <div className="flex items-center gap-2">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <span className="text-[#ff9900] text-xl font-bold tracking-tighter">
                Twistora
              </span>
            </Link>

            <div className="flex-1" />

            {/* Account */}
            <Link to={user ? '/' : '/login'} className="text-white hover:border hover:border-white rounded px-2 py-1">
              <p className="text-xs text-gray-300 leading-tight">
                {user ? `Hello, ${user.displayName || user.email.split('@')[0]}` : 'Sign in'}
              </p>
              <p className="text-xs font-semibold">Account</p>
            </Link>

            {/* Basket */}
            <Link to="/basket" className="flex items-center text-white hover:border hover:border-white rounded px-2 py-1">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#f3a847] text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {basket?.length}
                </span>
              </div>
            </Link>

            {/* Hamburger Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-white hover:border hover:border-white rounded p-1 transition-colors"
            >
              {menuOpen ? (
                // X icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Row 2: Search Bar */}
          <form onSubmit={handleSearch} className="flex rounded overflow-hidden w-full ring-2 ring-[#f3a847]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#f3a847] text-black text-xs px-1 cursor-pointer border-none outline-none"
            >
              <option>All</option>
              <option>Gold</option>
              <option>Silver</option>
              <option>Diamond</option>
              <option>Charms</option>
              <option>Bangles</option>
              <option>Beaded</option>
              <option>Couples</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bracelets..."
              className="flex-1 px-3 py-2 text-sm outline-none text-white bg-[#131921] placeholder:text-gray-400 min-w-0"
            />
            <button type="submit" className="bg-[#f3a847] px-3 hover:bg-[#e8a020] transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </form>

         {/* Dropdown Menu */}
{menuOpen && (
  <div className="flex flex-col bg-[#232f3e] rounded overflow-hidden">
    <Link to="/" onClick={() => setMenuOpen(false)}
      className="flex items-center gap-3 text-white text-sm px-4 py-3 hover:bg-[#37475a] border-b border-[#37475a]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      Home
    </Link>
    <Link to="/shop" onClick={() => setMenuOpen(false)}
      className="flex items-center gap-3 text-white text-sm px-4 py-3 hover:bg-[#37475a] border-b border-[#37475a]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      Shop
    </Link>
    <Link to="/about" onClick={() => setMenuOpen(false)}
      className="flex items-center gap-3 text-white text-sm px-4 py-3 hover:bg-[#37475a] border-b border-[#37475a]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      About Us
    </Link>
    <Link to="/contact" onClick={() => setMenuOpen(false)}
      className="flex items-center gap-3 text-white text-sm px-4 py-3 hover:bg-[#37475a] border-b border-[#37475a]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      Contact
    </Link>
    <Link to="/orders" onClick={() => setMenuOpen(false)}
      className="flex items-center gap-3 text-white text-sm px-4 py-3 hover:bg-[#37475a] border-b border-[#37475a]">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      Returns & Orders
    </Link>
    {user && (
      <button onClick={handleLogout}
        className="flex items-center gap-3 text-left text-[#f3a847] text-sm px-4 py-3 hover:bg-[#37475a]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    )}
  </div>
)}
        </div>

        {/* ===== LAPTOP LAYOUT — bilkul pehle jaisa ===== */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/">
            <span className="text-[#ff9900] text-2xl font-bold tracking-tighter">
              Twistora
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex flex-1 rounded overflow-hidden min-w-50 ring-2 ring-[#f3a847]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#f3a847] text-black text-sm px-2 cursor-pointer border-none outline-none"
            >
              <option>All</option>
              <option>Gold</option>
              <option>Silver</option>
              <option>Diamond</option>
              <option>Charms</option>
              <option>Bangles</option>
              <option>Beaded</option>
              <option>Couples</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bracelets..."
              className="flex-1 px-3 py-2 text-sm outline-none text-white bg-[#131921] placeholder:text-gray-400"
            />
            <button type="submit" className="bg-[#f3a847] px-4 hover:bg-[#e8a020] transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </form>

          <Link to={user ? '/' : '/login'} className="text-white hover:border hover:border-white rounded px-2 py-1 cursor-pointer">
            <p className="text-xs text-gray-300">
              {user ? `Hello, ${user.displayName || user.email.split('@')[0]}` : 'Hello, Sign in'}
            </p>
            <p className="text-sm font-semibold">Account</p>
          </Link>

          <Link to="/orders" className="text-white hover:border hover:border-white rounded px-2 py-1 cursor-pointer">
            <p className="text-xs text-gray-300">Returns</p>
            <p className="text-sm font-semibold">& Orders</p>
          </Link>

          {user && (
            <button onClick={handleLogout} className="text-white text-sm hover:border hover:border-white rounded px-2 py-1 transition-colors">
              Logout
            </button>
          )}

          <Link to="/basket" className="flex items-center gap-1 text-white hover:border hover:border-white rounded px-2 py-1 cursor-pointer">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-[#f3a847] text-black text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {basket?.length}
              </span>
            </div>
            <span className="text-sm font-semibold">Basket</span>
          </Link>
        </div>
      </div>

      {/* Bottom Nav — sirf laptop par */}
      <div className="hidden md:flex items-center gap-1 bg-[#232f3e] px-4 py-2">
        <Link to="/" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded whitespace-nowrap">Home</Link>
        <Link to="/shop" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded whitespace-nowrap">Shop</Link>
        <Link to="/about" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded whitespace-nowrap">About Us</Link>
        <Link to="/contact" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded whitespace-nowrap">Contact</Link>
      </div>
    </nav>
  );
}

export default Header;