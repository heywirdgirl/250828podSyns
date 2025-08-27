export type Product = {
  id: string;
  name: string;
  imageUrl: string;
  variantsCount: number;
};

export type SyncLog = {
    id: string;
    syncDate: any;
    productCount: number;
};
