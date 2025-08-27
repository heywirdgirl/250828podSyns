"use client";

import { useTransition } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { syncProducts } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

type SyncStatusProps = {
  lastSync: Date;
};

export default function SyncStatus({ lastSync }: SyncStatusProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncProducts();
      if (result.success) {
        toast({
          title: "Sync Successful",
          description: "Product data has been updated.",
        });
      } else {
        toast({
            variant: "destructive",
            title: "Sync Failed",
            description: result.error || "An unknown error occurred.",
        });
      }
    });
  };

  return (
    <div className="flex items-center gap-4">
      <p className="hidden text-sm text-muted-foreground sm:block">
        Last synced: {formatDistanceToNow(new Date(lastSync), { addSuffix: true })}
      </p>
      <Button onClick={handleSync} disabled={isPending} variant="outline" className="w-[130px]">
        {isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <RefreshCw />
        )}
        <span className="ml-2">{isPending ? 'Syncing...' : 'Sync Now'}</span>
      </Button>
    </div>
  );
}
