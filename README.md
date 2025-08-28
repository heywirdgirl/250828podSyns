# POD Sync

Ứng dụng này đồng bộ hóa và hiển thị dữ liệu sản phẩm từ dịch vụ In theo Yêu cầu (Print-on-Demand) của bạn (Printful) bằng Next.js và Firebase Firestore. Nó sử dụng Firebase Admin SDK để ghi dữ liệu an toàn từ phía máy chủ.

## Các tính năng

- **Đồng bộ hóa sản phẩm**: Lấy dữ liệu sản phẩm từ API Printful và lưu trữ trong Firestore.
- **Hiển thị sản phẩm**: Hiển thị các sản phẩm đã đồng bộ hóa trong một giao diện sạch sẽ.
- **Lịch sử đồng bộ hóa**: Ghi lại mỗi lần đồng bộ hóa và hiển thị lịch sử trong 3 tháng qua.
- **Kiểm tra cấu hình**: Thông báo cho người dùng nếu các khóa API cần thiết bị thiếu.
- **An toàn**: Sử dụng Firebase Admin SDK cho các hoạt động ghi dữ liệu phía máy chủ.

## Bắt đầu

Để chạy ứng dụng này, bạn cần thiết lập các biến môi trường cho Firebase Admin và Printful.

### 1. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 2. Thiết lập Firebase Admin

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

Để cho phép ứng dụng của bạn đọc dữ liệu từ phía client nhưng chỉ cho phép ghi từ phía server (thông qua Admin SDK), hãy sử dụng các quy tắc sau trong Firestore:

*   Trong Bảng điều khiển Firebase, đi tới **Firestore Database > Rules**.
*   Thay thế nội dung bằng:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc công khai cho sản phẩm và lịch sử đồng bộ
    match /products/{productId} {
      allow read: if true;
      allow write: if false;
    }

    match /syncHistory/{logId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 4. Chạy máy chủ phát triển

```bash
npm run dev
```

Mở [http://localhost:9002](http://localhost:9002) trong trình duyệt của bạn để xem kết quả.

## Cấu trúc thư mục

Đây là tổng quan về cấu trúc của dự án:

```
.
├── src
│   ├── app
│   │   ├── globals.css     # Kiểu CSS toàn cục
│   │   ├── layout.tsx      # Bố cục gốc
│   │   └── page.tsx        # Trang chủ
│   ├── components
│   │   ├── ...             # Các thành phần giao diện người dùng
│   ├── lib
│   │   ├── actions.ts      # Các Server Action (đồng bộ hóa, lấy dữ liệu)
│   │   ├── firebase.ts     # Khởi tạo Firebase Client SDK (nếu cần)
│   │   ├── firebase-admin.ts # Khởi tạo Firebase Admin SDK
│   │   └── types.ts        # Các định nghĩa kiểu TypeScript
├── .env.local              # Tệp biến môi trường (cần tạo)
├── next.config.ts          # Cấu hình Next.js
├── package.json            # Các gói phụ thuộc và script của dự án
└── ...
```

## Nội dung `package.json`

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.6.0",
    "firebase": "^10.11.0",
    "firebase-admin": "^12.2.0",
    "lucide-react": "^0.372.0",
    "next": "14.2.2",
    "react": "^18",
    "react-dom": "^18",
    "tailwind-merge": "^2.3.0",
    "tailwindcss-animate": "^1.0.7"
    // ... các gói phụ thuộc khác
  },
  "devDependencies": {
    // ... các gói phụ thuộc phát triển
  }
}
```
