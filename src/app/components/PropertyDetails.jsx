"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share,
  Heart,
  Calendar,
  Phone,
  Mail,
  Bed,
  Bath,
  Square,
  Car,
  Percent,
  DollarSign,
  Target,
  TrendingUp,
  Home,
  Star,
  ChevronLeft,
  ChevronRight,
  Maximize,
} from "lucide-react";

const PropertyDetailsPage = ({ property }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("Overview");
  const router = useRouter();

  const tabs = ["Overview", "Features", "Location", "Investment"];

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setActiveImageIndex(
      (prev) => (prev - 1 + property.images.length) % property.images.length
    );
  };
  // f5f7ff
  return (
    <div
      className="min-h-screen bg-[#f5f7ff]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {property.title}
              </h1>
              <p className="text-gray-600 flex items-center gap-1">
                <span className="w-4 h-4 text-gray-400">📍</span>
                {property.address}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              {property.status}
            </span>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Share className="w-5 h-5" />
              Share
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Heart className="w-5 h-5" />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden">
                <img
                  src={property.images[activeImageIndex]}
                  alt={property.title}
                  className="w-full h-96 object-cover"
                />
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 bg-white/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm">
                  {activeImageIndex + 1} / {property.images.length}
                </div>
                <button className="absolute bottom-4 right-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-3">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden ${
                      index === activeImageIndex ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <img
                      src={image}
                      alt={`View ${index + 1}`}
                      className="w-20 h-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="w-full overflow-x-auto">
              <div className="flex justify-between sm:justify-around w-max sm:w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-full p-1 mx-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap px-4 sm:px-16 py-2 text-sm font-medium rounded-full transition-all duration-200
          ${
            activeTab === tab
              ? "bg-white text-black shadow-sm"
              : "text-gray-500 hover:text-black"
          }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Content based on active tab */}
            <div className="  ">
              {activeTab === "Overview" && (
                <>
                  {/* Property Details */}
                  <div className="mb-6 bg-[#f8faff] rounded-2xl px-6 py-4">
                    <div className="flex items-center gap-2 mb-6">
                      <Home className="w-5 h-5  text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">
                        Property Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-2  md:grid-cols-4 gap-8 mb-8">
                      {[
                        {
                          icon: <Bed className="w-6 h-6  text-blue-600" />,
                          label: "Bedrooms",
                          value: property.details.bedrooms,
                          bg: "bg-blue-100",
                          bgpad: "bg-green-50/65",
                        },
                        {
                          icon: <Bath className="w-6 h-6 text-purple-600" />,
                          label: "Bathrooms",
                          value: property.details.bathrooms,
                          bg: "bg-purple-100",
                          bgpad: "bg-purple-50/65",
                        },
                        {
                          icon: <Square className="w-6 h-6 text-teal-600" />,
                          label: "Sq Ft",
                          value: property.details.sqft,
                          bg: "bg-teal-100",
                          bgpad: "bg-teal-50/65",
                        },
                        {
                          icon: <Car className="w-6 h-6 text-orange-600" />,
                          label: "Garage",
                          value: property.details.garage,
                          bg: "bg-orange-100",
                          bgpad: "bg-orange-50/65",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`text-center ${item.bgpad} p-4 rounded-md bg-opacity-20	`}
                        >
                          <div
                            className={`${item.bg} p-3 rounded-lg mb-2 inline-flex`}
                          >
                            {item.icon}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {item.value}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Investment Overview */}
                  <div className="mb-6 bg-[#f8faff] rounded-2xl px-6 py-4 ">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-bold text-gray-900">
                        Investment Overview
                      </h3>
                    </div>

                    <div className="grid grid-cols-2  md:grid-cols-4 gap-6">
                      {[
                        {
                          icon: <Percent className="w-6 h-6 text-green-600" />,
                          label: "Annual ROI",
                          value: property.investmentOverview.roi,
                          badge: property.investmentOverview.roiRating,
                          bg: "bg-green-100",
                          bgpad: "bg-green-50/65",
                        },
                        {
                          icon: (
                            <DollarSign className="w-6 h-6 text-blue-600" />
                          ),
                          label: "Monthly Rent",
                          value: property.investmentOverview.monthlyRent,
                          bg: "bg-blue-100",
                          bgpad: "bg-blue-50/65",
                        },
                        {
                          icon: <Target className="w-6 h-6 text-purple-600" />,
                          label: "Cap Rate",
                          value: property.investmentOverview.capRate,
                          bg: "bg-purple-100",
                          bgpad: "bg-purple-50/65",
                        },
                        {
                          icon: (
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                          ),
                          label: "Est. Cash Flow",
                          value: property.investmentOverview.cashFlow,
                          bg: "bg-orange-100",
                          bgpad: "bg-orange-50/65",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`text-center ${item.bgpad} bg-opacity-20 p-4 rounded-lg`}
                        >
                          <div
                            className={`${item.bg} p-3 rounded-lg mb-2 inline-flex`}
                          >
                            {item.icon}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {item.value}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.label}
                          </div>
                          {item.badge && (
                            <span className="inline-block bg-blue-500 text-white px-4 py-1 rounded-xl text-xs mt-1">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="mb-6 bg-[#f8faff] rounded-2xl px-6 py-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Description
                    </h3>
                    <p className="text-gray-700 mb-6">
                      Charming townhouse with modern finishes and excellent
                      location. Close to schools and shopping.
                    </p>
                  </div>
                  <div className="mb-6 bg-[#f8faff] rounded-2xl px-6 py-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                      Property Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Year Built
                            </div>
                            <div className="font-semibold">
                              {property.details.yearBuilt}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Home className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Property Type
                            </div>
                            <div className="font-semibold">
                              {property.details.propertyType}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Days on Market
                            </div>
                            <div className="font-semibold">8 days</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Property Age
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">5 years</span>
                              <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                                Excellent
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "Features" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Property Features
                  </h2>
                  <p className="text-gray-600">
                    Feature details would go here...
                  </p>
                </div>
              )}

              {activeTab === "Location" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Location Details
                  </h2>
                  <p className="text-gray-600">
                    Location information would go here...
                  </p>
                </div>
              )}

              {activeTab === "Investment" && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Investment Analysis
                  </h2>
                  <p className="text-gray-600">
                    Investment analysis would go here...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-[#ffffff] rounded-2xl p-6 ">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {property.price}
              </div>
              <div className="text-gray-600 mb-6">{property.pricePerSqft}</div>

              <div className="space-y-4 bg-green-50 p-5 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Investment Highlights
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected ROI</span>
                    <span className="font-semibold text-green-600">
                      {property.investmentHighlights.expectedROI}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income</span>
                    <span className="font-semibold text-green-600">
                      {property.investmentHighlights.monthlyIncome}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cap Rate</span>
                    <span className="font-semibold text-blue-600">
                      {property.investmentHighlights.capRate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-2xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Schedule Tour
                </button>
                <button className="w-full border border-gray-100 text-gray-700 py-3 px-4 rounded-2xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Agent
                </button>
                <button className="w-full border border-gray-100 text-gray-700 py-3 px-4 rounded-2xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  Request Info
                </button>
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-2xl p-6  space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Listed</span>
                <span className="font-medium">{property.details.listed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Property Type</span>
                <span className="font-medium">
                  {property.details.propertyType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Year Built</span>
                <span className="font-medium">
                  {property.details.yearBuilt}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Walk Score</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {property.details.walkScore}
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Agent Info */}
            <div className="bg-white rounded-2xl p-6 ">
              <h3 className="font-semibold text-gray-900 mb-4">Listed by</h3>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {property.agent.initials}
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {property.agent.name}
                  </h4>

                  <p className="text-sm text-gray-600">
                    {property.agent.company}
                  </p>

                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">
                      {property.agent.rating}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({property.agent.reviews} reviews)
                    </span>
                  </div>

                  <div className=" sm:items-center gap-2 sm:gap-4 mt-3 text-sm">
                    <a
                      href={`tel:${property.agent.phone}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Phone className="w-4 h-4" />
                      {property.agent.phone}
                    </a>
                    <a
                      href={`mailto:${property.agent.email}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Mail className="w-4 h-4" />
                      {property.agent.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Properties */}
            <div className="bg-white rounded-2xl p-6 ">
              <h3 className="font-semibold text-gray-900 mb-4">
                Similar Properties
              </h3>
              {property.similarProperties.map((similar, index) => (
                <div key={index} className="flex gap-4 mb-4">
                  <img
                    src={similar.image}
                    alt={similar.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {similar.name}
                    </h4>
                    <p className="text-sm text-gray-600">{similar.address}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-semibold">{similar.price}</span>
                      <span className="text-sm text-green-600">
                        {similar.roi}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Similar Properties
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;
