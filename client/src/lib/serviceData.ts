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

// Full service menu organized by categories
export const serviceMenu: ServiceCategory[] = [
  {
    id: "haircuts",
    name: "Haircuts",
    services: [
      {
        id: "standard-haircut",
        name: "Standard Haircut",
        price: "£22",
        description: "Classic haircut with expert styling",
        duration: "30 min"
      },
      {
        id: "skin-fade",
        name: "Skin Fade",
        price: "£25",
        description: "Precision cut fading to skin",
        duration: "35 min"
      },
      {
        id: "scissor-cut",
        name: "Scissor Cut",
        price: "£24",
        description: "Meticulous scissor-only haircut",
        duration: "40 min"
      },
      {
        id: "head-shave",
        name: "Head Shave",
        price: "£18",
        description: "Clean head shave with hot towel finish",
        duration: "25 min"
      },
      {
        id: "kids-haircut",
        name: "Kids Haircut (Under 12)",
        price: "£16",
        description: "Gentle haircut for children",
        duration: "20 min"
      }
    ]
  },
  {
    id: "beards",
    name: "Beard Services",
    services: [
      {
        id: "beard-trim",
        name: "Beard Trim",
        price: "£15",
        description: "Precise beard shaping and styling",
        duration: "15 min"
      },
      {
        id: "beard-design",
        name: "Beard Design",
        price: "£20",
        description: "Custom beard styling and design",
        duration: "25 min"
      },
      {
        id: "traditional-shave",
        name: "Traditional Shave",
        price: "£22",
        description: "Classic hot towel straight razor shave",
        duration: "30 min"
      },
      {
        id: "hot-towel-shave",
        name: "Hot Towel Shave",
        price: "£25",
        description: "Luxury straight razor shave with hot towel treatment",
        duration: "35 min"
      }
    ]
  },
  {
    id: "combinations",
    name: "Combination Services",
    services: [
      {
        id: "haircut-beard",
        name: "Haircut & Beard Trim",
        price: "£32",
        description: "Complete haircut and beard styling service",
        duration: "45 min"
      },
      {
        id: "haircut-shave",
        name: "Haircut & Traditional Shave",
        price: "£40",
        description: "Haircut combined with a traditional hot towel shave",
        duration: "60 min"
      },
      {
        id: "skin-fade-beard",
        name: "Skin Fade & Beard Design",
        price: "£40",
        description: "Premium skin fade with custom beard styling",
        duration: "55 min"
      }
    ]
  },
  {
    id: "grooming",
    name: "Premium Grooming",
    services: [
      {
        id: "facial",
        name: "Men's Facial",
        price: "£30",
        description: "Rejuvenating facial treatment for men",
        duration: "30 min"
      },
      {
        id: "eyebrow-trim",
        name: "Eyebrow Trim",
        price: "£8",
        description: "Precision eyebrow shaping",
        duration: "10 min"
      },
      {
        id: "deluxe-package",
        name: "Deluxe Grooming Package",
        price: "£65",
        description: "Haircut, beard trim, facial, and styling",
        duration: "75 min"
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