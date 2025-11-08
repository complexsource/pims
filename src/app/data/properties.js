const properties = [
  {
    id: 1,
    slug: "contemporary-villa",
    title: "Contemporary Villa",
    address: "456 Beverly Hills Drive, Beverly Hills, CA 90210",
    price: "$875,000",
    pricePerSqft: "$398/sq ft",
    status: "Active",
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80"
    ],
    investmentHighlights: {
      expectedROI: "+15.2% ROI",
      monthlyIncome: "$4,200/mo",
      capRate: "11.5%",
    },
    details: {
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2200,
      garage: 2,
      listed: "5 days ago",
      propertyType: "Villa",
      yearBuilt: 2018,
      walkScore: 95,
      walkRating: "Walker's Paradise",     // NEW
      commuteTime: "22 min",              // NEW
      commuteRating: "Good commute",      // NEW
      distance: "12.1 miles",             // NEW
    },
    investmentOverview: {
      roi: "+15.2% ROI",
      roiRating: "Excellent",
      monthlyRent: "$4,200/mo",
      capRate: "11.5%",
      cashFlow: "$2,100",
    },
    agent: {
      name: "Sarah Johnson",
      company: "BrickVest Realty",
      rating: 4.9,
      reviews: 127,
      phone: "(555) 123-4567",
      email: "sarah@brickvest.com",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b9b27ab8?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    },
    similarProperties: [
      {
        name: "Garden Oasis",
        address: "753 Cedar Court, Glendale, CA 91201",
        price: "$485,000",
        roi: "+8.9% ROI",
        image:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: 2,
    slug: "luxury-townhouse",
    title: "Luxury Townhouse",
    address: "789 Ocean View Street, Santa Monica, CA 90401",
    price: "$1,125,000",
    pricePerSqft: "$608/sq ft",
    status: "Active",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2116&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80"
    ],
    investmentHighlights: {
      expectedROI: "+18.3% ROI",
      monthlyIncome: "$6,800/mo",
      capRate: "13.2%",
    },
    details: {
      bedrooms: 3,
      bathrooms: 2.5,
      sqft: 1850,
      garage: 2,
      listed: "3 days ago",
      propertyType: "Townhouse",
      yearBuilt: 2021,
      walkScore: 97,
      walkRating: "Walker's Paradise",     // NEW
      commuteTime: "15 min",              // NEW
      commuteRating: "Excellent commute", // NEW
      distance: "4.7 miles",              // NEW
    },
    investmentOverview: {
      roi: "+18.3% ROI",
      roiRating: "Good",
      monthlyRent: "$6,800/mo",
      capRate: "13.2%",
      cashFlow: "$3,400",
    },
    agent: {
      name: "Michael Wang",
      company: "BrickVest Realty",
      rating: 4.8,
      reviews: 98,
      phone: "(555) 987-6543",
      email: "michael@brickvest.com",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b9b27ab8?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    },
    similarProperties: [
      {
        name: "Urban Retreat",
        address: "321 Maple Lane, Pasadena, CA 91101",
        price: "$750,000",
        roi: "+10.1% ROI",
        image:
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: 3,
    slug: "downtown-loft",
    title: "Downtown Loft",
    address: "234 Urban Plaza, Downtown LA, CA 90013",
    price: "$695,000",
    pricePerSqft: "$496/sq ft",
    status: "Active",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2053&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2075&q=80"
    ],
    investmentHighlights: {
      expectedROI: "+12.8% ROI",
      monthlyIncome: "$3,950/mo",
      capRate: "10.7%",
    },
    details: {
      bedrooms: 2,
      bathrooms: 2,
      sqft: 1400,
      garage: 1,
      listed: "10 days ago",
      propertyType: "Loft",
      yearBuilt: 2016,
      walkScore: 90,
      walkRating: "Very Walkable",         // NEW
      commuteTime: "10 min",              // NEW
      commuteRating: "Good commute",      // NEW
      distance: "2.5 miles",              // NEW
    },
    investmentOverview: {
      roi: "+12.8% ROI",
      roiRating: "Good",
      monthlyRent: "$3,950/mo",
      capRate: "10.7%",
      cashFlow: "$1,900",
    },
    agent: {
      name: "Wang Lee",
      company: "BrickVest Realty",
      rating: 4.7,
      reviews: 76,
      phone: "(555) 246-8101",
      email: "wang@brickvest.com",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b9b27ab8?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
    },
    similarProperties: [
      {
        name: "City Lights Condo",
        address: "101 Main St, Los Angeles, CA 90012",
        price: "$600,000",
        roi: "+9.5% ROI",
        image:
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
];

export default properties;
