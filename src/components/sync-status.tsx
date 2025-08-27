"use client";

import { useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { syncProducts } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

type SyncStatusProps = {
  lastSync?: Date;
  hasApiKeys: boolean;
};

export default function SyncStatus({ lastSync, hasApiKeys }: SyncStatusProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncProducts();
      if (result.success) {
        toast({
          title: "Đồng bộ hóa thành công",
          description: `Đã cập nhật ${result.productCount} sản phẩm.`,
        });
      } else {
        toast({
            variant: "destructive",
            title: "Đồng bộ hóa thất bại",
            description: result.error || "Đã xảy ra lỗi không xác định.",
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-4">
      <p className="hidden text-sm text-muted-foreground sm:block">
        {lastSync ? `Lần cuối đồng bộ: ${formatDistanceToNow(new Date(lastSync), { addSuffix: true })}` : 'Chưa đồng bộ hóa'}
      </p>
      <Button onClick={handleSync} disabled={isPending || !hasApiKeys} variant="outline" className="w-[130px]">
        {isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <RefreshCw />
        )}
        <span className="ml-2">{isPending ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}</span>
      </Button>
    </div>
  );
}
