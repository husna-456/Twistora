import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../Product/ProductCard';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { SlidersHorizontal, ArrowRight, ShoppingBag, X, Search } from 'lucide-react';

function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [priceLimit, setPriceLimit] = useState([0, 100000]);

  const categories = ['Gold', 'Silver', 'Diamond', 'Charms', 'Bangles', 'Beaded', 'Couples'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);

        // Compute price limits
        const prices = productsData.map((p) => p.price || 0);
        if (prices.length) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setPriceRange([min, max]);
          setPriceLimit([min, max]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Apply URL query params to filters
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category');

    setSearchQuery(urlSearch);
    if (urlCategory && categories.includes(urlCategory)) {
      setSelectedCategories([urlCategory]);
    } else if (urlCategory === null) {
      setSelectedCategories([]);
    }
  }, [searchParams]);

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
  }, [products, loading, selectedCategories, sortBy]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.title?.toLowerCase().includes(q));
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    // Price filter
    result = result.filter((p) => {
      const price = p.salePrice || p.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, selectedCategories, sortBy, searchQuery, priceRange]);

  const handlePriceChange = (index, value) => {
    const newRange = [...priceRange];
    newRange[index] = Number(value);
    if (newRange[0] <= newRange[1]) {
      setPriceRange(newRange);
    }
  };

  return (
    <div className="bg-white min-h-screen">

      {/* ── SHOP BANNER ── */}
      <section className="relative h-72 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80"
          alt="Shop banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/60"/>
        <div className="relative h-full flex items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-light text-[#131921] tracking-wide">Shop Sidebar</h1>
        </div>
      </section>

      {/* ── FILTERS & PRODUCTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 reveal">
          <p className="text-gray-500 text-xs tracking-wide">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden flex items-center gap-2 border border-gray-200 px-4 py-2 text-xs tracking-widest uppercase text-[#131921]"
            >
              <SlidersHorizontal size={14}/>
              Filters
            </button>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none border border-gray-200 pl-4 pr-10 py-2 text-xs tracking-widest uppercase text-[#131921] bg-white outline-none focus:border-[#f3a847] transition-colors cursor-pointer"
              >
                <option value="featured">Sort by Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">▼</span>
            </div>
          </div>
        </div>

        <div className="flex gap-8 flex-col-reverse md:flex-row">
          {/* Product Grid - LEFT */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin"/>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 reveal">
                <ShoppingBag size={40} className="text-gray-200 mx-auto mb-4"/>
                <p className="text-gray-400 text-sm mb-4">No bracelets found</p>
                <button
                  onClick={() => { setSelectedCategories([]); setSearchQuery(''); setPriceRange(priceLimit); }}
                  className="text-[#f3a847] text-xs font-bold uppercase tracking-[0.2em] underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5 stagger-children">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="reveal">
                    <ProductCard product={product} showAddToBasket={false} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Filters - RIGHT */}
          <aside className="hidden md:block w-64 shrink-0 reveal">
            <div className="sticky top-24 space-y-8">

              {/* Search */}
              <div>
                <h3 className="text-sm font-semibold text-[#131921] mb-4">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ..."
                    className="w-full border-b border-gray-200 pb-2 pr-8 text-sm outline-none focus:border-[#f3a847] transition-colors placeholder:text-gray-300"
                  />
                  <Search size={14} className="absolute right-0 top-0.5 text-gray-400"/>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-[#131921] mb-4">Category</h3>
                <div className="space-y-2.5">
                  {categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative w-4 h-4 border border-gray-300 flex items-center justify-center transition-colors group-hover:border-[#f3a847]">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {selectedCategories.includes(cat) && (
                          <div className="w-2 h-2 bg-[#f3a847]"/>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 group-hover:text-[#131921] transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-[#131921] mb-4">Price</h3>
                <div className="px-1">
                  {/* Track */}
                  <div className="relative h-1 bg-gray-200 mb-4">
                    <div
                      className="absolute h-full bg-[#f3a847]"
                      style={{
                        left: `${((priceRange[0] - priceLimit[0]) / (priceLimit[1] - priceLimit[0] || 1)) * 100}%`,
                        right: `${100 - ((priceRange[1] - priceLimit[0]) / (priceLimit[1] - priceLimit[0] || 1)) * 100}%`,
                      }}
                    />
                    {/* Min handle */}
                    <input
                      type="range"
                      min={priceLimit[0]}
                      max={priceLimit[1]}
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(0, e.target.value)}
                      className="absolute w-full -top-2 appearance-none bg-transparent cursor-pointer"
                      style={{ zIndex: 2 }}
                    />
                    {/* Max handle */}
                    <input
                      type="range"
                      min={priceLimit[0]}
                      max={priceLimit[1]}
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(1, e.target.value)}
                      className="absolute w-full -top-2 appearance-none bg-transparent cursor-pointer"
                      style={{ zIndex: 2 }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Rs. {priceRange[0].toLocaleString()}</span>
                    <span>Rs. {priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setPriceRange(priceLimit)}
                  className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3a847] hover:text-[#e8a020] transition-colors"
                >
                  FILTER
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile Filters Drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)}/>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-semibold text-[#131921]">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X size={18} className="text-gray-400"/>
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-[#131921] mb-4">Search</h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ..."
                      className="w-full border-b border-gray-200 pb-2 pr-8 text-sm outline-none focus:border-[#f3a847] transition-colors placeholder:text-gray-300"
                    />
                    <Search size={14} className="absolute right-0 top-0.5 text-gray-400"/>
                  </div>
                </div>

                {/* Mobile Categories */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-[#131921] mb-4">Category</h3>
                  <div className="space-y-2.5">
                    {categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer">
                        <div className="relative w-4 h-4 border border-gray-300 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {selectedCategories.includes(cat) && (
                            <div className="w-2 h-2 bg-[#f3a847]"/>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mobile Price */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-[#131921] mb-4">Price</h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(0, e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-xs outline-none"
                    />
                    <span className="text-gray-400">—</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(1, e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full bg-[#131921] text-white text-xs font-bold uppercase tracking-[0.2em] py-3"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-[#f9f9f9] py-20 reveal">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">Custom Orders</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#131921] mb-4">
            Looking for Something Unique?
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            We create custom bracelets tailored to your style. From engraving to custom designs, 
            let us bring your vision to life.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-[#131921] hover:bg-[#232f3e] text-white font-bold px-10 py-3 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:-translate-y-0.5"
          >
            Get in Touch
            <ArrowRight size={14}/>
          </Link>
        </div>
      </section>

    </div>
  );
}

export default Shop;