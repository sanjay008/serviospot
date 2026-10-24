export type VendorPackage = {
  id: string;
  name: string;
  people: number;
  category: string;
  dishes: string[];
};

/** Dummy packages until the packages API is connected. */
export const VENDOR_PACKAGES: VendorPackage[] = [
  {
    id: 'pkg-1',
    name: 'My package one',
    people: 300,
    category: 'Wedding buffet',
    dishes: ['Rice', 'Chicken curry', 'Vegetables', 'Salad', 'Dessert'],
  },
  {
    id: 'pkg-2',
    name: 'Family dinner',
    people: 50,
    category: 'Home catering',
    dishes: ['Roti', 'Dal', 'Paneer', 'Rice', 'Sweets'],
  },
  {
    id: 'pkg-3',
    name: 'Office lunch',
    people: 80,
    category: 'Corporate',
    dishes: ['Sandwich platter', 'Soup', 'Fruit', 'Drinks'],
  },
];
