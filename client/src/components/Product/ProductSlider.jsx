import { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

import 'swiper/css';
import 'swiper/css/pagination';

const FILTER_CATEGORIES = ['All', 'Gold', 'Silver', 'Diamond', 'Charms', 'Bangles', 'Beaded', 'Couples'];

function ProductSlider({ products = [], title = 'Featured Collection', showFilters = true }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const displayProducts =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory);

  if (!products.length) return null;

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-[#f3a847] text-[10px] uppercase tracking-[0.5em] mb-2 font-medium">
              Our Collection
            </p>
            <h2 className="text-3xl md:text-4xl font-light text-[#131921] tracking-wide">
              {title}
            </h2>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border font-medium transition-all duration-200
                    ${activeCategory === cat
                      ? 'bg-[#131921] text-white border-[#131921]'
                      : 'border-gray-200 text-gray-500 hover:border-[#131921] hover:text-[#131921]'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Slider ── */}
        {displayProducts.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">
            No products in this category yet.
          </p>
        ) : (
          <div className="relative group/slider">

            {/* Prev arrow */}
            <button
              ref={prevRef}
              aria-label="Previous slide"
              className="
                absolute left-0 top-[42%] -translate-y-1/2 z-10
                w-10 h-10 bg-white border border-gray-200 shadow-md
                flex items-center justify-center
                -translate-x-5 opacity-0
                group-hover/slider:-translate-x-5 group-hover/slider:opacity-100
                hover:bg-[#131921] hover:text-white hover:border-[#131921]
                transition-all duration-300 focus:outline-none
              "
            >
              <ChevronLeft size={18} />
            </button>

            {/* Next arrow */}
            <button
              ref={nextRef}
              aria-label="Next slide"
              className="
                absolute right-0 top-[42%] -translate-y-1/2 z-10
                w-10 h-10 bg-white border border-gray-200 shadow-md
                flex items-center justify-center
                translate-x-5 opacity-0
                group-hover/slider:translate-x-5 group-hover/slider:opacity-100
                hover:bg-[#131921] hover:text-white hover:border-[#131921]
                transition-all duration-300 focus:outline-none
              "
            >
              <ChevronRight size={18} />
            </button>

            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              navigation
              pagination={{ clickable: true, dynamicBullets: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
              grabCursor
              slidesPerView={1.3}
              spaceBetween={16}
              breakpoints={{
                480: { slidesPerView: 2, spaceBetween: 16 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 4, spaceBetween: 24 },
              }}
              className="product-slider !pb-12"
            >
              {displayProducts.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto">
                  <ProductCard product={product} showAddToBasket />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductSlider;
