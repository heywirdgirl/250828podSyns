
"use server";

import { revalidatePath } from 'next/cache';
import { adminDb, hasAdminConfig } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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
  if (!hasAdminConfig) {
    return { products: [], error: "API keys or Firebase configuration is missing." };
  }
  
  try {
    const productsCollection = adminDb!.collection('products');
    const productSnapshot = await productsCollection.get();
    const productList = productSnapshot.docs.map(doc => doc.data() as Product);
    return { products: productList };
  } catch (error: any) {
    console.error("Lỗi getProducts khi lấy dữ liệu từ Firestore:", error);
    if (error.code === 'permission-denied') {
        return { products: [], error: "Lỗi quyền truy cập Firestore. Vui lòng kiểm tra lại Quy tắc bảo mật của bạn." };
    }
    return { products: [], error: "Could not fetch products." };
  }
}

export async function getSyncHistory(): Promise<SyncLog[]> {
    if (!hasAdminConfig) {
        return [];
    }
    try {
        const historyCollection = adminDb!.collection('syncHistory');
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const q = historyCollection
            .where('syncDate', '>=', thirtyDaysAgo)
            .orderBy('syncDate', 'desc');
            
        const historySnapshot = await q.get();
        
        const historyList = historySnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    syncDate: data.syncDate.toDate(),
                    productCount: data.productCount,
                } as SyncLog;
            });
        
        return historyList;
    } catch (error: any) {
        console.error("Lỗi getSyncHistory khi lấy lịch sử đồng bộ:", error);
        return [];
    }
}

export async function syncProducts(): Promise<{ success: boolean; error?: string; productCount?: number }> {
  console.log("Bắt đầu đồng bộ hóa sản phẩm...");
  if (!hasAdminConfig || !PRINTFUL_API_KEY) {
    const errorMessage = "Thiếu khóa API hoặc cấu hình Firebase Admin.";
    console.error("Lỗi syncProducts:", errorMessage);
    return { success: false, error: errorMessage };
  }
  
  try {
    const printfulProducts = await getPrintfulProducts();
    const productCount = printfulProducts.length;

    const productsCollection = adminDb!.collection('products');
    const batch = adminDb!.batch();

    printfulProducts.forEach((p: any) => {
        // Lưu toàn bộ đối tượng JSON gốc vào Firestore
        const docRef = productsCollection.doc(p.id.toString());
        batch.set(docRef, p);
    });

    await batch.commit();

    const syncLog = {
      syncDate: FieldValue.serverTimestamp(),
      productCount: productCount,
    };
    const historyRef = adminDb!.collection('syncHistory').doc();
    await historyRef.set(syncLog);
    
    console.log(`Đồng bộ hóa thành công. Đã đồng bộ ${productCount} sản phẩm.`);
    revalidatePath('/');
    
    return { success: true, productCount };
  } catch (error: any) {
    console.error("Lỗi syncProducts khi đồng bộ hóa:", error);
    const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
    return { success: false, error: `Failed to sync products: ${errorMessage}` };
  }
}
