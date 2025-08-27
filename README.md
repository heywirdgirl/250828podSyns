# POD Sync

Ứng dụng này đồng bộ hóa và hiển thị dữ liệu sản phẩm từ dịch vụ In theo Yêu cầu (Print-on-Demand) của bạn (Printful) bằng Next.js và Firebase Firestore.

## Các tính năng

- **Đồng bộ hóa sản phẩm**: Lấy dữ liệu sản phẩm từ API Printful và lưu trữ trong Firestore.
- **Hiển thị sản phẩm**: Hiển thị các sản phẩm đã đồng bộ hóa trong một giao diện sạch sẽ.
- **Lịch sử đồng bộ hóa**: Ghi lại mỗi lần đồng bộ hóa và hiển thị lịch sử trong 3 tháng qua.
- **Kiểm tra cấu hình**: Thông báo cho người dùng nếu các khóa API cần thiết bị thiếu.

## Bắt đầu

Để chạy ứng dụng này, bạn cần thiết lập các biến môi trường cho Firebase và Printful.

### 1. Cài đặt các gói phụ thuộc

```bash
npm install
```

### 2. Thiết lập biến môi trường

Tạo một tệp có tên `.env.local` trong thư mục gốc của dự án và thêm nội dung sau. Thay thế các giá trị giữ chỗ bằng thông tin xác thực thực tế của bạn.

```
# Cấu hình Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID

# Khóa API Printful
PRINTFUL_API_KEY=YOUR_PRINTFUL_API_KEY
```

### 3. Chạy máy chủ phát triển

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
│   │   ├── product-card.tsx  # Thành phần thẻ sản phẩm
│   │   ├── sync-history.tsx  # Thành phần lịch sử đồng bộ hóa
│   │   ├── sync-status.tsx   # Nút và trạng thái đồng bộ hóa
│   │   └── ui/               # Các thành phần giao diện người dùng từ ShadCN
│   ├── hooks
│   │   ├── use-mobile.tsx    # Hook để phát hiện thiết bị di động
│   │   └── use-toast.ts      # Hook để hiển thị thông báo
│   └── lib
│       ├── actions.ts      # Các Server Action (đồng bộ hóa, lấy dữ liệu)
│       ├── firebase.ts     # Khởi tạo Firebase
│       ├── types.ts        # Các định nghĩa kiểu TypeScript
│       └── utils.ts        # Các hàm tiện ích
├── .env.local              # Tệp biến môi trường (cần tạo)
├── next.config.ts          # Cấu hình Next.js
├── package.json            # Các gói phụ thuộc và script của dự án
└── tailwind.config.ts      # Cấu hình Tailwind CSS
```

## Nội dung `package.json`

```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/googleai": "^1.14.1",
    "@genkit-ai/next": "^1.14.1",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "embla-carousel-react": "^8.6.0",
    "firebase": "^10.12.2",
    "genkit": "^1.14.1",
    "lucide-react": "^0.475.0",
    "next": "15.3.3",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "genkit-cli": "^1.14.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```
