"use client";
import React from "react";
import SearchBar from "../components/SearchBar";
import properties from "../data/properties";
import {
  ChevronDown,
  Clock,
  Heart,
  Bed,
  Bath,
  Car,
  Ruler,
  Calendar,
  TrendingUp,
  MapPin,
  Zap,
  Footprints,
  ArrowRight,
  NavigationIcon,
  Send,
  Circle,
  SortAsc,
} from "lucide-react";
import StayUpdated from "../components/StayUpdated";
import Link from "next/link";

export default function Page() {
  return (
    <div className="w-full">
      {/* Search Bar */}
      <SearchBar />

      <div className="flex flex-col lg:flex-row w-full mx-auto mt-6 gap-6 px-4 mb-4">
        {/* Map Section */}
        <div className="flex-1 bg-gray-100 rounded-xl shadow-inner min-h-[400px] flex items-center justify-center text-gray-400">
          Map will be here
        </div>

        {/* Available Properties */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            {/* Left section: Title + Count + Location Button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <h2 className="text-2xl font-bold text-purple-700">
                  Available Properties
                </h2>
                <p className="text-sm text-gray-500">
                  {properties.length} properties found
                </p>
              </div>

              {/* "To Downtown LA" Button */}
              <button className="flex items-center px-1 border bg-gradient-to-r from-blue-600/20 to-purple-600/10 border-blue-300 text-blue-600 rounded-full text-sm font-medium hover:bg-blue-50 transition-all">
                <NavigationIcon size={14} className="mr-1" />
                to Downtown LA
              </button>
            </div>

            {/* Right section: Sort Button */}
            <button className="flex items-center px-4 py-2 text-sm text-gray-700 bg-white rounded-md hover:shadow-md transition-all">
              <SortAsc
                size={22}
                className="mr-2 p-1 bg-gray-200 rounded-full text-gray-600"
              />
              Price: Low to High
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 ">
            {/* Avg Price */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-blue-50/60 ">
              <div className="bg-blue-500/20 p-2 rounded-full">
                <TrendingUp className="text-blue-800 w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Price</p>
                <p className="text-lg font-semibold text-gray-900">$671K</p>
              </div>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-green-50/60 ">
              <div className="bg-green-500/20 p-2 rounded-full">
                <MapPin className="text-green-800 w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Featured</p>
                <p className="text-lg font-semibold text-gray-900">3</p>
              </div>
            </div>

            {/* Avg Commute */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-purple-50/60 ">
              <div className="bg-purple-500/20 p-2 rounded-full">
                <Zap className="text-purple-800 w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Commute</p>
                <p className="text-lg font-semibold text-gray-900">23 min</p>
              </div>
            </div>

            {/* Walk Score */}
            <div className="flex items-center gap-3 p-2 rounded-xl bg-yellow-50/60 ">
              <div className="bg-orange-400/20 p-2 rounded-full">
                <Footprints className="text-orange-800 w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Avg Walk Score</p>
                <p className="text-lg font-semibold text-gray-900">84</p>
              </div>
            </div>
          </div>

          {/* Property Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {properties.map((property) => (
              <Link
                href={`/properties/${property.slug}`}
                key={property.id}
                className="bg-white rounded-2xl cursor-pointer p-4 hover:shadow-md transition space-y-4"
              >
                {/* Image */}
                <div className="relative w-full h-44 rounded-xl overflow-hidden">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Status Badge */}
                  <span className="absolute top-2 left-2 bg-green-100 text-green-500 text-xs font-semibold px-2 py-1 rounded-full shadow">
                    {property.status}
                  </span>

                  {/* Commute Time Badge */}
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {property.details.commuteTime}
                  </span>

                  {/* Price Badge */}
                  <span className="absolute bottom-2 left-2 bg-white text-gray-900 text-base font-bold px-3 py-1 rounded-lg shadow">
                    {property.price}
                  </span>

                  {/* Heart (Favorite) Icon */}
                  <button className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow hover:scale-105 transition">
                    <Heart className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {/* Title + Price */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {property.title}
                    </p>
                    <p className="text-sm text-gray-500">{property.address}</p>
                  </div>
                  <button className="text-gray-400 hover:text-red-400">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                {/* Commute & Walk Score Box */}
                <div className="rounded-xl bg-gradient-to-r from-blue-200/40 to-purple-200/40 border-blue-100 border p-3 space-y-2">
                  {/* Commute Info */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/20 p-1.5 rounded-full">
                        <NavigationIcon className="text-blue-800 w-3 h-3" />
                      </div>
                      <span className="font-medium text-gray-700">
                        Commute to Downtown LA
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-blue-600">
                      <Zap className="w-4 h-4" />
                      {property.details.commuteTime}
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Circle
                        className={`w-2 h-2 ${
                          property.details.walkScore > 90
                            ? "text-green-500 fill-green-500"
                            : "text-blue-500 fill-blue-500"
                        }`}
                      />
                      <span
                        className={`${
                          property.details.commuteRating?.includes("Excellent")
                            ? "text-green-500 font-medium"
                            : "text-blue-500 font-medium"
                        }`}
                      >
                        {property.details.commuteRating}
                      </span>
                    </span>

                    <span>{property.details.distance}</span>
                  </div>

                  {/* Walk Score */}
                  <div className="flex justify-between items-center text-sm pt-2 bg-white/70 rounded-2xl  p-2 mt-2">
                    <div className="flex items-center gap-2">
                      <Circle
                        className={`w-3 h-3 ${
                          property.details.walkScore > 90
                            ? "text-green-500 fill-green-500"
                            : "text-blue-500 fill-blue-500"
                        }`}
                      />
                      <span className="text-gray-700 font-medium">
                        Walk Score: {property.details.walkScore}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {property.details.walkRating}
                    </span>
                  </div>
                </div>

                {/* Features (Beds, Baths, etc.) */}
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-center">
                  <div className="bg-blue-50 text-blue-700 p-2 rounded-xl flex flex-col items-center">
                    <Bed className="w-5 h-5 mb-1" />
                    {property.details.bedrooms} beds
                  </div>
                  <div className="bg-purple-50 text-purple-700 p-2 rounded-xl flex flex-col items-center">
                    <Bath className="w-5 h-5 mb-1" />
                    {property.details.bathrooms} baths
                  </div>
                  <div className="bg-green-50 text-green-700 p-2 rounded-xl flex flex-col items-center">
                    <Car className="w-5 h-5 mb-1" />
                    {property.details.garage} garage
                  </div>
                  <div className="bg-orange-50 text-orange-700 p-2 rounded-xl flex flex-col items-center">
                    <Ruler className="w-5 h-5 mb-1" />
                    {property.details.sqft} sqft
                  </div>
                </div>

                {/* Footer: Built year, Listed days, Type */}
                <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                  <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Built {property.details.yearBuilt}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {property.details.listed}
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                    {property.details.propertyType}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <StayUpdated />
    </div>
  );
}
