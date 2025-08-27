import { getProducts, getSyncHistory } from '@/lib/actions';
import ProductCard from '@/components/product-card';
import SyncStatus from '@/components/sync-status';
import SyncHistory from '@/components/sync-history';
import { Package, AlertTriangle } from 'lucide-react';

export default async function Home() {
  const { products, error } = await getProducts();
  const syncHistory = await getSyncHistory();

  const hasApiKeys = !error;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Package className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              POD Sync
            </h1>
          </div>
          <SyncStatus lastSync={syncHistory[0]?.syncDate} hasApiKeys={hasApiKeys} />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {!hasApiKeys ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/5 p-12 text-center text-destructive">
            <AlertTriangle className="h-12 w-12" />
            <h2 className="mt-4 text-2xl font-bold">Lỗi Cấu hình</h2>
            <p className="mt-2 max-w-md text-destructive/80">
              Vui lòng đảm bảo các khóa API Printful và cấu hình Firebase của bạn được thiết lập chính xác trong tệp .env.local.
            </p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <Package className="h-12 w-12" />
            <h2 className="mt-4 text-2xl font-bold">Không có sản phẩm nào</h2>
            <p className="mt-2 max-w-md">
              Chưa có sản phẩm nào được đồng bộ hóa. Nhấp vào "Đồng bộ hóa ngay" để bắt đầu.
            </p>
          </div>
        )}
        
        <SyncHistory history={syncHistory} />
      </main>
    </div>
  );
}
