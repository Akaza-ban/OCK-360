# Yêu cầu theo INVEST — OKR360 V1

> Trạng thái thiết kế: TARGET V1 — Bước 1

Mỗi user story là tầng thấp nhất của phân rã top-down, đủ nhỏ để làm và kiểm thử độc lập. Các ràng buộc chung (xác thực, phân quyền, kiểm tra dữ liệu, nhật ký, xử lý lỗi, ẩn danh) là **ràng buộc chấp nhận**, không phải tính năng ẩn.

## Tiêu chí INVEST

| Tiêu chí | Áp dụng trong OKR360 |
|---|---|
| **Independent** | Mỗi story tạo ra một kết quả demo được; chỉ phụ thuộc story khác khi bắt buộc. |
| **Negotiable** | Bố cục giao diện và cách cài đặt có thể đổi, miễn giữ nguyên kết quả và quy tắc quyền. |
| **Valuable** | Mỗi story nêu rõ giá trị cho người dùng hoặc công ty. |
| **Estimable** | Đầu vào, đầu ra, vai trò và các trường hợp lỗi quan trọng được ghi rõ. |
| **Small** | Mỗi story nhắm một năng lực chính, chia được thành việc API, nghiệp vụ, lưu trữ, giao diện và test. |
| **Testable** | Mỗi story gắn với tiêu chí chấp nhận quan sát được trong [06-acceptance-criteria.md](06-acceptance-criteria.md). |

## Nhóm story

```text
US01–US03   Truy cập và hồ sơ               (F01, F12)
US04–US06   Tổ chức và chu kỳ               (F02, F03)
US07–US11   Quản lý OKR                     (F04)
US12–US14   Check-in và tiến độ             (F05)
US15–US21   Đánh giá 360 độ                 (F06)
US22        Kết quả cuối kỳ                 (F07)
US23–US26   Dashboard, báo cáo, thông báo, nhật ký   (F08–F11)
```

## Product backlog

| ID | User story | Giá trị | Phụ thuộc | Tiêu chí chấp nhận | Ưu tiên |
|---|---|---|---|---|---|
| US01 | Là người dùng đang hoạt động, tôi muốn đăng nhập để truy cập an toàn vào phần việc mình được phép. | Bảo vệ truy cập | Tài khoản khởi tạo sẵn | AC-UC01 | Must |
| US02 | Là người dùng đã đăng nhập, tôi muốn đăng xuất để thiết bị này xóa phiên làm việc của tôi. | An toàn phiên | US01 | AC-UC02 | Must |
| US03 | Là người dùng, tôi muốn cập nhật hồ sơ và đổi mật khẩu mà không tự đổi được vai trò, để tài khoản luôn đúng và an toàn. | Tự phục vụ | US01 | AC-UC03 | Should |
| US04 | Là Admin hoặc HR, tôi muốn quản lý phòng ban và trưởng phòng để cây OKR phản ánh đúng cơ cấu công ty. | Nền cho cây mục tiêu | US01 | AC-UC04 | Must |
| US05 | Là Admin hoặc HR, tôi muốn quản lý người dùng, vai trò và quản lý trực tiếp để hệ thống biết ai báo cáo cho ai. | Nền cho phân quyền và 360 | US04 | AC-UC05 | Must |
| US06 | Là Admin hoặc HR, tôi muốn tạo, kích hoạt và đóng chu kỳ OKR để cả công ty cùng làm việc trên một mốc thời gian. | Nhịp vận hành chung | US01 | AC-UC06 | Must |
| US07 | Là nhân viên, tôi muốn xem cây OKR toàn công ty để biết mục tiêu của mình đóng góp vào đâu. | Minh bạch, liên kết | US06 | AC-UC07 | Must |
| US08 | Là nhân viên/quản lý/admin, tôi muốn tạo và sửa Objective ở cấp mình được phép để ghi lại điều mình muốn đạt trong chu kỳ. | Có mục tiêu rõ ràng | US06 | AC-UC08 | Must |
| US09 | Là người sở hữu Objective, tôi muốn thêm 1–5 Key Result đo được để biết khi nào mục tiêu đạt. | Mục tiêu đo lường được | US08 | AC-UC09 | Must |
| US10 | Là người sở hữu Objective, tôi muốn liên kết Objective lên mục tiêu cấp trên để tiến độ của tôi đóng góp vào mục tiêu chung. | Liên kết theo cây | US08 | AC-UC10 | Must |
| US11 | Là người sở hữu OKR, Manager hoặc Admin, tôi muốn xóa mềm OKR đặt sai để nó biến khỏi cây và báo cáo nhưng vẫn truy vết được. | Dữ liệu sạch, truy vết được | US08 | AC-UC11 | Should |
| US12 | Là người phụ trách Key Result, tôi muốn check-in giá trị hiện tại và mức tự tin để mọi người thấy tiến độ thật ngay lập tức. | Tiến độ theo thời gian thực | US09 | AC-UC12 | Must |
| US13 | Là nhân viên, tôi muốn xem lịch sử check-in và biểu đồ tiến độ của một KR để biết nó bị chững lại từ khi nào. | Phát hiện sớm vấn đề | US12 | AC-UC13 | Must |
| US14 | Là Manager, tôi muốn bình luận vào check-in của cấp dưới để hỗ trợ kịp thời khi họ gặp vướng mắc. | Kèm cặp liên tục | US12 | AC-UC14 | Could |
| US15 | Là HR, tôi muốn tạo bộ tiêu chí đánh giá để các đợt 360 dùng chung một chuẩn. | Đánh giá nhất quán | US01 | AC-UC15 | Must |
| US16 | Là HR, tôi muốn tạo đợt đánh giá gắn với chu kỳ, chọn người tham gia và các hạn, để tổ chức đánh giá 360 đúng thời điểm. | Vận hành đợt đánh giá | US05, US06, US15 | AC-UC16 | Must |
| US17 | Là người được đánh giá, tôi muốn đề cử 3–5 đồng nghiệp hiểu công việc của mình để nhận góp ý sát thực tế. | Góp ý đúng người | US16 | AC-UC17 | Must |
| US18 | Là Manager, tôi muốn duyệt, thêm hoặc bớt người đánh giá cho cấp dưới để tránh chọn toàn người thân quen. | Đánh giá khách quan | US17 | AC-UC18 | Must |
| US19 | Là người đánh giá, tôi muốn chấm điểm và nhận xét trên phiếu, lưu nháp và nộp, để góp ý thẳng thắn mà không bị lộ danh tính. | Góp ý trung thực | US18 | AC-UC19 | Must |
| US20 | Là HR, tôi muốn theo dõi tỷ lệ nộp phiếu, nhắc người chưa nộp và đóng đợt, để đợt đánh giá kết thúc đúng hạn. | Kiểm soát tiến độ | US19 | AC-UC20 | Must |
| US21 | Là nhân viên, tôi muốn xem kết quả 360 của mình (theo tiêu chí, theo nhóm người đánh giá, chênh lệch với tự đánh giá) để biết điểm cần cải thiện. | Phát triển bản thân | US20 | AC-UC21 | Must |
| US22 | Là HR, tôi muốn tổng hợp điểm OKR và 360 theo trọng số rồi công bố, để có dữ liệu cuối kỳ xét thưởng và phát triển. | Ra quyết định nhân sự | US12, US20 | AC-UC22 | Must |
| US23 | Là người dùng, tôi muốn dashboard theo vai trò để thấy ngay việc cần làm và tình hình mục tiêu. | Tổng quan nhanh | US12 | AC-UC23 | Should |
| US24 | Là Admin, HR hoặc Manager, tôi muốn xem và xuất báo cáo theo bộ lọc để phân tích và chia sẻ. | Phân tích, chia sẻ | US12, US22 | AC-UC24 | Should |
| US25 | Là người dùng, tôi muốn nhận thông báo và nhắc nhở đúng lúc để không quên check-in hay nộp phiếu. | Tăng tỷ lệ tham gia | US12, US16 | AC-UC25 | Should |
| US26 | Là Admin hoặc HR, tôi muốn xem nhật ký hoạt động để truy vết các thay đổi quan trọng. | Trách nhiệm giải trình | US01 | AC-UC26 | Should |

## Đánh giá INVEST từng story

`PASS` nghĩa là thiết kế hiện tại đủ thông tin để lập kế hoạch và nghiệm thu, không có nghĩa đã cài đặt. `REVIEW` nghĩa là cần chốt thêm với mentor trước khi làm.

| Story | I | N | V | E | S | T | Ghi chú |
|---|---|---|---|---|---|---|---|
| US01 | PASS | PASS | PASS | PASS | PASS | PASS | JWT 30 phút, không refresh token. |
| US02 | PASS | PASS | PASS | PASS | PASS | PASS | Đăng xuất phía client. |
| US03 | PASS | PASS | PASS | PASS | PASS | PASS | Các trường được sửa đã ghi rõ. |
| US04 | PASS | PASS | PASS | PASS | PASS | PASS | Cây phòng ban chống vòng lặp. |
| US05 | PASS | PASS | PASS | PASS | PASS | PASS | Quan hệ báo cáo chống vòng lặp. |
| US06 | PASS | PASS | PASS | PASS | PASS | PASS | Máy trạng thái chu kỳ. |
| US07 | PASS | PASS | PASS | PASS | PASS | PASS | Chỉ đọc; hiệu năng cây ở NFR-PERF-003. |
| US08 | PASS | PASS | PASS | PASS | PASS | PASS | Quyền theo cấp OKR. |
| US09 | PASS | PASS | PASS | PASS | PASS | PASS | Công thức tiến độ từng kiểu KR. |
| US10 | PASS | PASS | PASS | PASS | PASS | PASS | Quy tắc liên kết. |
| US11 | PASS | PASS | PASS | PASS | PASS | PASS | Không xóa khi còn OKR con liên kết. |
| US12 | PASS | PASS | PASS | PASS | PASS | PASS | Story quan trọng nhất về kỹ thuật: cộng dồn tiến độ. |
| US13 | PASS | PASS | PASS | PASS | PASS | PASS | Đường kỳ vọng tuyến tính theo thời gian. |
| US14 | PASS | PASS | PASS | PASS | PASS | PASS | Chỉ bình luận, không sửa check-in. |
| US15 | PASS | PASS | PASS | PASS | PASS | PASS | Mẫu đã dùng cho đợt đang chạy thì khóa sửa. |
| US16 | PASS | PASS | PASS | PASS | PASS | PASS | Máy trạng thái đợt đánh giá. |
| US17 | PASS | PASS | PASS | PASS | PASS | PASS | 3–5 đồng nghiệp. |
| US18 | PASS | PASS | PASS | PASS | PASS | PASS | HR duyệt thay khi không có quản lý. |
| US19 | PASS | PASS | PASS | PASS | PASS | PASS | Ẩn danh và "Không đủ thông tin". |
| US20 | PASS | PASS | PASS | PASS | PASS | PASS | HR chỉ thấy số phiếu còn thiếu theo người đánh giá, không thấy cặp ai–ai. |
| US21 | PASS | PASS | PASS | PASS | PASS | PASS | Ngưỡng tối thiểu 3 phiếu mỗi nhóm. |
| US22 | PASS | PASS | PASS | PASS | **REVIEW** | PASS | Story lớn nhất; có thể tách "tính điểm" và "công bố". Tỷ trọng mặc định 60/40 cần mentor xác nhận. |
| US23 | PASS | PASS | PASS | PASS | **REVIEW** | PASS | Ba loại dashboard; nên tách thành 3 story khi lập kế hoạch sprint. |
| US24 | PASS | PASS | PASS | PASS | PASS | PASS | Báo cáo 360 tuân thủ ngưỡng ẩn danh. |
| US25 | PASS | PASS | PASS | PASS | PASS | PASS | Lịch nhắc mô tả ở UC25. |
| US26 | PASS | PASS | PASS | PASS | PASS | PASS | Nhật ký không chứa cặp người đánh giá–người được đánh giá ẩn danh. |

## Ràng buộc chấp nhận xuyên suốt

- Chỉ có 4 vai trò: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`; mọi vai trò kế thừa quyền nhân viên.
- Backend (không phải giao diện React) kiểm tra quyền, quan hệ báo cáo và quyền sở hữu.
- Dữ liệu của chu kỳ `CLOSED` chỉ đọc.
- Truy vấn mặc định loại bỏ bản ghi có `deleted_at`.
- Danh tính người đánh giá ẩn danh không xuất hiện ở bất kỳ API, báo cáo, file xuất hay nhật ký nào dành cho người dùng.
- Lỗi API dùng định dạng `ProblemDetails` (`400`, `401`, `403`, `404`, `409`).

**Liên quan:** [Use case](03-use-cases.md) · [Tiêu chí chấp nhận](06-acceptance-criteria.md)
