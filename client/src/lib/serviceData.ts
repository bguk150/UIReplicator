// Service Menu Data Structure
export interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
  duration?: string; // Optional duration information
}

export interface ServiceCategory {
  id: string;
  name: string;
  services: Service[];
}

// Full service menu organized by categories exactly as requested
export const serviceMenu: ServiceCategory[] = [
  {
    id: "main-services",
    name: "Main Services",
    services: [
      {
        id: "standard-cut",
        name: "Standard Cut",
        price: "£23+",
        description: "Classic haircut with expert styling",
        duration: "30 min"
      },
      {
        id: "skin-fade",
        name: "Skin Fade",
        price: "£26+",
        description: "Precision cut fading to skin",
        duration: "35 min"
      },
      {
        id: "beard-cut",
        name: "Beard Cut",
        price: "£16+",
        description: "Expert beard styling and shaping",
        duration: "15 min"
      },
      {
        id: "traditional-shave",
        name: "Traditional Shave",
        price: "£18+",
        description: "Classic hot towel straight razor shave",
        duration: "25 min"
      },
      {
        id: "buzz-cut",
        name: "Buzz Cut",
        price: "£18+",
        description: "Quick and even all-over cut",
        duration: "20 min"
      },
      {
        id: "hair-beard",
        name: "Hair + Beard (Including Wash)",
        price: "£38+",
        description: "Complete haircut and beard styling with wash",
        duration: "50 min"
      }
    ]
  },
  {
    id: "vip",
    name: "VIP",
    services: [
      {
        id: "vip-package",
        name: "VIP Package",
        price: "£55",
        description: "Hair Cut, Beard, Face Mask, Hot Wax, Hot Towel, Wash",
        duration: "75 min"
      }
    ]
  },
  {
    id: "deals",
    name: "Deals",
    services: [
      {
        id: "kids-cut",
        name: "Kids (Under 12 years old)",
        price: "£18+",
        description: "Special haircuts for children under 12",
        duration: "25 min"
      },
      {
        id: "pensioners-cut",
        name: "Pensioners (65 years old +)",
        price: "£16+",
        description: "Special rate for seniors",
        duration: "30 min"
      }
    ]
  },
  {
    id: "extras",
    name: "Extras",
    services: [
      {
        id: "hot-towel",
        name: "Hot Towel",
        price: "£5",
        description: "Refreshing hot towel treatment",
        duration: "10 min"
      },
      {
        id: "hot-wax",
        name: "Hot Wax",
        price: "£6+",
        description: "Ear and nose hair removal with hot wax",
        duration: "15 min"
      },
      {
        id: "face-mask",
        name: "Face Mask",
        price: "£8",
        description: "Rejuvenating facial treatment",
        duration: "15 min"
      },
      {
        id: "hair-wash",
        name: "Hair Wash",
        price: "£5+",
        description: "Thorough hair washing with premium products",
        duration: "10 min"
      },
      {
        id: "massage",
        name: "Massage",
        price: "£6+",
        description: "Relaxing head, neck or shoulder massage",
        duration: "10 min"
      }
    ]
  }
];

// Helper function to get a flat list of all services
export function getAllServices(): Service[] {
  return serviceMenu.flatMap(category => category.services);
}

// Helper function to find service by ID
export function findServiceById(id: string): Service | undefined {
  return getAllServices().find(service => service.id === id);
}

// Helper function to get service price from name
export function getServicePriceByName(name: string): string {
  const service = getAllServices().find(s => s.name === name);
  return service ? service.price : "Price not found";
}

// Helper function to get service category from name
export function getServiceCategoryByName(name: string): string {
  for (const category of serviceMenu) {
    if (category.services.some(service => service.name === name)) {
      return category.name;
    }
  }
  return "Category not found";
}