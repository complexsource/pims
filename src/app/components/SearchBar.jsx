// components/SearchBar.jsx
import {
  Building,
  BedDouble,
  Bath,
  LocateFixed,
  Home,
  Filter,
  Sparkles,
  ChevronDown,
  Search,
} from "lucide-react";

export default function SearchBar() {
  return (
    <div className="w-full px-4 py-4  top-[64px] left-0 z-40 backdrop-blur-md bg-white/30 border-b border-white/30 shadow-xl flex flex-col items-center gap-4">
      {/* Top Search Input */}
      <div className="w-full max-w-7xl flex items-center gap-3">
        {/* Search Bar */}
        <div className="flex flex-grow items-center gap-2 px-4 py-2 rounded-md backdrop-blur-md border border-white/30 shadow-md bg-white/60">
          <Search className="text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by address, neighborhood, or ZIP..."
            className="w-full outline-none bg-transparent placeholder-gray-400 text-gray-700"
          />
        </div>

        {/* Search Button */}
        <button className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-md shadow hover:opacity-90 transition whitespace-nowrap">
          Search
        </button>
      </div>

      {/* Filter Buttons Row */}
      <div className="w-full max-w-7xl flex gap-2 px-1 overflow-x-auto 2xl:flex-wrap 2xl:justify-between 2xl:overflow-visible">
        <FilterButton
          icon={
            <div className="bg-green-500/20 p-2 rounded-full">
              <Building className="text-green-500 w-4 h-4" />
            </div>
          }
          label="For Sale"
        />
        <FilterButton
          icon={
            <div className="bg-green-500/20 p-2 rounded-full">
              <Building className="text-green-500 w-4 h-4" />
            </div>
          }
          label="Price"
        />
        <FilterButton
          icon={
            <div className="bg-blue-500/20 p-2 rounded-full">
              <BedDouble className="text-blue-800 w-5 h-5" />
            </div>
          }
          label="Any Beds"
        />
        <FilterButton
          icon={
            <div className="bg-purple-500/20 p-2 rounded-full">
              <Bath className="text-purple-500 w-4 h-4" />
            </div>
          }
          label="Any Baths"
        />
        <FilterButton
          icon={
            <div className="bg-orange-400/20 p-2 rounded-full">
              <LocateFixed className="text-orange-400 w-4 h-4" />
            </div>
          }
          label="Commute Time"
          subLabel="to Downtown LA"
        />
        <FilterButton
          icon={
            <div className="bg-orange-500/20 p-2 rounded-full">
              <Home className="text-orange-500 w-4 h-4" />
            </div>
          }
          label="Home Type"
        />
        <FilterButton
          icon={
            <div className="bg-gray-500/10 p-2 rounded-full">
              <Filter className="text-gray-600 w-4 h-4" />
            </div>
          }
          label=""
        />
        <FilterButton
          icon={
            <div className="bg-yellow-500/20 p-2 rounded-full">
              <Sparkles className="text-yellow-500 w-4 h-4" />
            </div>
          }
          label="Save Search"
        />
      </div>
    </div>
  );
}

function FilterButton({ icon, label, subLabel }) {
  return (
    <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50 shadow-md hover:bg-gray-100 transition-all text-sm whitespace-nowrap">
      {icon}
      <div className="flex flex-col items-start">
        {label && <span className="font-medium text-gray-700">{label}</span>}
        {subLabel && (
          <span className="text-xs text-gray-400 leading-none">{subLabel}</span>
        )}
      </div>
      <ChevronDown className="w-3 h-4 text-gray-400 ml-1" />
    </button>
  );
}
