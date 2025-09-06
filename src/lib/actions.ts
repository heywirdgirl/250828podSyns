
"use server";

import { revalidatePath } from 'next/cache';
import { adminDb, hasAdminConfig } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Product, SyncLog, Order } from '@/lib/types';

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;

// Helper function to fetch full product details
async function getFullProductDetails(productId: number): Promise<any> {
    if (!PRINTFUL_API_KEY) {
        throw new Error("Missing PRINTFUL_API_KEY.");
    }

    const response = await fetch(`https://api.printful.com/sync/products/${productId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error(`Lỗi API Printful cho sản phẩm ID ${productId}:`, errorData);
        // Return null or throw an error based on how you want to handle individual failures
        return null; 
    }
    const data = await response.json();
    return data.result;
}


async function getPrintfulProducts() {
    if (!PRINTFUL_API_KEY) {
        console.error("Lỗi getPrintfulProducts: Biến môi trường PRINTFUL_API_KEY bị thiếu.");
        throw new Error("Missing PRINTFUL_API_KEY environment variable.");
    }

    // 1. Get the list of product summaries
    const listResponse = await fetch('https://api.printful.com/sync/products', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!listResponse.ok) {
        const errorData = await listResponse.json();
        console.error("Lỗi API Printful khi lấy danh sách sản phẩm:", errorData);
        throw new Error(`Failed to fetch product list from Printful: ${errorData.error?.message || listResponse.statusText}`);
    }

    const listData = await listResponse.json();
    const productSummaries = listData.result;

    // 2. Fetch full details for each product
    const detailedProducts = await Promise.all(
        productSummaries.map((product: any) => getFullProductDetails(product.id))
    );

    // Filter out any products that failed to fetch
    return detailedProducts.filter(p => p !== null);
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

    if (productCount === 0) {
        console.log("Không tìm thấy sản phẩm nào từ Printful để đồng bộ.");
        return { success: true, productCount: 0 };
    }

    const productsCollection = adminDb!.collection('products');
    const batch = adminDb!.batch();

    printfulProducts.forEach((productData: any) => {
        if (productData && productData.sync_product && productData.sync_product.id) {
            const docRef = productsCollection.doc(productData.sync_product.id.toString());
            batch.set(docRef, productData);
        }
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
  } catch (error: any)
    {
        const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
        console.error("Lỗi syncProducts khi đồng bộ hóa:", errorMessage, error);
        return { success: false, error: `Failed to sync products: ${errorMessage}` };
    }
}


/**
 * Creates a draft order in Printful based on an order from Firestore.
 * This function orchestrates the entire process.
 * @param orderData The order data, e.g., from a checkout form.
 */
export async function createPrintfulDraftOrder(orderData: Omit<Order, 'id' | 'status' | 'createdAt' | 'printfulOrderId'>): Promise<{ success: boolean; orderId?: string; error?: string }> {
    if (!hasAdminConfig || !PRINTFUL_API_KEY) {
        const error = "Server configuration is incomplete. Cannot create order.";
        console.error(error);
        return { success: false, error };
    }

    const ordersCollection = adminDb!.collection('orders');
    let newOrderRef;

    try {
        // 1. Create the initial order document in Firestore
        console.log("Creating initial order in Firestore...");
        newOrderRef = await ordersCollection.add({
            ...orderData,
            status: 'pending_printful', // Initial status
            createdAt: FieldValue.serverTimestamp(),
            printfulOrderId: null,
        });
        console.log(`Created Firestore order with ID: ${newOrderRef.id}`);
        
        // 2. Prepare the request payload for Printful API
        const printfulPayload = {
            recipient: orderData.recipient,
            items: orderData.items,
        };

        // 3. Call Printful API to create a draft order
        console.log("Sending request to Printful API...");
        const response = await fetch('https://api.printful.com/orders?confirm=0', { // confirm=0 creates a draft
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(printfulPayload),
        });

        const printfulResponse = await response.json();

        if (!response.ok) {
            const apiError = `Printful API Error: ${printfulResponse.error?.message || 'Unknown error'}`;
            console.error(apiError, printfulResponse);
            // Update Firestore order to 'failed' status
            await newOrderRef.update({ status: 'failed', error: apiError });
            return { success: false, error: apiError };
        }

        const printfulOrder = printfulResponse.result;

        // 4. Update the Firestore document with Printful order ID and new status
        console.log(`Printful draft order created with ID: ${printfulOrder.id}. Updating Firestore...`);
        await newOrderRef.update({
            status: printfulOrder.status, // Use status from Printful (e.g., 'draft')
            printfulOrderId: printfulOrder.id,
            printfulCosts: printfulOrder.costs,
            printfulShippingInfo: {
                shipping_service_name: printfulOrder.shipping_service_name,
            }
        });

        console.log("Successfully created and linked Printful draft order.");
        return { success: true, orderId: newOrderRef.id };

    } catch (error: any) {
        console.error("An unexpected error occurred in createPrintfulDraftOrder:", error);
        // If an order was created in Firestore, mark it as failed
        if (newOrderRef) {
            await newOrderRef.update({ status: 'failed', error: error.message });
        }
        return { success: false, error: error.message };
    }
}
