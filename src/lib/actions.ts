"use server";

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp, query, orderBy, limit, setDoc } from 'firebase/firestore';
import type { Product, SyncLog } from '@/lib/types';

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

async function getPrintfulProducts() {
    if (!PRINTFUL_API_KEY) {
        console.error("Lỗi getPrintfulProducts: Biến môi trường PRINTFUL_API_KEY bị thiếu.");
        throw new Error("Missing PRINTFUL_API_KEY environment variable.");
    }

    const response = await fetch('https://api.printful.com/sync/products', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Lỗi API Printful:", errorData);
        throw new Error(`Failed to fetch products from Printful: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.result;
}

export async function getProducts(): Promise<{ products: Product[], error?: string }> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.PRINTFUL_API_KEY) {
    console.error("Lỗi getProducts: Thiếu khóa API hoặc cấu hình Firebase trong các biến môi trường.");
    return { products: [], error: "API keys or Firebase configuration is missing." };
  }
  try {
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    const productList = productSnapshot.docs.map(doc => doc.data() as Product);
    return { products: productList };
  } catch (error) {
    console.error("Lỗi getProducts khi lấy dữ liệu từ Firestore:", error);
    if (error instanceof Error && error.message.includes('permission-denied')) {
        return { products: [], error: "Firestore permission denied. Check your security rules." };
    }
    return { products: [], error: "Could not fetch products." };
  }
}

export async function getSyncHistory(): Promise<SyncLog[]> {
    try {
        const historyCollection = collection(db, 'syncHistory');
        const q = query(historyCollection, orderBy('syncDate', 'desc'), limit(100));
        const historySnapshot = await getDocs(q);
        
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const historyList = historySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    syncDate: data.syncDate.toDate(),
                    productCount: data.productCount,
                } as SyncLog;
            })
            .filter(log => log.syncDate >= threeMonthsAgo);
        
        return historyList;
    } catch (error) {
        console.error("Lỗi getSyncHistory khi lấy lịch sử đồng bộ:", error);
        return [];
    }
}

export async function syncProducts(): Promise<{ success: boolean; error?: string; productCount?: number }> {
  console.log("Bắt đầu đồng bộ hóa sản phẩm...");
  if (!PRINTFUL_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const errorMessage = "Thiếu khóa API hoặc cấu hình Firebase.";
    console.error("Lỗi syncProducts:", errorMessage);
    return { success: false, error: errorMessage };
  }
  
  try {
    const printfulProducts = await getPrintfulProducts();
    const productCount = printfulProducts.length;

    const productsCollection = collection(db, 'products');
    const batch = writeBatch(db);

    printfulProducts.forEach((p: any) => {
        const product: Product = {
            id: p.id.toString(),
            name: p.name,
            imageUrl: p.thumbnail_url,
            variantsCount: p.variants,
        };
        const docRef = doc(productsCollection, product.id);
        batch.set(docRef, product);
    });

    await batch.commit();

    const syncLog: Omit<SyncLog, 'id'> = {
      syncDate: serverTimestamp(),
      productCount: productCount,
    };
    const historyRef = doc(collection(db, 'syncHistory'));
    await setDoc(historyRef, syncLog);
    
    console.log(`Đồng bộ hóa thành công. Đã đồng bộ ${productCount} sản phẩm.`);
    revalidatePath('/');
    
    return { success: true, productCount };
  } catch (error) {
    console.error("Lỗi syncProducts khi đồng bộ hóa:", error);
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
    return { success: false, error: `Failed to sync products: ${errorMessage}` };
  }
}
