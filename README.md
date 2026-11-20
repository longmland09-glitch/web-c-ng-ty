# Xinmiao International — Website

Website cho 芯淼國際股份有限公司 (Xinmiao International Co., Ltd.), Cao Hùng, Đài Loan.
Bốn ngôn ngữ: English (`/`), 繁體中文 (`/zh-tw/`), 日本語 (`/ja/`), Tiếng Việt (`/vi/`).

Next.js 16 + React 19 + Three.js. Triển khai trên Vercel.

## Chạy thử

```bash
npm install
npm run dev
```

## Tính năng

1. **Hero 3D**: mô hình điện cực đồng và lòng khuôn có tia lửa EDM (`src/components/Hero3D.tsx`), xoay được, có chế độ khung dây và mặt cắt.
2. **Cổng báo giá (RFQ)**: kéo thả STEP / IGES / DXF / DWG / PDF / X_T / ZIP, chọn vật liệu, số lượng, dung sai, độ nhám (`src/components/RfqForm.tsx`, API `src/app/api/rfq/route.ts`).
3. **Bảng máy móc & đo kiểm**: dữ liệu trong `src/lib/data.ts` → `machines`.
4. **Dự án theo ngành**: dữ liệu trong `src/lib/data.ts` → `products`, lọc theo ngành, xem ảnh dạng lightbox.
5. **Đa ngôn ngữ & SEO**: nội dung trong `src/lib/i18n.ts`, hreflang, sitemap, dữ liệu có cấu trúc (JSON-LD).

## Bật chức năng nhận bản vẽ qua email

Form gửi bản vẽ qua [Resend](https://resend.com). Trên Vercel → Project → Settings → Environment Variables, thêm:

| Biến | Ví dụ |
| --- | --- |
| `RESEND_API_KEY` | khóa API của Resend |
| `RFQ_TO` | `xm@xmit.com.tw` |
| `RFQ_FROM` | `Xinmiao RFQ <rfq@ten-mien-da-xac-minh>` |
| `SITE_URL` | `https://www.xinmiao.com.tw` (tên miền thật) |

Khi chưa có các biến này, form vẫn kiểm tra dữ liệu nhưng báo khách gửi file qua email `xm@xmit.com.tw`.
Giới hạn 4 MB mỗi lần gửi (giới hạn của Vercel); file lớn hơn khách gửi qua email.

## Hình ảnh

Toàn bộ 61 ảnh (trừ ảnh giữ chỗ) đang được **tải trực tiếp từ xinmiao.com.tw**. Nếu website cũ ngừng hoạt động, ảnh sẽ mất
(trang hiển thị khung thay thế, không bị vỡ). Để tự lưu ảnh: tải từng file vào `public/images/` giữ nguyên đường dẫn, rồi đổi
`IMG` trong `src/lib/data.ts` thành `""` và thêm `/images` vào đầu các đường dẫn.

## Cần bổ sung từ công ty

Website cũ không công bố các thông tin sau, nên trang **chưa hiển thị** chúng (không bịa số liệu):

- [ ] **Chứng chỉ ISO**: thêm vào `company.certifications` trong `src/lib/data.ts`, khối chứng chỉ sẽ tự hiện.
- [ ] **Dung sai / độ nhám đạt được** cho từng sản phẩm: điền `tolerance` và `finish` trong `products`.
- [ ] **CMM, máy chiếu biên dạng**: website cũ chỉ có Keyence VR-6000; thêm vào `machines` nếu có.
- [ ] Số máy của máy dập, xung điện tạo hình, thiết bị kiểm tra (đang ghi "—").
- [ ] Ảnh studio và video 4K cảnh tia lửa EDM / phay 5 trục (nếu quay được, có thể thay hoặc bổ sung cho mô hình 3D).
- [ ] Ảnh khuôn dập (hiện chưa có).
