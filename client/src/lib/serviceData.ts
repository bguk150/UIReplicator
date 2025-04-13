// Service Menu Data Structure
export interface Service {
  id: string;
  name: string;
  price: string;
  description: string;
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
        id: "beard-cut",
        name: "Beard Cut",
        price: "£16+",
        description: "Expert beard styling and shaping"
      },
      {
        id: "traditional-shave",
        name: "Traditional Shave",
        price: "£18+",
        description: "Classic hot towel straight razor shave"
      },
      {
        id: "buzz-cut",
        name: "Buzz Cut",
        price: "£18+",
        description: "Quick and even all-over cut"
      },
      {
        id: "hair-beard",
        name: "Hair + Beard (Including Wash)",
        price: "£38+",
        description: "Complete haircut and beard styling with wash"
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
        description: "Complete premium grooming experience"
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
        description: "Special haircuts for children under 12"
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
        description: "Refreshing hot towel treatment"
      },
      {
        id: "hot-wax",
        name: "Hot Wax",
        price: "£6+",
        description: "Ear and nose hair removal with hot wax"
      },
      {
        id: "face-mask",
        name: "Face Mask",
        price: "£8",
        description: "Rejuvenating facial treatment"
      },
      {
        id: "hair-wash",
        name: "Hair Wash",
        price: "£5+",
        description: "Thorough hair washing with premium products"
      },
      {
        id: "massage",
        name: "Massage",
        price: "£6+",
        description: "Relaxing head, neck or shoulder massage"
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