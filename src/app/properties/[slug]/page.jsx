'use client';

import PropertyDetailsPage from "../../components/PropertyDetails";
import propertiesData from "../../data/properties";

export default function PropertyPage({ params }) {
  const property = propertiesData.find((p) => p.slug === params.slug);

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center text-2xl">
        Property not found
      </div>
    );
  }

  return <PropertyDetailsPage property={property} />;
}
