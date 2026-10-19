const DISH_IMAGES = {
  curry: 'https://images.unsplash.com/photo-1772730065344-4cf131b39951?auto=format&fit=crop&w=1000&q=80',
  vegetarian: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80',
  pasta: 'https://images.unsplash.com/photo-1553621043-f607bfbf6640?auto=format&fit=crop&w=1000&q=80',
  seafood: 'https://images.unsplash.com/photo-1655279561980-c72226ffe505?auto=format&fit=crop&w=1000&q=80',
} as const;

const FALLBACK_IMAGES = Object.values(DISH_IMAGES);

export function menuImageFor(id: string, name: string, description: string) {
  const keywords = `${name} ${description}`.toLowerCase();
  if (/vegetarian|vegan|salad|plant|vegetable/.test(keywords)) return DISH_IMAGES.vegetarian;
  if (/seafood|shrimp|fish|prawn/.test(keywords)) return DISH_IMAGES.seafood;
  if (/pasta|noodle|spaghetti/.test(keywords)) return DISH_IMAGES.pasta;
  if (/chicken|curry|rice|surinamese|buffet|signature/.test(keywords)) return DISH_IMAGES.curry;

  const stableIndex = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0) % FALLBACK_IMAGES.length;
  return FALLBACK_IMAGES[stableIndex];
}
