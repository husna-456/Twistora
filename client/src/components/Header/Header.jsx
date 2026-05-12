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

  const handleLogout = () => {
    if (user) {
      signOut(auth);
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
      <div className="flex items-center gap-3 bg-[#131921] p-3 flex-wrap">

        {/* Logo */}
        <Link to="/">
          <span className="text-[#ff9900] text-2xl font-bold tracking-tighter">
            Twistora
          </span>
        </Link>

        {/* Search bar */}
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

        {/* Account */}
        <Link
          to={user ? '/' : '/login'}
          className="text-white hover:border hover:border-white rounded px-2 py-1 cursor-pointer"
        >
          <p className="text-xs text-gray-300">
            {user ? `Hello, ${user.displayName || user.email.split('@')[0]}` : 'Hello, Sign in'}
          </p>
          <p className="text-sm font-semibold">Account</p>
        </Link>

        {/* Returns */}
        <Link
          to="/orders"
          className="text-white hover:border hover:border-white rounded px-2 py-1 cursor-pointer hidden md:block"
        >

          <p className="text-xs text-gray-300">Returns</p>
          <p className="text-sm font-semibold">& Orders</p>

        </Link>
        {/* Logout — sirf login hone par dikhe */}
        {user && (
          <button
            onClick={handleLogout}
            className="text-white text-sm hover:border hover:border-white rounded px-2 py-1 transition-colors"
          >
            Logout
          </button>
        )}

        {/* Basket */}
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

      <div className="flex items-center gap-1 bg-[#232f3e] px-4 py-2 flex-wrap">
        <Link to="/" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded cursor-pointer whitespace-nowrap">
          Home
        </Link>
        <Link to="/shop" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded cursor-pointer whitespace-nowrap">
          Shop
        </Link>
        <Link to="/about" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded cursor-pointer whitespace-nowrap">
          About Us
        </Link>
        <Link to="/contact" className="text-white text-sm px-3 py-1 hover:border hover:border-white rounded cursor-pointer whitespace-nowrap">
          Contact
        </Link>
      </div>

    </nav>
  );
}

export default Header;