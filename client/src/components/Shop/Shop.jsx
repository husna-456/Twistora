import { useState, useEffect, useMemo,startTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../Product/ProductCard';
import CategoryMarquee from './CategoryMarquee';
import { db } from '../../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { SlidersHorizontal, ArrowRight, ShoppingBag, X, Search } from 'lucide-react';

function Shop() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [priceLimit, setPriceLimit] = useState([0, 100000]);
  const [categories, setCategories] = useState([]);

  // ── FETCH ──
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [productsSnap, catSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(query(collection(db, 'categories'), orderBy('createdAt', 'asc'))),
        ]);

        const productsData = productsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setCategories(catSnap.docs.map((d) => d.data().name));

        const prices = productsData.map((p) => p.price || 0);
        if (prices.length) {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setPriceRange([min, max]);
          setPriceLimit([min, max]);
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

 useEffect(() => {
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category');

  startTransition(() => {
    setSearchQuery(urlSearch);
    setSelectedCategories(() => {
      if (urlCategory && categories.includes(urlCategory)) return [urlCategory];
      if (!urlCategory) return [];
      return [];
    });
  });
}, [searchParams, categories]);


  // ── SCROLL REVEAL ──
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
    document.querySelectorAll('.reveal, .reveal-scale').forEach((el) =>
      observer.observe(el)
    );
    return () => observer.disconnect();
  }, [products, loading, selectedCategories, sortBy]);

  // ── CATEGORY TOGGLE ──
  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // ── FILTER + SORT ──
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.tags?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    result = result.filter((p) => {
      const price = p.salePrice || p.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (sortBy === 'price-low') {
      result.sort(
        (a, b) =>
          (a.salePrice || a.price || 0) - (b.salePrice || b.price || 0)
      );
    } else if (sortBy === 'price-high') {
      result.sort(
        (a, b) =>
          (b.salePrice || b.price || 0) - (a.salePrice || a.price || 0)
      );
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, selectedCategories, sortBy, searchQuery, priceRange]);

  const handlePriceChange = (index, value) => {
    const newRange = [...priceRange];
    newRange[index] = Number(value);
    if (newRange[0] <= newRange[1]) setPriceRange(newRange);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setPriceRange(priceLimit);
  };

  const activeFilterCount =
    selectedCategories.length +
    (searchQuery.trim() ? 1 : 0) +
    (priceRange[0] !== priceLimit[0] || priceRange[1] !== priceLimit[1] ? 1 : 0);

  return (
    <div className="bg-white min-h-screen">

      {/* ── SHOP BANNER ── */}
      <section className="relative h-64 md:h-72 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80"
          alt="Shop banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-white/40 via-white/50 to-white/70" />
        <div className="relative h-full flex flex-col items-center justify-center gap-2">
          <p className="text-[#f3a847] text-[10px] uppercase tracking-[0.5em] font-bold">
            Twistora Collection
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-[#131921] tracking-wide">
            Shop
          </h1>
        </div>
      </section>

      {/* ── CATEGORY MARQUEE ──
          Now wired: clicking a marquee pill toggles that category filter */}
      {!loading && (
        <CategoryMarquee
          products={products}
          categories={categories}
          selected={selectedCategories}
          onSelect={toggleCategory}
        />
      )}

      {/* ── FILTERS & PRODUCTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 reveal">
          <div className="flex items-center gap-3">
            <p className="text-gray-400 text-xs tracking-wide">
              {filteredProducts.length}{' '}
              {filteredProducts.length === 1 ? 'result' : 'results'}
            </p>
            {/* Active filter chip summary */}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 border border-[#f3a847]/50 text-[#f3a847] text-[10px] font-bold uppercase tracking-widest px-3 py-1 hover:bg-[#f3a847]/10 transition-colors"
              >
                <X size={10} />
                Clear ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="md:hidden flex items-center gap-2 border border-gray-200 px-4 py-2 text-xs tracking-widest uppercase text-[#131921] hover:border-[#f3a847] transition-colors"
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-[#f3a847] text-[#131921] text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none border border-gray-200 pl-4 pr-10 py-2 text-xs tracking-widest uppercase text-[#131921] bg-white outline-none focus:border-[#f3a847] transition-colors cursor-pointer"
              >
                <option value="featured">Default</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
                ▼
              </span>
            </div>
          </div>
        </div>

        {/* Selected category chips (desktop) */}
        {selectedCategories.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-2 mb-6">
            {selectedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className="flex items-center gap-1.5 bg-[#131921] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 hover:bg-[#f3a847] hover:text-[#131921] transition-colors"
              >
                {cat}
                <X size={9} strokeWidth={3} />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-8 flex-col-reverse md:flex-row">

          {/* ── PRODUCT GRID ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-[#f3a847] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 reveal">
                <ShoppingBag size={40} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 text-sm mb-4">No products found</p>
                <button
                  onClick={clearFilters}
                  className="text-[#f3a847] text-xs font-bold uppercase tracking-[0.2em] underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              /* FIX: showAddToBasket={true} so Add to Basket appears on shop page */
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5 stagger-children">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="reveal">
                    <ProductCard product={product} showAddToBasket={true} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── DESKTOP SIDEBAR FILTERS ── */}
          <aside className="hidden md:block w-60 shrink-0 reveal">
            <div className="sticky top-24 space-y-8">

              {/* Search */}
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#131921] mb-4">
                  Search
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className="w-full border-b border-gray-200 pb-2 pr-8 text-sm outline-none focus:border-[#f3a847] transition-colors placeholder:text-gray-300"
                  />
                  <Search size={14} className="absolute right-0 top-0.5 text-gray-400" />
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#131921] mb-4">
                  Category
                </h3>
                <div className="space-y-2.5">
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.category === cat).length;
                    return (
                      <label
                        key={cat}
                        className="flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-4 h-4 border border-gray-300 flex items-center justify-center transition-colors group-hover:border-[#f3a847]">
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(cat)}
                              onChange={() => toggleCategory(cat)}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {selectedCategories.includes(cat) && (
                              <div className="w-2 h-2 bg-[#f3a847]" />
                            )}
                          </div>
                          <span className="text-sm text-gray-500 group-hover:text-[#131921] transition-colors">
                            {cat}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-300 tabular-nums">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#131921] mb-4">
                  Price
                </h3>
                <div className="px-1">
                  <div className="relative h-1 bg-gray-200 mb-5">
                    <div
                      className="absolute h-full bg-[#f3a847]"
                      style={{
                        left: `${
                          ((priceRange[0] - priceLimit[0]) /
                            (priceLimit[1] - priceLimit[0] || 1)) *
                          100
                        }%`,
                        right: `${
                          100 -
                          ((priceRange[1] - priceLimit[0]) /
                            (priceLimit[1] - priceLimit[0] || 1)) *
                            100
                        }%`,
                      }}
                    />
                    <input
                      type="range"
                      min={priceLimit[0]}
                      max={priceLimit[1]}
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(0, e.target.value)}
                      className="absolute w-full -top-2 appearance-none bg-transparent cursor-pointer"
                      style={{ zIndex: 2 }}
                    />
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
                {(priceRange[0] !== priceLimit[0] ||
                  priceRange[1] !== priceLimit[1]) && (
                  <button
                    onClick={() => setPriceRange(priceLimit)}
                    className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-[#f3a847] transition-colors"
                  >
                    Reset price
                  </button>
                )}
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 py-2.5 hover:border-red-300 hover:text-red-400 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          {/* ── MOBILE FILTERS DRAWER ── */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-[#131921] uppercase tracking-widest">
                    Filters
                  </h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 hover:text-[#131921]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="mb-8">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#131921] mb-4">
                    Search
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products…"
                      className="w-full border-b border-gray-200 pb-2 pr-8 text-sm outline-none focus:border-[#f3a847] placeholder:text-gray-300"
                    />
                    <Search size={14} className="absolute right-0 top-0.5 text-gray-400" />
                  </div>
                </div>

                {/* Mobile Categories */}
                <div className="mb-8">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#131921] mb-4">
                    Category
                  </h3>
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="relative w-4 h-4 border border-gray-300 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat)}
                            onChange={() => toggleCategory(cat)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          {selectedCategories.includes(cat) && (
                            <div className="w-2 h-2 bg-[#f3a847]" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Mobile Price */}
                <div className="mb-8">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#131921] mb-4">
                    Price Range
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(0, e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#f3a847]"
                    />
                    <span className="text-gray-300">—</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(1, e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#f3a847]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full bg-[#131921] text-white text-xs font-bold uppercase tracking-[0.2em] py-3 hover:bg-[#f3a847] hover:text-[#131921] transition-colors"
                  >
                    Apply Filters
                  </button>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { clearFilters(); setShowMobileFilters(false); }}
                      className="w-full border border-gray-200 text-gray-400 text-xs font-bold uppercase tracking-[0.2em] py-3 hover:text-red-400 hover:border-red-200 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-[#f9f9f9] py-20 reveal">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#f3a847] text-xs uppercase tracking-[0.4em] mb-3">
            Custom Orders
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#131921] mb-4">
            Looking for Something Unique?
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            We create custom bracelets tailored to your style. From engraving to
            custom designs, let us bring your vision to life.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-[#131921] hover:bg-[#232f3e] text-white font-bold px-10 py-3 transition-all duration-300 text-xs tracking-[0.3em] uppercase hover:-translate-y-0.5"
          >
            Get in Touch
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Shop;
