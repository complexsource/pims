import React from "react";
import { MapPin, ArrowRight, Home, Star } from "lucide-react";
import Link from "next/link";
import properties from "../data/properties";

const PremiumInvestmentProperties = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Home size={14} />
            Featured Investments
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Premium Investment Opportunities
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover hand-selected properties with exceptional investment
            potential and proven returns.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.slug}`}
              className="block"
            >
              <div className="bg-white rounded-2xl hover:scale-105 transition-transform duration-300  hover:shadow-xl overflow-hidden">
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Featured Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
                      <Star size={14} />
                      Featured
                    </span>
                  </div>
                  {/* ROI Glass Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="text-gray-900 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-sm font-semibold shadow-md border border-white/30">
                      {property.investmentOverview.roi}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {property.title}
                  </h3>

                  <div className="flex items-start gap-2 text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="text-sm">{property.address}</span>
                  </div>

                  {/* Price + Rent */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {property.price}
                    </span>
                    <span className="text-base font-semibold text-green-600">
                      {property.investmentOverview.monthlyRent}
                    </span>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-gray-200 my-4"></div>

                  {/* Specs */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>{property.details.bedrooms} bed</span>
                    <span>{property.details.bathrooms} bath</span>
                    <span>{property.details.sqft} sqft</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href={"/properties"}
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200"
          >
            View All Properties
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PremiumInvestmentProperties;
