// This file is no longer used for fetching products, 
// but is kept to avoid breaking imports in component files that might still reference the types.
// The data is now fetched from Firestore.

import type { Product } from './types';

export const mockProducts: Product[] = [];
