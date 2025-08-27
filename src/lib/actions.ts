"use server";

import { revalidatePath } from 'next/cache';
import { mockProducts, type Product } from '@/lib/mock-data';

// In a real app, this would be a database, Redis, or a file-based cache.
let lastSyncTime = new Date();

// Simulate fetching from a database/cache
export async function getProducts(): Promise<Product[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockProducts;
}

export async function getLastSyncTime(): Promise<Date> {
  return lastSyncTime;
}

// Simulate fetching from a POD API and updating our "database"
export async function syncProducts(): Promise<{ success: boolean; error?: string }> {
  console.log("Starting product sync...");
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, you would fetch new data here and update your database.
    // For this mock, we'll just update the sync time.
    lastSyncTime = new Date();
    
    console.log("Product sync successful.");
    
    // Revalidate the home page to show new data (in this case, the new sync time)
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("Product sync failed:", error);
    return { success: false, error: "Failed to sync products." };
  }
}
