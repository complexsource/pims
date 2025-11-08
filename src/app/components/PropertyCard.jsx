import { BadgeCheck, BedDouble, Bath, Ruler } from "lucide-react";

export default function PropertyCard({ property }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-sm hover:shadow-xl transition-all duration-300">
      {/* Property Image */}
      <div className="relative h-56 w-full">
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        {/* BADGE */}
        <span className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          Featured
        </span>
      </div>

      {/* Property Info */}
      <div className="p-4 space-y-3">
        {/* Title and Badge */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 truncate">{property.title}</h3>
          <BadgeCheck className="text-green-500 w-5 h-5" />
        </div>

        {/* Address */}
        <p className="text-sm text-gray-500">{property.address}</p>

        {/* Price */}
        <div className="text-blue-600 font-bold text-xl">{property.price}</div>

        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <BedDouble className="w-4 h-4" /> {property.beds} Beds
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4" /> {property.baths} Baths
          </div>
          <div className="flex items-center gap-1">
            <Ruler className="w-4 h-4" /> {property.size}
          </div>
        </div>

        {/* View Details Button */}
        <div className="pt-3">
          <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
