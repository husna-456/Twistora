import { useState } from 'react';
import { useStateValue } from '../../StateContext';
import { ShoppingBag, Star, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

function ProductCard({ product, showAddToBasket = false }) {
  const { dispatch } = useStateValue();
  const [wishlisted, setWishlisted] = useState(false);

  const addToBasket = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: 'ADD_TO_BASKET',
      item: product,
    });
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
  };

  // Color swatches fallback
  const colors = product.colors || ['#f3a847', '#C0C0C0', '#131921'];

  return (
    <div className="group bg-white border border-gray-100/80 hover:border-[#f3a847]/30 luxury-shadow cursor-pointer overflow-hidden">

      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[#f9f9f9] aspect-[3/4]">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#131921]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>

        {/* Wishlist heart */}
        <button
          onClick={toggleWishlist}
          className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${
            wishlisted
              ? 'bg-[#131921] text-white'
              : 'bg-white/80 text-gray-400 hover:text-[#131921] opacity-0 group-hover:opacity-100'
          }`}
        >
          <Heart size={12} className={wishlisted ? 'fill-white' : ''}/>
        </button>

        {/* Sale badge */}
        {product.salePrice && (
          <span className="absolute top-2.5 left-2.5 bg-[#f3a847] text-black text-[9px] px-2 py-1 tracking-[0.2em] uppercase font-bold">
            Sale
          </span>
        )}

        {/* Quick action overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
          {showAddToBasket ? (
            <button
              onClick={addToBasket}
              className="pointer-events-auto bg-[#f3a847] hover:bg-[#e8a020] text-black text-[10px] font-bold px-5 py-2 tracking-[0.2em] uppercase flex items-center gap-2 transition-all duration-300 translate-y-3 group-hover:translate-y-0 shadow-lg"
            >
              <ShoppingBag size={12}/>
              Add to Basket
            </button>
          ) : (
            <span className="bg-white/95 backdrop-blur-sm text-[#131921] text-[10px] font-bold px-5 py-2 tracking-[0.2em] uppercase flex items-center gap-2 transition-all duration-300 translate-y-3 group-hover:translate-y-0 shadow-lg">
              <Eye size={12}/>
              View Details
            </span>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="p-3.5 lg:p-4">
        {/* Color swatches */}
        <div className="flex items-center gap-1.5 mb-2">
          {colors.slice(0, 4).map((color, i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full border border-gray-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Title */}
        <Link to={`/product/${product.id}`}>
          <h3 className="text-xs lg:text-[13px] font-semibold text-[#131921] mb-1.5 line-clamp-2 leading-snug tracking-wide group-hover:text-[#f3a847] transition-colors duration-300">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2">
          <p className="text-xs lg:text-sm font-bold text-[#131921] tracking-wide">
            Rs. {product.salePrice?.toLocaleString() || product.price?.toLocaleString()}
          </p>
          {product.salePrice && (
            <p className="text-[11px] text-gray-400 line-through">
              Rs. {product.price?.toLocaleString()}
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

export default ProductCard;