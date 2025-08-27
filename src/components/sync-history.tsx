import type { SyncLog } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { History } from 'lucide-react';

type SyncHistoryProps = {
  history: SyncLog[];
};

export default function SyncHistory({ history }: SyncHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <History className="h-5 w-5" />
          Nhật ký đồng bộ (3 tháng qua)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-4">
            {history.map((log, index) => (
              <div key={log.id}>
                <div className="flex justify-between items-center text-sm">
                  <p className="font-medium text-foreground">
                    {new Date(log.syncDate).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {log.productCount} sản phẩm
                  </p>
                </div>
                {index < history.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
