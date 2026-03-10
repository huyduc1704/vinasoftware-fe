# Vinasoftware Frontend Dashboard

Dự án Next.js (App Router) xây dựng hệ thống quản trị, đặc biệt là module **Quản lý nhân sự (Employee Management)** phân cấp phức tạp.

## 🚀 Tính Năng Chính Mới Triển Khai
- **Authentication**: Luồng đăng nhập, Refresh Token, kiểm soát truy cập và bảo mật thông qua Auth `HttpOnly Cookies` và Next.js proxy.
- **Layout & Routing**: Giao diện Sidebar điều hướng bằng Ant Design. Áp dụng hiệu ứng GSAP cho các tương tác nâng cao.
- **Quản Lý Nhân Sự (Phân cấp)**: 
  - Khai báo và lọc nhân viên theo chức vụ (`TRUONG_KHU_VUC`, `TRUONG_PHONG_CAP_CAO`, `TRUONG_PHONG`, `QUAN_LY`, `NHAN_VIEN_KINH_DOANH`).
  - Hỗ trợ lưu trữ theo cấu trúc phả hệ phân cấp quản lý trực tiếp.
  - Tự động thay đổi fields khai báo tương ứng từng cấp bậc khi tạo mới/cập nhật qua Modal linh hoạt.

## 🛠 Tech Stack
- Framework: [Next.js 15 (App Router)](https://nextjs.org/)
- UI Component: [Ant Design (antd)](https://ant.design/)
- Animation: GSAP & Lenis (Smooth scroll)
- Styling: Custom CSS Modules / Utility CSS

## 🏁 Cài Đặt và Chạy Project Local

Trước khi cài đặt, hãy đảm bảo hệ thống bạn đã cài đặt sẵn Node.js (phiên bản 18.x trở lên).

```bash
# Cài đặt các thư viện cần thiết
npm install
# hoặc yarn install / pnpm install

# Khởi chạy server development
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) trên trình duyệt để sử dụng.
> **Lưu ý**: Hãy chắc chắn **Backend API NestJS** đang chạy tại port `8080` (Cấu hình Proxy đã được tự động forward từ `:3000/api` -> `:8080/api`).

## 📁 Cấu Trúc Thư Mục Nổi Bật

```text
src/
├── app/
│   ├── layout.tsx         # Root layout config global styles, fonts...
│   ├── login/             # Trang đăng nhập
│   └── accounting/
│       └── employee/      # Trang giao diện Bảng quản lý Nhân sự
├── components/
│   ├── layout/            # Sidebar, Header, Global Layout wrapper
│   ├── auth/              # Component đăng nhập Frontend
│   └── accounting/
│       └── employee/      # Employee Modal Component (Tạo / Sửa)
└── utils/
    └── api.ts             # REST API methods + config credentials Fetch API
```
