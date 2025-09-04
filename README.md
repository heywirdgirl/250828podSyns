# POD Sync

Ứng dụng này đồng bộ hóa và hiển thị dữ liệu sản phẩm từ dịch vụ In theo Yêu cầu (Print-on-Demand) của bạn (Printful) bằng Next.js và Firebase Firestore. Nó sử dụng Firebase Admin SDK để ghi dữ liệu an toàn từ phía máy chủ và cung cấp các Server Actions để tương tác với Printful API.

## Các tính năng

- **Đồng bộ hóa sản phẩm**: Lấy dữ liệu sản phẩm chi tiết (bao gồm các biến thể) từ API Printful và lưu trữ trong Firestore. Mỗi sản phẩm được lưu thành một tài liệu riêng biệt.
- **Lịch sử đồng bộ hóa**: Ghi lại mỗi lần đồng bộ hóa và hiển thị lịch sử trong 30 ngày qua.
- **Tạo đơn hàng nháp**: Cung cấp một Server Action an toàn để tạo đơn hàng nháp trên Printful từ dữ liệu đơn hàng trong Firestore.
- **Kiểm tra cấu hình**: Thông báo cho người dùng nếu các khóa API cần thiết bị thiếu.
- **An toàn**: Sử dụng Firebase Admin SDK cho các hoạt động ghi dữ liệu phía máy chủ.

## Bắt đầu

Để chạy ứng dụng này, bạn cần thiết lập các biến môi trường cho Firebase Admin và Printful.

### 1. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 2. Thiết lập biến môi trường

1.  **Tạo một Service Account:**
    *   Đi tới Bảng điều khiển Firebase của bạn.
    *   Nhấp vào biểu tượng bánh răng và chọn **Project settings**.
    *   Chuyển đến tab **Service accounts**.
    *   Nhấp vào nút **Generate new private key**. Một tệp JSON sẽ được tải xuống máy tính của bạn. **Hãy giữ tệp này an toàn và bí mật.**

2.  **Thiết lập biến môi trường:**
    *   Tạo một tệp có tên `.env.local` trong thư mục gốc của dự án.
    *   Mở tệp JSON bạn vừa tải xuống và sao chép các giá trị tương ứng vào tệp `.env.local`.
    *   Thêm khóa API Printful của bạn.

    Tệp `.env.local` của bạn sẽ trông như sau:

    ```
    # Cấu hình Firebase Admin (từ tệp JSON)
    FIREBASE_PROJECT_ID="your-project-id"
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-....@your-project-id.iam.gserviceaccount.com"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your-private-key...\n-----END PRIVATE KEY-----\n"

    # Khóa API Printful
    PRINTFUL_API_KEY=YOUR_PRINTFUL_API_KEY
    ```

    **Quan trọng:** Khi sao chép `private_key`, hãy đảm bảo nó nằm trong dấu ngoặc kép và tất cả các ký tự dòng mới (`\n`) được giữ nguyên.

### 3. Thiết lập Quy tắc Bảo mật Firestore

Để cho phép ứng dụng của bạn đọc dữ liệu công khai và cho phép client tạo đơn hàng mới, hãy sử dụng các quy tắc sau trong Firestore:

*   Trong Bảng điều khiển Firebase, đi tới **Firestore Database > Rules**.
*   Sao chép nội dung từ tệp `firestore.rules` trong dự án và dán vào.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc công khai cho sản phẩm và lịch sử đồng bộ
    match /products/{productId} {
      allow read: if true;
      allow write: if false; // Chỉ cho phép ghi từ server
    }

    match /syncHistory/{logId} {
      allow read: if true;
      allow write: if false; // Chỉ cho phép ghi từ server
    }
    
    // Cho phép client tạo đơn hàng mới nhưng không cho phép sửa đổi hoặc xóa
    match /orders/{orderId} {
      allow read: if true; // Cho phép đọc để client có thể theo dõi trạng thái
      allow create: if true; // Cho phép client tạo đơn hàng
      allow update, delete: if false; // Không cho phép client cập nhật hoặc xóa
    }
  }
}
```

### 4. Chạy máy chủ phát triển

```bash
npm run dev
```

Mở [http://localhost:9002](http://localhost:9002) trong trình duyệt của bạn để xem kết quả.

## Hướng dẫn cho Client App: Tạo Đơn hàng

Ứng dụng này cung cấp một Server Action an toàn là `createPrintfulDraftOrder` để tạo đơn hàng nháp trên Printful. Dưới đây là cách bạn có thể gọi nó từ một ứng dụng client (ví dụ: một trang thanh toán).

### Ví dụ về Component React

Đây là một ví dụ về một component form đơn giản để thu thập thông tin người nhận và gửi yêu cầu tạo đơn hàng.

```tsx
// src/components/OrderForm.tsx
"use client";

import { useState, useTransition } from 'react';
import { createPrintfulDraftOrder } from '@/lib/actions';
import type { Recipient, OrderItem } from '@/lib/types';

export default function OrderForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    // Dữ liệu mẫu - trong ứng dụng thực tế, bạn sẽ lấy dữ liệu này từ giỏ hàng
    const items: OrderItem[] = [
      {
        sync_variant_id: 4927683005, // ID của biến thể sản phẩm trên Printful
        quantity: 1,
      },
      {
        sync_variant_id: 4927683006,
        quantity: 2,
      },
    ];

    // Lấy dữ liệu từ form
    const formData = new FormData(event.currentTarget);
    const recipient: Recipient = {
      name: formData.get('name') as string,
      address1: formData.get('address1') as string,
      city: formData.get('city') as string,
      state_code: formData.get('state_code') as string,
      country_code: formData.get('country_code') as string,
      zip: formData.get('zip') as string,
    };

    startTransition(async () => {
      const response = await createPrintfulDraftOrder({ recipient, items });
      if (response.success) {
        setResult({ success: true, message: `Đã tạo đơn hàng thành công! ID đơn hàng Firestore: ${response.orderId}` });
      } else {
        setResult({ success: false, message: `Tạo đơn hàng thất bại: ${response.error}` });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold">Thông tin giao hàng</h2>
      {/* Các trường input cho tên, địa chỉ, v.v. */}
      <div>
        <label htmlFor="name">Họ tên</label>
        <input name="name" id="name" required className="border p-2 w-full" defaultValue="John Doe" />
      </div>
      <div>
        <label htmlFor="address1">Địa chỉ</label>
        <input name="address1" id="address1" required className="border p-2 w-full" defaultValue="123 Main St" />
      </div>
      <div>
        <label htmlFor="city">Thành phố</label>
        <input name="city" id="city" required className="border p-2 w-full" defaultValue="Los Angeles" />
      </div>
      <div>
        <label htmlFor="state_code">Mã tiểu bang</label>
        <input name="state_code" id="state_code" required className="border p-2 w-full" defaultValue="CA" />
      </div>
      <div>
        <label htmlFor="country_code">Mã quốc gia</label>
        <input name="country_code" id="country_code" required className="border p-2 w-full" defaultValue="US" />
      </div>
      <div>
        <label htmlFor="zip">Mã bưu điện</label>
        <input name="zip" id="zip" required className="border p-2 w-full" defaultValue="90001" />
      </div>

      <button type="submit" disabled={isPending} className="bg-blue-500 text-white px-4 py-2 rounded">
        {isPending ? 'Đang xử lý...' : 'Đặt hàng'}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </form>
  );
}
```

### Cách hoạt động

1.  **Client-Side Form**: Người dùng điền thông tin và nhấn "Đặt hàng".
2.  **Gọi Server Action**: `handleSubmit` thu thập dữ liệu và gọi hàm `createPrintfulDraftOrder` đã được import.
3.  **Thực thi trên Server**: Toàn bộ logic trong `createPrintfulDraftOrder` (tạo document Firestore, gọi API Printful, cập nhật document) được thực thi an toàn trên máy chủ. API key của bạn không bao giờ bị lộ ra client.
4.  **Phản hồi**: Server Action trả về kết quả (`success`, `orderId`, hoặc `error`), và giao diện người dùng cập nhật tương ứng.
