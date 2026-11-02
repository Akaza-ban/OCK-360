# OKR360 — Frontend prototype

Bản giao diện mẫu viết bằng React + Vite, chạy hoàn toàn bằng **dữ liệu giả** trong `src/lib/data.js`. Chưa gọi API, chưa có backend. Mọi thay đổi (check-in, nộp phiếu, tạo Objective) chỉ lưu trong bộ nhớ trình duyệt và mất khi tải lại trang.

## Chạy thử

```bash
cd src/frontend
npm install
npm run dev
```

Mở địa chỉ Vite in ra (thường là `http://localhost:5173`). Ở trang đăng nhập, bấm một tài khoản demo để vào bằng vai trò đó, hoặc nhập email của tài khoản (ví dụ `lan@okr360.vn`) với mật khẩu `123456`.

| Tài khoản | Vai trò | Nên xem gì |
|---|---|---|
| Nguyễn Thị Lan | Nhân viên | OKR của tôi, check-in, điền phiếu 360 (check-in kèm vướng mắc để thấy AI chuyển việc; viết nhận xét 360 có "hôm tôi ngồi cạnh bạn" để thấy cảnh báo AI), kết quả 360 Q3 có tóm tắt từ quản lý |
| Trần Hoài Nam | Quản lý (team lead Team Thanh toán) | Dashboard đội nhóm, bình luận check-in, duyệt người đánh giá, **Bản tin tuần** do AI viết |
| Đinh Công Sơn | Quản lý (trưởng phòng Dev) | Dashboard đội nhóm gồm OKR phòng ban và OKR của 2 team; tạo OKR team trong Cây OKR |
| Hoàng Thu Hà | Quản lý (Phòng QA) | Kết quả 360 có nhóm bị gộp vì dưới 3 phiếu, **Vướng mắc chuyển đến** từ Phòng Dev |
| Phạm Thu Mai | Nhân sự | Đợt đánh giá 360, kết quả cuối kỳ (chọn chu kỳ Q3/2026), **Bản nháp 1-1** chờ duyệt |
| Lê Văn Hùng | Quản trị viên | Chu kỳ, phòng ban, nhật ký, **Luồng tự động** (bật/tắt, hạn mức, lịch sử chạy); thử vào Kết quả cuối kỳ để thấy trang 403 |

Giao diện theo phong cách Linear: nền tối mặc định, nút mặt trời ở góc dưới sidebar để chuyển sang nền sáng (lựa chọn được nhớ trong trình duyệt), và bảng lệnh `Ctrl K` (hoặc `⌘K` trên Mac) để nhảy tới trang hoặc Objective.

Ngày "hôm nay" của bản demo được cố định là 30/10/2026 (`TODAY` trong `data.js`), để vạch kỳ vọng và nhắc check-in luôn hiển thị giống nhau.

## Cấu trúc

```text
src/
├── main.jsx, App.jsx        # Điểm vào và định tuyến theo hash (#/dashboard…)
├── index.css                # Màu nền tối/sáng, font Inter, thành phần dùng chung
├── components/              # Shell (sidebar, topbar, bảng lệnh Ctrl K), Login, AiWorker (AI chạy ngầm), AiExplain (ngăn "AI đã làm gì?"), ui.jsx, icons.jsx
├── lib/
│   ├── data.js              # Dữ liệu giả: công ty mẫu 13 người, 4 phòng ban + 2 team, 2 chu kỳ, 2 đợt 360
│   ├── okr.js               # Tính tiến độ KR, cộng dồn lên Objective cấp trên, điểm cuối kỳ
│   ├── review.js            # Tổng hợp 360 với ngưỡng ẩn danh 3 phiếu
│   ├── ai.js                # Nhãn của phần tự động hóa AI; giả lập cảnh báo nhận xét 360
│   ├── aiSim.js             # AI giả lập: đổi tên thành mã, trả JSON, kiểm tra khuôn, bản tin tuần
│   ├── aiPipeline.js        # Các bước của mỗi lần chạy AI; dùng cho AI worker và ngăn giải thích
│   ├── auth.js              # Phiên giả và quy tắc phân quyền phía giao diện
│   ├── store.jsx            # Kho dữ liệu trong bộ nhớ (useReducer)
│   └── format.js            # Định dạng số, ngày, điểm
├── features/
│   ├── dashboard/           # Dashboard cá nhân, đội nhóm, công ty
│   ├── okr/                 # OKR của tôi, cây OKR, chi tiết Objective, modal check-in, modal Objective
│   ├── reviews/             # Phiếu cần điền, điền phiếu, đề cử, duyệt, kết quả 360
│   ├── results/             # Kết quả cuối kỳ, báo cáo
│   ├── ai/                  # Vướng mắc chuyển đến, bản tin tuần, bản nháp 1-1, luồng tự động
│   └── admin/               # Chu kỳ, phòng ban, người dùng, đợt đánh giá, bộ tiêu chí, nhật ký
└── pages/                   # Thông báo, hồ sơ cá nhân, 403
```

## Giới hạn của bản mẫu

- Phân quyền trong `lib/auth.js` chỉ để ẩn/hiện giao diện. Bản thật bắt buộc kiểm tra lại toàn bộ ở backend.
- Một số nút quản trị (tạo chu kỳ, sửa phòng ban, xuất file) chỉ hiện thông báo "bản mẫu", chưa thay đổi dữ liệu.
- Khi có API, thay `lib/store.jsx` và `lib/data.js` bằng lớp gọi API; các trang trong `features/` giữ nguyên.
- `components/AiWorker.jsx` là **AI worker giả lập chạy ngầm**: mỗi check-in có vướng mắc hoặc ghi chú đưa việc vào hàng đợi, worker chạy từng bước theo `lib/aiPipeline.js` rồi ghi nhãn, thông báo, bản tin và lịch sử chạy vào kho dữ liệu. Bấm nhãn **Do AI tạo ›** để mở ngăn "AI đã làm gì?" (`components/AiExplain.jsx`). Công tắc "Giả lập dịch vụ AI lỗi" và nút "Chạy thử ngay" của bản tin tuần nằm ở trang Luồng tự động (Admin). Mọi thứ nằm trong bộ nhớ, tải lại trang là mất.
- Bản mẫu **không gọi AI thật**. Nhãn, bản tin, bản nháp là kết quả mẫu trong `data.js`; cảnh báo nhận xét 360 được giả lập bằng vài mẫu câu trong `lib/ai.js`. Bản thật do AI worker ở backend tạo.
