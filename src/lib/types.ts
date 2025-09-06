
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Product = any;

export type SyncLog = {
    id: string;
    syncDate: any;
    productCount: number;
};

// Represents a line item in an order
export type OrderItem = {
    sync_variant_id: number;
    quantity: number;
    // You can add more fields like files, options if needed
};

// Represents the shipping recipient
export type Recipient = {
    name: string;
    address1: string;
    city: string;
    state_code: string;
    country_code: string;
    zip: string;
    phone?: string;
    email?: string;
};

// Represents the cost breakdown from Printful
export type PrintfulCosts = {
    subtotal: string;
    shipping: string;
    tax: string;
    total: string;
    currency: string;
};

// Represents shipping information from Printful
export type PrintfulShippingInfo = {
    shipping_service_name: string;
};

// Represents the main order structure
export type Order = {
    id: string; // Firestore document ID
    status: string; // Status from Printful, e.g., 'draft', 'pending', 'failed'
    createdAt: any; // Firestore Timestamp
    recipient: Recipient;
    items: OrderItem[];
    printfulOrderId?: number; // The ID from Printful API
    printfulCosts?: PrintfulCosts; // Cost details from Printful
    printfulShippingInfo?: PrintfulShippingInfo; // Shipping details from Printful
    error?: string; // To store any error messages
};
