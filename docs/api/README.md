# API OKR360

> Trạng thái thiết kế: TARGET V1
>
> Trạng thái triển khai: CHƯA BẮT ĐẦU; backend chưa có

[`openapi.yaml`](openapi.yaml) là hợp đồng giữa frontend và backend, gồm 89 thao tác. Khi hợp đồng và code khác nhau, sửa hợp đồng trước rồi mới sửa code.

Xem dễ nhất bằng cách dán file vào [Swagger Editor](https://editor.swagger.io), hoặc chạy:

```bash
npx @redocly/cli@1.25.15 preview-docs docs/api/openapi.yaml
```

## Quy ước

| Mục | Quy ước |
|---|---|
| Địa chỉ gốc | `/api/v1` |
| Xác thực | `Authorization: Bearer <token>`, hết hạn sau 30 phút, không có refresh token. Chỉ `login` không cần token |
| Định dạng | JSON; xuất file dùng `.xlsx` hoặc `.pdf` |
| Ngày giờ | `YYYY-MM-DD` cho ngày, ISO 8601 cho thời điểm |
| Tiến độ | Số từ 0 đến 1; giao diện nhân 100 khi hiển thị |
| Phân trang | `page` và `pageSize` (tối đa 100); kết quả có `items`, `page`, `pageSize`, `total` |
| ID | Số nguyên 64 bit |

Mỗi thao tác có thêm các trường riêng:

| Trường | Ý nghĩa |
|---|---|
| `x-use-case` | Use case trong [03-use-cases.md](../03-use-cases.md) |
| `x-roles` | Vai trò được gọi. Phạm vi dữ liệu theo quan hệ báo cáo nằm ở phần mô tả |
| `x-permission` | Tên quyền trong use case |
| `x-business-rules` | Mã quy tắc trong [business-rules.md](../requirements/business-rules.md) |

## Lỗi

Mọi lỗi trả về `application/problem+json`, gồm `type`, `title`, `status`, `errorCode` và `traceId`. Giao diện hiện `traceId` làm mã tra cứu.

| Mã | Khi nào |
|---|---|
| `400` | Dữ liệu không hợp lệ; `errors` liệt kê lỗi theo từng trường |
| `401` | Thiếu token, token sai hoặc hết hạn; sai thông tin đăng nhập |
| `403` | Không có quyền với vai trò hoặc dữ liệu này |
| `404` | Không tìm thấy, hoặc đã bị xóa mềm |
| `409` | Sai trạng thái nghiệp vụ, ví dụ chu kỳ đã đóng |
| `429` | Đăng nhập sai quá 5 lần trong 15 phút |

## AI trong API

- Check-in, tạo Objective và đóng đợt 360 không chờ AI. Nhãn AI xuất hiện sau, nên `insight` có thể là `null`.
- `checkReviewComment` là thao tác duy nhất chờ AI, tối đa 5 giây. AI lỗi vẫn trả `200` với `checked: false`, để giao diện cho nộp bình thường.
- Không thao tác nào cho sửa nhãn AI hay đề xuất gốc của AI.
- `AutomationRun` chỉ có số liệu kỹ thuật, không có nội dung gửi cho AI.

## Thao tác thêm so với thiết kế màn hình

Khi viết hợp đồng, 6 thao tác sau được thêm vào vì màn hình cần mà danh sách dự kiến chưa có:

| Thao tác | Lý do |
|---|---|
| `listUserDirectory` | `listUsers` chỉ dành cho Admin và HR, trong khi mọi nhân viên cần tìm đồng nghiệp để đề cử |
| `getCampaign` | Màn hình chi tiết đợt cần thông tin của đợt |
| `listReviewResultSubjects` | Quản lý và HR cần biết xem được kết quả của những ai |
| `getMyFinalResult` | Nhân viên cần xem kết quả cuối kỳ của chính mình |
| `getAutomationRun` | UC28 mở chi tiết một lần chạy |
| `getAiRunExplanation` | Ngăn "AI đã làm gì?" (`SCR-84`) |

## Quyết định khi viết hợp đồng

- Báo cáo `FINAL_RESULTS` của Manager chỉ gồm nhân viên dưới quyền trực tiếp, vì có điểm 360 (BR-080, BR-063).
- Sau khi đóng đợt, `getReviewForm` trả `404` vì câu trả lời đã tách khỏi người chấm. `listMyReviewForms` vẫn cho thấy trạng thái phiếu (BR-057).
- V1 lưu ảnh đại diện dạng đường dẫn `avatarUrl`, chưa có API tải file lên.

**Liên quan:** [Kiến trúc C4](../architecture/c4.md) · [Quy tắc nghiệp vụ](../requirements/business-rules.md) · [Tiêu chí chấp nhận](../06-acceptance-criteria.md)
