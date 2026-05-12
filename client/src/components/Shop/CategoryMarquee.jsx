import { useMemo } from 'react';
import { Link } from 'react-router-dom';

function CategoryMarquee({ products = [], categories = [] }) {
  // Pick the first product image per category as the thumbnail
  const categoryItems = useMemo(() => {
    return categories.map((cat) => {
      const match = products.find((p) => p.category === cat);
      return { name: cat, image: match?.image ?? null };
    }).filter((c) => c.image !== null);
  }, [products, categories]);

  if (categoryItems.length === 0) return null;

  // Duplicate so the seam is invisible when we translate -50%
  const track = [...categoryItems, ...categoryItems];

  return (
    <div className="overflow-hidden bg-[#1a120a] py-6 select-none">
      <div className="marquee-track flex items-center w-max">
        {track.map((cat, i) => (
          <div key={i} className="flex items-center shrink-0">
            {/* Category pill */}
            <Link
              to={`/shop?category=${cat.name}`}
              className="flex items-center gap-4 px-10 group"
            >
              {/* Circular image */}
              <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-[#f3a847] transition-all duration-300">
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {/* Subtle vignette on image */}
                <div className="absolute inset-0 rounded-full bg-black/10" />
              </div>

              {/* Label */}
              <span className="text-white/70 group-hover:text-[#f3a847] font-light tracking-[0.25em] text-sm uppercase whitespace-nowrap transition-colors duration-300">
                {cat.name} Jewellery
              </span>
            </Link>

            {/* Decorative dot separator */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#f3a847]/40 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryMarquee;
