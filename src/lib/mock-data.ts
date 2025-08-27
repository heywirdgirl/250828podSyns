export type Product = {
  id: string;
  name: string;
  imageUrl: string;
  variantsCount: number;
};

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'Cosmic Voyager T-Shirt',
    imageUrl: 'https://picsum.photos/seed/prod_1/600/600',
    variantsCount: 5,
  },
  {
    id: 'prod_2',
    name: 'Oceanic Depths Hoodie',
    imageUrl: 'https://picsum.photos/seed/prod_2/600/600',
    variantsCount: 8,
  },
  {
    id: 'prod_3',
    name: 'Mountain Explorer Mug',
    imageUrl: 'https://picsum.photos/seed/prod_3/600/600',
    variantsCount: 2,
  },
  {
    id: 'prod_4',
    name: 'Abstract Geometry Phone Case',
    imageUrl: 'https://picsum.photos/seed/prod_4/600/600',
    variantsCount: 12,
  },
  {
    id: 'prod_5',
    name: 'Minimalist Sunrise Poster',
    imageUrl: 'https://picsum.photos/seed/prod_5/600/600',
    variantsCount: 3,
  },
  {
    id: 'prod_6',
    name: 'Cyberpunk Cityscape Canvas',
    imageUrl: 'https://picsum.photos/seed/prod_6/600/600',
    variantsCount: 4,
  },
  {
    id: 'prod_7',
    name: 'Vintage Floral Tote Bag',
    imageUrl: 'https://picsum.photos/seed/prod_7/600/600',
    variantsCount: 1,
  },
  {
    id: 'prod_8',
    name: 'Retro Gaming Beanie',
    imageUrl: 'https://picsum.photos/seed/prod_8/600/600',
    variantsCount: 6,
  },
];
