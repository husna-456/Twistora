import { useState } from 'react';
import { useStateValue } from '../../StateContext';
import { ShoppingBag, Eye, Heart, Star } from 'lucide-react';
import { Link } from 'react-router-dom';



function ProductCard({ product, showAddToBasket = false }) {
  const { dispatch } = useStateValue();
  const [wishlisted, setWishlisted] = useState(false);

  const hasVariants = Array.isArray(product?.variants) && product.variants.length > 0;

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? product.variants[0] : null
  );

  const currentImage =
    selectedVariant?.image && selectedVariant.image.startsWith('http')
      ? selectedVariant.image
      : product?.image;

  const addToBasket = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({
      type: 'ADD_TO_BASKET',
      item: {
        ...product,
        image: currentImage,
        selectedColor: selectedVariant?.color || null,
      },
    });
  };

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
  };

  const handleVariantClick = (e, variant) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariant(
      selectedVariant?.color === variant.color ? product.variants[0] : variant
    );
  };

  return (
    <div className="group bg-white border border-gray-100 hover:border-[#f3a847] hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">

      {/* Image */}
      <Link to={`/product/${product.id}`} className="block relative overflow-hidden bg-[#f9f9f9] aspect-square flex items-center justify-center">
        <img
          src={currentImage}
          alt={product.title}
          className="max-h-full max-w-full object-contain transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.target.src = product.image; }}
        />



        {product.salePrice && (
          <span className="absolute top-3 right-10 bg-orange-500 text-white text-[10px] px-2 py-0.5 font-bold">
            SALE
          </span>
        )}

        <button
          onClick={toggleWishlist}
          className={`absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300 
  opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
  ${wishlisted
              ? 'bg-[#131921] text-white opacity-100 translate-y-0'
              : 'bg-white/80 text-gray-400 hover:text-[#131921]'
            }`}
        >
          <Heart size={12} className={wishlisted ? 'fill-white' : ''} />
        </button>

        <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
          {showAddToBasket ? (
            <button
              onClick={addToBasket}
              className="pointer-events-auto bg-[#f3a847] hover:bg-[#e8a020] text-black text-[10px] font-bold px-5 py-2 flex items-center gap-2 transition-colors"
            >
              <ShoppingBag size={12} />
              Add to Basket
            </button>
          ) : (
            <span className="bg-white text-[#131921] text-[10px] font-bold px-5 py-2 flex items-center gap-2">
              <Eye size={12} />
              View Details
            </span>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="p-4">

        <div className="flex items-center gap-0.5 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={9}
              className={i < Math.floor(product.rating || 0)
                ? 'text-[#f3a847] fill-[#f3a847]'
                : 'text-gray-200 fill-gray-200'}
            />
          ))}
          {product.rating && (
            <span className="text-[10px] text-gray-400 ml-1">({product.rating})</span>
          )}
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-[#131921] mb-2 line-clamp-2 leading-snug hover:text-[#f3a847] transition-colors">
            {product.title}
          </h3>
        </Link>

        {hasVariants && (
          <div className="mb-3">
            <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
              Color:{' '}
              <span className="text-[#131921] font-semibold">
                {selectedVariant?.color || product.variants[0]?.color}
              </span>
            </p>
            <div className="flex items-center gap-1 flex-wrap">
              {product.variants.map((variant, i) => (
                <button
                  key={i}
                  onClick={(e) => handleVariantClick(e, variant)}
                  title={variant.color}
                  style={{ backgroundColor: variant.hex || '#d1d5db' }}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${selectedVariant?.color === variant.color
                      ? 'ring-2 ring-[#131921] ring-offset-1 scale-110'
                      : 'ring-1 ring-gray-200 hover:ring-[#131921] hover:scale-110'
                    }`}
                />
              ))}
            </div>
          </div>
        )}
        {/* Hex swatches — only if no variants */}
        {!hasVariants && product.colors?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {product.colors.map((color, i) => (
              <span
                key={i}
                className="w-4 h-4 rounded-full ring-1 ring-gray-200"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.salePrice ? (
              <>
                <p className="text-sm font-bold text-red-500">
                  Rs. {product.salePrice.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 line-through">
                  Rs. {product.price?.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-[#131921]">
                Rs. {product.price?.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={addToBasket}
            className="md:hidden bg-[#f3a847] hover:bg-[#e8a020] text-black p-1.5 transition-colors"
          >
            <ShoppingBag size={12} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductCard;
