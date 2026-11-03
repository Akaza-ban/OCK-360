# Phạm vi V1 — OKR360

**Đề tài:** Ứng dụng AI tự động hóa quản lý mục tiêu OKR và đánh giá 360 độ

> Trạng thái thiết kế: TARGET V1 — Phân tích đề tài tìm hiểu, xác định phạm vi đề tài.

## 1. Vấn đề

Một công ty phần mềm quy mô vừa (khoảng 50–300 nhân viên, chia thành nhiều phòng ban/team) đang quản lý mục tiêu và đánh giá nhân viên bằng Excel và email:

| #   | Vấn đề hiện tại                                                 | Hậu quả                                                                |
| --- | --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| P1  | Mục tiêu công ty, phòng ban và cá nhân nằm ở nhiều file rời rạc | Nhân viên không biết việc mình làm phục vụ mục tiêu chung nào          |
| P2  | Tiến độ được tổng hợp thủ công vào cuối tháng/quý               | Ban lãnh đạo phát hiện mục tiêu chậm tiến độ quá muộn                  |
| P3  | Không có lịch sử cập nhật tiến độ                               | Không biết mục tiêu bị chững lại từ khi nào, vì sao                    |
| P4  | Đánh giá cuối kỳ chỉ do quản lý trực tiếp thực hiện             | Đánh giá thiếu khách quan, bỏ sót góc nhìn của đồng nghiệp và cấp dưới |
| P5  | Góp ý qua form/email không ẩn danh thực sự                      | Nhân viên ngại góp ý thẳng thắn, nhất là với cấp trên                  |
| P6  | Kết quả mục tiêu và kết quả đánh giá tách rời nhau              | HR mất nhiều ngày ghép dữ liệu để xét tăng lương, thăng chức           |
| P7  | Ghi chú check-in và nhận xét 360 là văn bản tự do, rất nhiều mà không ai đọc hết | Vướng mắc cần phòng khác xử lý bị bỏ sót; quản lý mất hàng giờ đọc lại để chuẩn bị họp tuần và buổi 1-1 |

## 2. Mục tiêu hệ thống (Goals)

OKR360 là hệ thống web giúp công ty **đặt mục tiêu theo phương pháp OKR**, **theo dõi tiến độ hằng tuần**, và **đánh giá nhân viên 360 độ ẩn danh**, sau đó **ghép hai nguồn dữ liệu thành kết quả cuối kỳ**.

| ID  | Mục tiêu                                                         | Giải quyết vấn đề | Đo lường thành công                                                 |
| --- | ---------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| G1  | Liên kết mục tiêu theo cây công ty → phòng ban → team → cá nhân  | P1                | 100% OKR phòng ban, OKR team và ≥ 80% OKR cá nhân được liên kết lên cấp trên |
| G2  | Tự động tính và cộng dồn tiến độ theo thời gian thực             | P2                | Tiến độ cấp trên cập nhật ngay sau mỗi lần check-in                 |
| G3  | Ghi nhận check-in định kỳ kèm mức độ tự tin và vướng mắc         | P3                | Tỷ lệ KR được check-in hằng tuần ≥ 80%                              |
| G4  | Đánh giá 360 độ từ quản lý, đồng nghiệp, cấp dưới và tự đánh giá | P4                | Mỗi nhân viên nhận đủ số phiếu tối thiểu theo quy định              |
| G5  | Đảm bảo ẩn danh cho đồng nghiệp và cấp dưới, kể cả với Admin/HR  | P5                | Không màn hình, báo cáo, API hay nhật ký nào tiết lộ ai đánh giá ai |
| G6  | Tổng hợp OKR + 360 thành kết quả cuối kỳ                         | P6                | HR xuất được bảng kết quả toàn công ty trong 1 thao tác             |
| G7  | Dùng AI tự đọc phần văn bản để chuyển vướng mắc đến đúng người và chuẩn bị tóm tắt; con người luôn là người quyết định | P7 | Vướng mắc liên phòng được chuyển đến trưởng phòng liên quan trong 15 phút; quản lý có bản nháp 1-1 trong 1 giờ sau khi đóng đợt 360; AI không thay đổi bất kỳ điểm số nào |

## 3. Quy trình nghiệp vụ tổng thể (một chu kỳ quý)

Toàn bộ hệ thống xoay quanh **chu kỳ OKR** (mặc định 1 quý). Mỗi chu kỳ đi qua 4 giai đoạn:

```mermaid
flowchart LR
    A["<b>1. Lập kế hoạch</b><br/>Tuần 0–2<br/><br/>HR mở chu kỳ<br/>Lãnh đạo đặt OKR công ty<br/>Trưởng phòng đặt OKR phòng ban<br/>Team lead đặt OKR team<br/>Nhân viên đặt OKR cá nhân<br/>Liên kết lên cấp trên"]
    B["<b>2. Thực thi</b><br/>Tuần 2–12<br/><br/>Check-in hằng tuần<br/>Tiến độ tự cộng dồn<br/>Quản lý phản hồi check-in<br/>Nhắc nhở OKR bị chững<br/>AI chuyển vướng mắc, bản tin tuần"]
    C["<b>3. Đánh giá</b><br/>Tuần 11–13<br/><br/>HR mở đợt 360<br/>Đề cử và duyệt người đánh giá<br/>Điền phiếu ẩn danh<br/>HR đóng đợt<br/>AI nháp buổi 1-1"]
    D["<b>4. Tổng kết</b><br/>Tuần 13<br/><br/>Chốt điểm OKR<br/>Tổng hợp OKR + 360<br/>HR công bố kết quả<br/>Đóng chu kỳ"]
    A --> B --> C --> D
    D -. "Chu kỳ tiếp theo" .-> A
```

**Ví dụ chuỗi mục tiêu xuyên suốt tài liệu:**

```text
[Công ty]    O: Nâng cao chất lượng sản phẩm
               KR1: Giảm lỗi khách hàng báo từ 50 xuống 20 lỗi/tháng
               KR2: Tăng điểm hài lòng khách hàng từ 7.0 lên 8.5
                 │
[Phòng Dev]    O: Cải thiện quy trình kiểm thử            (liên kết lên O Công ty)
                 KR1: Tăng độ phủ test từ 40% lên 70%
                 KR2: 100% pull request được review trước khi merge
                   │
[Team Thanh toán]  O: Ổn định module thanh toán            (liên kết lên O Phòng Dev)
                     KR1: Giảm lỗi production từ 12 xuống 3 lỗi/tháng
                       │
[Cá nhân]            O: Viết test cho module thanh toán     (liên kết lên O Team Thanh toán)
                       KR1: Viết 50 test case cho module thanh toán
```

## 4. Phạm vi V1 (In scope)

- Đăng nhập bằng email/mật khẩu, JWT, phân quyền theo vai trò ở backend.
- Quản lý tổ chức: phòng ban, team bên trong phòng ban, người dùng, quản lý trực tiếp (quan hệ báo cáo).
- Quản lý chu kỳ OKR: tạo, kích hoạt, đóng.
- Quản lý OKR 4 cấp (công ty, phòng ban, team, cá nhân), tối đa 5 Key Result mỗi Objective. Phòng ban chưa chia team thì OKR cá nhân nối thẳng lên OKR phòng ban.
- 3 kiểu Key Result: **số** (giá trị đầu → giá trị đích, hỗ trợ cả mục tiêu giảm), **phần trăm**, **hoàn thành/chưa hoàn thành**.
- Liên kết OKR với mục tiêu cấp trên; hiển thị dạng cây.
- Check-in: cập nhật giá trị, mức tự tin, ghi chú; lưu lịch sử; quản lý bình luận.
- Tiến độ tự tính và cộng dồn lên các cấp.
- Đánh giá 360 độ: bộ tiêu chí, đợt đánh giá, đề cử và duyệt người đánh giá, điền phiếu, ẩn danh, ngưỡng tối thiểu.
- Kết quả cuối kỳ: điểm OKR + điểm 360 theo trọng số; HR công bố.
- Dashboard theo vai trò; báo cáo và xuất file XLSX/PDF.
- Thông báo trong ứng dụng và email nhắc việc.
- Nhật ký hoạt động (không làm lộ thông tin ẩn danh).
- Hồ sơ cá nhân, đổi mật khẩu.
- Tự động hóa bằng AI (chỉ đọc, phân loại, tóm tắt, cảnh báo, tạo bản nháp):
  - phân loại vướng mắc trong check-in và chuyển đến trưởng phòng liên quan;
  - bản tin tuần cho quản lý;
  - bản nháp buổi 1-1 sau khi đóng đợt 360;
  - phát hiện check-in có mức tự tin mâu thuẫn với ghi chú;
  - rà soát OKR mới tạo (KR đo được không, có trùng lặp không);
  - cảnh báo người viết khi nhận xét 360 có thể làm lộ danh tính;
  - Admin bật/tắt từng luồng, đặt lịch chạy, hạn mức gọi AI và xem lịch sử chạy.

## 5. Ngoài phạm vi V1 (Non-goals)

V1 **không** bao gồm:

- Tích hợp Jira, GitLab, Slack, Microsoft Teams (dự kiến V2 — xem mục 7).
- Các phương pháp quản trị mục tiêu khác như KPI, BSC, MBO.
- Tính lương, thưởng, chế độ nhân sự; hệ thống chỉ **cung cấp dữ liệu** cho các quyết định đó.
- Đăng nhập một lần (SSO), xác thực hai lớp, refresh token.
- Ứng dụng di động native (giao diện web responsive là đủ).
- Nhiều công ty trên một hệ thống (multi-tenant).
- AI chấm điểm, xếp loại, dự đoán nghỉ việc hay đưa ra bất kỳ quyết định nhân sự nào.
- AI dạng chatbot viết hộ OKR hoặc viết hộ nhận xét 360.
- Trình kéo-thả tự tạo luồng tự động tùy ý (kiểu n8n, Zapier); V1 chỉ có các luồng dựng sẵn.
- Phản hồi liên tục ngoài đợt đánh giá (continuous feedback, khen thưởng).

## 6. Kiến trúc mục tiêu (định hướng, chi tiết ở các bước sau)

```text
React frontend (SPA)
    → REST / HTTPS / JSON
Backend API ba tầng (API → Application → Infrastructure)
    → PostgreSQL (cây OKR dùng recursive CTE)
    → Hàng đợi job nền (nhắc nhở, tính lại tiến độ, gửi email, luồng AI)
    → SMTP (email thông báo)
AI worker (chạy nền, đọc sự kiện từ hàng đợi)
    → Ẩn danh hóa dữ liệu → LLM API bên ngoài → kiểm tra JSON trả về
    → Ghi kết quả: thông báo, nhãn, bản nháp chờ người duyệt
```

Thao tác của người dùng (check-in, nộp phiếu, đóng đợt) ghi một sự kiện vào database trong cùng transaction. AI worker xử lý sự kiện sau, nên AI chậm hoặc lỗi không làm chậm hay hỏng thao tác của người dùng.

Backend dùng NestJS. Các lựa chọn công nghệ chi tiết nằm ở [Kiến trúc C4](architecture/c4.md) và [Quyết định kiến trúc](architecture/decisions.md).

## 7. Hướng mở rộng sau V1

| Phiên bản | Tính năng                                                  | Giá trị                                  |
| --------- | ---------------------------------------------------------- | ---------------------------------------- |
| V2        | Tự cập nhật KR từ Jira/GitLab (số issue đóng, số PR merge) | Giảm nhập liệu thủ công cho đội phần mềm |
| V2        | Nhắc check-in qua Slack/Teams                              | Tăng tỷ lệ check-in                      |
| V3        | Phản hồi liên tục, ghi nhận đồng nghiệp                    | Không phải chờ đến cuối kỳ mới góp ý     |
| V2        | AI nháp OKR quý sau từ KR chưa xong và vướng mắc cả quý    | Lập kế hoạch quý mới nhanh hơn           |
| V2        | AI tổng hợp xu hướng phát triển toàn công ty từ nhận xét 360 | HR lên kế hoạch đào tạo theo dữ liệu     |
| V3        | Admin tự tạo luồng tự động (Khi → Nếu → Thì)                | Công ty tự thêm quy trình mà không cần sửa code |

**Liên quan:** [Phân rã chức năng và sơ đồ tư duy](02-features.md)
