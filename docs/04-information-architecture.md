# Kiến trúc thông tin

> Trạng thái thiết kế: TARGET V1
>
> Trạng thái triển khai: CÓ GIAO DIỆN MẪU — React + dữ liệu giả, chưa có API

Tài liệu này trả lời câu hỏi **"hệ thống có những màn hình nào, đi từ màn hình này sang màn hình kia ra sao, và ai được vào màn hình nào?"**. Nó nối user story ở [08-invest-requirements.md](08-invest-requirements.md) với giao diện sẽ vẽ ở bước sau.

![Kiến trúc thông tin OKR360](images/information-architecture.png)

Cách đọc sơ đồ:

- Ô xanh đậm là trang cổng trên menu chính.
- Ô trắng là trang.
- Ô bo tròn là tab hoặc khối nội dung bên trong một trang; ô chồng hai lớp là trang lặp lại cho từng đối tượng (mỗi Objective, mỗi đợt đánh giá có một trang chi tiết).
- Ô vàng là biểu mẫu hoặc công cụ, thường mở dạng modal. Nhãn đỏ cho biết chỉ vai trò đó được vào; nhãn trên trang cổng áp cho cả cột.

Đường dẫn (hash route): `#/login` `#/dashboard` `#/okr/my` `#/okr/tree` `#/okr/:objectiveId` `#/reviews/todo` `#/reviews/forms/:formId` `#/reviews/nominate` `#/reviews/approvals` `#/reviews/results` `#/reviews/results/:userId` `#/final-results` `#/reports` `#/admin/cycles` `#/admin/departments` `#/admin/users` `#/admin/campaigns` `#/admin/campaigns/:campaignId` `#/admin/templates` `#/audit` `#/ai/blockers` `#/ai/digest` `#/ai/drafts` `#/ai/automation` `#/notifications` `#/profile` `#/403`.

Tạo/sửa Objective và Check-in mở dạng **modal** ngay trên trang đang đứng (OKR của tôi, Cây OKR, Chi tiết Objective, Dashboard), để người dùng không bị rời khỏi ngữ cảnh.

**Bộ chọn chu kỳ** trên topbar quyết định dữ liệu của mọi trang OKR, dashboard và báo cáo. Mặc định là chu kỳ đang chạy (`ACTIVE`); chọn chu kỳ đã đóng thì mọi nút sửa và check-in bị ẩn.

## Quyền vào trang

| Trang                                                                         | Ai được vào                                                                                                        |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Dashboard cá nhân, OKR của tôi, Cây OKR, Chi tiết Objective, Thông báo, Hồ sơ | Mọi vai trò                                                                                                        |
| Dashboard đội nhóm                                                            | Manager                                                                                                            |
| Dashboard công ty                                                             | Admin, HR                                                                                                          |
| Phiếu cần điền, Điền phiếu                                                    | Mọi vai trò, chỉ thấy phiếu được giao cho mình                                                                     |
| Đề cử đồng nghiệp                                                             | Mọi vai trò, khi đợt đánh giá đang ở giai đoạn đề cử                                                               |
| Duyệt người đánh giá                                                          | Manager (cho nhân viên dưới quyền trực tiếp); HR (cho nhân viên không có quản lý trực tiếp)                        |
| Kết quả 360                                                                   | Mọi vai trò xem kết quả của bản thân sau khi công bố; Manager xem nhân viên dưới quyền trực tiếp; HR xem mọi người |
| Kết quả cuối kỳ                                                               | HR                                                                                                                 |
| Báo cáo                                                                       | Admin (trừ báo cáo kết quả 360), HR, Manager (chỉ đơn vị mình phụ trách)                                           |
| Chu kỳ OKR, Phòng ban, Người dùng, Nhật ký                                    | Admin, HR                                                                                                          |
| Đợt đánh giá 360, Bộ tiêu chí                                                 | HR                                                                                                                 |
| Vướng mắc chuyển đến                                                          | Trưởng phòng hoặc team lead (chỉ vướng mắc chuyển tới đơn vị mình)                                                 |
| Bản tin tuần                                                                  | Manager (bản tin của đội mình)                                                                                     |
| Bản nháp 1-1                                                                  | Manager (nhân viên dưới quyền trực tiếp); HR (nhân viên không có quản lý trực tiếp)                                |
| Luồng tự động                                                                 | Admin (cấu hình, chạy lại); HR (chỉ xem tab Lịch sử chạy)                                                          |
| Truy cập không có quyền                                                       | `#/403`                                                                                                            |

Mục không có quyền **không hiển thị** trên sidebar. Nút sửa, xóa, check-in chỉ hiện khi người dùng có quyền với đúng đối tượng đó (ví dụ nút Check-in chỉ hiện với Key Result mình phụ trách).

## Danh sách màn hình và nội dung

| Mã       | Màn hình              | Dạng                                                                                 | Nội dung hiển thị chính                                                                                                                                                                                                                                                                                                         | User story                   |
| -------- | --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `SCR-01` | Đăng nhập             | Trang                                                                                | Ô email, mật khẩu, nút đăng nhập, thông báo lỗi chung                                                                                                                                                                                                                                                                           | US01, US02                   |
| `SCR-02` | Dashboard             | Trang, 3 tab theo vai trò                                                            | **Cá nhân:** tiến độ OKR của tôi, KR cần check-in, phiếu cần điền. **Đội nhóm:** OKR phòng ban và OKR các team bên trong (trưởng phòng) hoặc OKR team mình (team lead), thành viên chưa check-in tuần này, OKR có rủi ro. **Công ty:** tiến độ từng phòng ban, tỷ lệ check-in, tỷ lệ nộp phiếu                                  | US23                         |
| `SCR-10` | OKR của tôi           | Trang                                                                                | Danh sách Objective của tôi trong chu kỳ, từng KR với % tiến độ và mức tự tin, nút Check-in, nút Thêm Objective                                                                                                                                                                                                                 | US08, US12                   |
| `SCR-11` | Cây OKR công ty       | Trang                                                                                | Cây 4 cấp công ty → phòng ban → team → cá nhân; mỗi nút có nhãn cấp, tiêu đề, người sở hữu hoặc đơn vị, % tiến độ, màu mức tự tin; bộ lọc phòng ban / team, người, cấp, mức tự tin                                                                                                                                              | US07                         |
| `SCR-12` | Chi tiết Objective    | Trang                                                                                | Tiêu đề, cấp, người sở hữu, Objective cấp trên, danh sách KR, Objective con; khối Lịch sử check-in gồm danh sách, biểu đồ tiến độ, bình luận của quản lý, nhãn AI trên check-in (loại vướng mắc, đã chuyển tới phòng nào, trạng thái xử lý; check-in không khớp); khối Gợi ý rà soát OKR do AI tạo, có nút Bỏ qua; nút sửa, xóa | US07, US11, US13, US14, US33 |
| `SCR-13` | Tạo / sửa Objective   | Modal                                                                                | Tiêu đề, mô tả, cấp (công ty, phòng ban, team, cá nhân — chỉ hiện cấp được phép), phòng ban hoặc team khi chọn cấp tương ứng, người sở hữu; danh sách 1–5 KR (tiêu đề, kiểu đo, giá trị đầu, đích, đơn vị, người phụ trách); chọn Objective cấp trên                                                                            | US08, US09, US10             |
| `SCR-14` | Check-in Key Result   | Modal                                                                                | Tên KR, giá trị hiện tại và đích; ô nhập giá trị mới, mức tự tin, ghi chú, vướng mắc                                                                                                                                                                                                                                            | US12                         |
| `SCR-20` | Phiếu cần điền        | Trang                                                                                | Danh sách phiếu được giao: người được đánh giá, vai trò của tôi trong phiếu, trạng thái nháp/đã nộp, hạn nộp                                                                                                                                                                                                                    | US19                         |
| `SCR-21` | Điền phiếu đánh giá   | Trang                                                                                | Tên người được đánh giá; từng tiêu chí với thang 1–5 hoặc "Không đủ thông tin"; câu hỏi mở; nút lưu nháp, nộp; khi nộp, hộp cảnh báo của AI (chỉ người viết thấy) với câu bị đánh dấu, nút "Sửa lại" và "Vẫn nộp"                                                                                                               | US19, US34                   |
| `SCR-22` | Đề cử đồng nghiệp     | Trang                                                                                | Ô tìm đồng nghiệp, danh sách đã chọn (3–5 người), hạn đề cử, trạng thái duyệt                                                                                                                                                                                                                                                   | US17                         |
| `SCR-23` | Duyệt người đánh giá  | Trang                                                                                | Danh sách nhân viên dưới quyền; với mỗi người: đồng nghiệp được đề cử, nút thêm, bớt, duyệt                                                                                                                                                                                                                                     | US18                         |
| `SCR-24` | Kết quả 360           | Trang                                                                                | Điểm theo từng tiêu chí, điểm theo nhóm người đánh giá, chênh lệch tự đánh giá so với người khác, nhận xét không kèm tên; khối "Tóm tắt từ quản lý" khi quản lý đã gửi bản 1-1                                                                                                                                                  | US21, US31                   |
| `SCR-30` | Kết quả cuối kỳ       | Trang                                                                                | Bảng từng nhân viên: tiến độ OKR, điểm OKR, điểm 360, điểm cuối kỳ, xếp loại; nút xuất file, công bố                                                                                                                                                                                                                            | US22                         |
| `SCR-40` | Báo cáo và xuất file  | Trang                                                                                | Chọn loại báo cáo (tiến độ OKR, tỷ lệ check-in, kết quả cuối kỳ), bộ lọc chu kỳ và phòng ban, bảng và biểu đồ, nút xuất Excel/PDF                                                                                                                                                                                               | US24                         |
| `SCR-50` | Chu kỳ OKR            | Trang có modal                                                                       | Danh sách chu kỳ: tên, ngày bắt đầu, kết thúc, trạng thái; nút tạo, kích hoạt, đóng                                                                                                                                                                                                                                             | US06                         |
| `SCR-51` | Phòng ban và team     | Trang dạng cây có modal                                                              | Cây phòng ban và team, loại đơn vị, trưởng phòng hoặc team lead, số thành viên; nút thêm phòng ban, thêm team vào phòng ban, sửa, ngưng                                                                                                                                                                                         | US04                         |
| `SCR-52` | Người dùng            | Trang có modal                                                                       | Bảng người dùng: họ tên, email, vai trò, phòng ban, quản lý trực tiếp, trạng thái; nút thêm, sửa, bật/tắt                                                                                                                                                                                                                       | US05                         |
| `SCR-53` | Đợt đánh giá 360      | Trang có modal                                                                       | Danh sách đợt: tên, chu kỳ, mẫu phiếu, hạn đề cử, hạn nộp, trạng thái; nút tạo đợt                                                                                                                                                                                                                                              | US16                         |
| `SCR-54` | Chi tiết đợt đánh giá | Trang                                                                                | Giai đoạn hiện tại, tỷ lệ nộp phiếu theo phòng ban, số phiếu còn thiếu của từng người; nút mở đề cử, mở thu phiếu, gửi nhắc, đóng đợt                                                                                                                                                                                           | US16, US20                   |
| `SCR-55` | Bộ tiêu chí đánh giá  | Trang có modal                                                                       | Danh sách mẫu phiếu; trong mỗi mẫu: tiêu chí, mô tả, bắt buộc hay không, câu hỏi mở; nút tạo, sửa, nhân bản                                                                                                                                                                                                                     | US15                         |
| `SCR-56` | Nhật ký hoạt động     | Trang                                                                                | Bảng: người thực hiện, hành động, phân hệ, đối tượng, thời gian; bộ lọc                                                                                                                                                                                                                                                         | US26                         |
| `SCR-60` | Thông báo             | Danh sách thả xuống + trang                                                          | Danh sách thông báo mới nhất trước, trạng thái đã đọc/chưa đọc, nút đánh dấu tất cả đã đọc                                                                                                                                                                                                                                      | US25                         |
| `SCR-70` | Hồ sơ cá nhân         | Trang có 3 tab                                                                       | **Tài khoản:** họ tên, số điện thoại, ảnh; email, vai trò, phòng ban chỉ xem. **Bảo mật:** đổi mật khẩu. **Quyền của tôi:** ma trận quyền                                                                                                                                                                                       | US03                         |
| `SCR-80` | Vướng mắc chuyển đến  | Trang                                                                                | Tab Đang chờ / Đã xử lý; mỗi dòng: KR, người báo, phòng ban của người báo, nội dung vướng mắc, nhãn AI (loại, mức nghiêm trọng), thời điểm; nút "Đã nhận xử lý" (kèm ghi chú), "Không liên quan phòng tôi"                                                                                                                      | US29                         |
| `SCR-81` | Bản tin tuần          | Trang                                                                                | Chọn tuần; số liệu đội (đã check-in, chưa check-in, KR có rủi ro, KR chệch hướng); tối đa 3 việc cần chú ý do AI viết, mỗi việc mở được tới KR; nhãn "Do AI tạo"                                                                                                                                                                | US30                         |
| `SCR-82` | Bản nháp 1-1          | Trang chia hai cột                                                                   | Trái: danh sách bản nháp theo đợt và trạng thái. Phải: điểm 360 tóm tắt, đề xuất của AI (điểm mạnh, cần cải thiện), ô sửa nội dung gửi cho nhân viên, nút Gửi, Bỏ bản nháp                                                                                                                                                      | US31                         |
| `SCR-83` | Luồng tự động         | Trang có 2 tab                                                                       | **Luồng:** 6 luồng, khi nào chạy, bật/tắt, lịch chạy, hạn mức, số lần gọi AI hôm nay, lần chạy gần nhất. **Lịch sử chạy:** luồng, đối tượng, trạng thái, số lần thử, thời gian, token, lỗi; bộ lọc; nút chạy lại (Admin)                                                                                                        | US27, US28                   |
| `SCR-84` | Ngăn "AI đã làm gì?"  | Ngăn trượt bên phải, mở từ nhãn "Do AI tạo" ở `SCR-12`, `SCR-80`, `SCR-81`, `SCR-82` | Các bước của đúng lần chạy đã tạo ra nhãn: sự kiện, nội dung đã đổi tên thành mã, nội dung gửi cho AI, JSON trả về, kết quả kiểm tra khuôn, hành động đã làm. Dựng lại từ dữ liệu người xem đang có quyền xem, không đọc từ log                                                                                                 | US29–US33                    |
| `SCR-90` | Không có quyền (403)  | Trang                                                                                | Thông báo không có quyền, nút quay về Dashboard                                                                                                                                                                                                                                                                                 | Phân quyền dùng chung        |

## Nối user story với màn hình

| User story | Màn hình và thao tác chính                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| US01       | `SCR-01` nhập email, mật khẩu, đăng nhập                                                              |
| US02       | Nút đăng xuất trên topbar, quay về `SCR-01`                                                           |
| US03       | `SCR-70` sửa thông tin hoặc đổi mật khẩu                                                              |
| US04       | `SCR-51` thêm, sửa, ngưng phòng ban                                                                   |
| US05       | `SCR-52` thêm, sửa, bật/tắt người dùng, gán quản lý trực tiếp                                         |
| US06       | `SCR-50` tạo, kích hoạt, đóng chu kỳ                                                                  |
| US07       | `SCR-11` xem và lọc cây; `SCR-12` xem chi tiết                                                        |
| US08       | `SCR-10` hoặc `SCR-11` → `SCR-13` tạo/sửa Objective                                                   |
| US09       | `SCR-13` thêm, sửa Key Result                                                                         |
| US10       | `SCR-13` chọn Objective cấp trên để liên kết                                                          |
| US11       | `SCR-12` xác nhận xóa mềm Objective                                                                   |
| US12       | `SCR-02` hoặc `SCR-10` → `SCR-14` check-in                                                            |
| US13       | `SCR-12` xem lịch sử check-in và biểu đồ tiến độ                                                      |
| US14       | `SCR-12` Manager bình luận vào check-in                                                               |
| US15       | `SCR-55` tạo, sửa, nhân bản mẫu phiếu                                                                 |
| US16       | `SCR-53` tạo đợt; `SCR-54` mở giai đoạn đề cử, mở thu phiếu                                           |
| US17       | `SCR-22` chọn 3–5 đồng nghiệp và gửi                                                                  |
| US18       | `SCR-23` giữ, thêm, bớt người đánh giá rồi duyệt                                                      |
| US19       | `SCR-20` chọn phiếu → `SCR-21` chấm điểm, lưu nháp, nộp                                               |
| US20       | `SCR-54` xem tỷ lệ nộp, gửi nhắc, đóng đợt                                                            |
| US21       | `SCR-24` xem điểm theo tiêu chí, theo nhóm, nhận xét                                                  |
| US22       | `SCR-30` xem trước, xuất file, công bố                                                                |
| US23       | `SCR-02` xem dashboard theo vai trò                                                                   |
| US24       | `SCR-40` chọn loại báo cáo, lọc, xuất Excel/PDF                                                       |
| US25       | Chuông trên topbar → `SCR-60`                                                                         |
| US26       | `SCR-56` lọc nhật ký                                                                                  |
| US27       | `SCR-83` tab Luồng: bật/tắt, sửa lịch chạy và hạn mức                                                 |
| US28       | `SCR-83` tab Lịch sử chạy: lọc, xem lỗi, chạy lại                                                     |
| US29       | Thông báo → `SCR-80` nhận xử lý hoặc báo không liên quan                                              |
| US30       | Thông báo thứ Hai → `SCR-81` → mở KR trong `SCR-12`                                                   |
| US31       | `SCR-82` sửa đề xuất của AI rồi gửi; nhân viên xem ở `SCR-24`                                         |
| US32       | Không có màn hình riêng; kết quả hiện ở `SCR-12`, `SCR-80`–`SCR-83`; bấm nhãn "Do AI tạo" mở `SCR-84` |
| US33       | Thông báo → `SCR-12` xem nhãn không khớp, gợi ý rà soát                                               |
| US34       | `SCR-21` cảnh báo khi bấm nộp                                                                         |

## Sơ đồ phân cấp màn hình

```mermaid
flowchart LR
    Login["SCR-01 Đăng nhập"] --> Shell["Khung sau đăng nhập<br/>sidebar + topbar"]

    Shell --> Dashboard["SCR-02 Dashboard"]
    Dashboard --> Checkin["SCR-14 Modal check-in"]

    Shell --> GroupOkr["Nhóm OKR"]
    GroupOkr --> MyOkr["SCR-10 OKR của tôi"]
    GroupOkr --> Tree["SCR-11 Cây OKR"]
    MyOkr --> Detail["SCR-12 Chi tiết Objective"]
    Tree --> Detail
    Detail --> ObjForm["SCR-13 Modal tạo/sửa Objective"]

    Shell --> GroupReview["Nhóm Đánh giá 360"]
    GroupReview --> Todo["SCR-20 Phiếu cần điền"]
    Todo --> Form["SCR-21 Điền phiếu"]
    GroupReview --> Nominate["SCR-22 Đề cử đồng nghiệp"]
    GroupReview --> Approve["SCR-23 Duyệt người đánh giá"]
    GroupReview --> Result360["SCR-24 Kết quả 360"]

    Shell --> GroupResult["Nhóm Kết quả và báo cáo"]
    GroupResult --> Final["SCR-30 Kết quả cuối kỳ"]
    GroupResult --> Reports["SCR-40 Báo cáo"]

    Shell --> GroupAdmin["Nhóm Quản trị"]
    GroupAdmin --> Cycles["SCR-50 Chu kỳ OKR"]
    GroupAdmin --> Depts["SCR-51 Phòng ban và team"]
    GroupAdmin --> Users["SCR-52 Người dùng"]
    GroupAdmin --> Campaigns["SCR-53 Đợt đánh giá"]
    Campaigns --> Campaign["SCR-54 Chi tiết đợt"]
    GroupAdmin --> Templates["SCR-55 Bộ tiêu chí"]
    GroupAdmin --> Audit["SCR-56 Nhật ký"]

    Shell --> GroupAi["Nhóm Tự động hóa AI"]
    GroupAi --> Blockers["SCR-80 Vướng mắc chuyển đến"]
    GroupAi --> Digest["SCR-81 Bản tin tuần"]
    GroupAi --> Drafts["SCR-82 Bản nháp 1-1"]
    GroupAi --> Flows["SCR-83 Luồng tự động"]
    Blockers --> Detail
    Digest --> Detail

    Shell --> GroupPersonal["Nhóm Cá nhân và hệ thống"]
    GroupPersonal --> Notify["SCR-60 Thông báo"]
    GroupPersonal --> Profile["SCR-70 Hồ sơ cá nhân"]
    GroupPersonal --> Forbidden["SCR-90 403"]

    classDef group fill:#e8f1fc,color:#123,stroke:#3a7bd5
    class GroupOkr,GroupReview,GroupResult,GroupAdmin,GroupAi,GroupPersonal group
```

## Luồng thao tác chính

### Luồng chung cho danh sách và biểu mẫu

```mermaid
flowchart LR
    A["Mở danh sách"] --> B["Lọc hoặc tìm kiếm"] --> C["Mở chi tiết"]
    A --> D["Thêm hoặc sửa"] --> E["Kiểm tra ở giao diện"] --> F["Kiểm tra ở API"]
    F -->|Thành công| G["Làm mới danh sách và báo thành công"]
    F -->|Lỗi dữ liệu| D
    F -->|401| H["Về trang đăng nhập"]
    F -->|403| I["Hiện trang 403"]
    F -->|409 xung đột| J["Giữ dữ liệu đã nhập và giải thích lý do"]
```

### Luồng check-in hằng tuần

Mục tiêu: check-in một Key Result trong tối đa 3 thao tác kể từ dashboard.

```mermaid
flowchart LR
    A["Dashboard: thẻ KR cần check-in"] --> B["Bấm Check-in"]
    B --> C["Modal: giá trị, mức tự tin, ghi chú"]
    C --> D["Lưu"]
    D --> E["Tiến độ KR, Objective, Objective cấp trên cập nhật ngay"]
    D -->|Chọn Chệch hướng| F["Quản lý trực tiếp nhận thông báo"]
```

### Luồng người đánh giá 360

```mermaid
flowchart LR
    A["Chuông: có phiếu cần điền"] --> B["SCR-20 Phiếu cần điền"]
    B --> C["SCR-21 Điền phiếu"]
    C --> D["Lưu nháp"]
    D --> C
    C --> E["Nộp phiếu"]
    E -->|Còn tiêu chí bắt buộc chưa chấm| C
    E -->|Thành công| B
```

### Luồng vướng mắc được AI chuyển đến

Người check-in không phải làm thêm gì; trưởng phòng nhận việc xử lý trong 2 thao tác từ thông báo.

```mermaid
flowchart LR
    A["Lan check-in, ghi vướng mắc<br/>chờ team QA"] --> B["Lưu xong ngay<br/>(AI chạy nền)"]
    B --> C["AI gắn nhãn:<br/>Phụ thuộc phòng khác · QA · Cao"]
    C --> D["Chị Hà nhận thông báo"]
    D --> E["SCR-80 Vướng mắc chuyển đến"]
    E -->|Đã nhận xử lý| F["Lan nhận thông báo kèm ghi chú"]
    E -->|Không liên quan phòng tôi| G["Chuyển về quản lý trực tiếp của Lan"]
```

### Luồng bản nháp 1-1

```mermaid
flowchart LR
    A["HR đóng đợt 360"] --> B["AI tóm tắt nhận xét<br/>nhóm đủ 3 phiếu"]
    B --> C["Quản lý nhận thông báo"]
    C --> D["SCR-82 sửa nội dung"]
    D -->|Đợt chưa công bố| E["Lưu bản sửa, chưa gửi được"]
    D -->|Đợt đã công bố| F["Gửi"]
    F --> G["Nhân viên thấy khối<br/>Tóm tắt từ quản lý ở SCR-24"]
```

## Quy ước trạng thái giao diện

| Trạng thái               | Cách hiển thị bắt buộc                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Đang tải lần đầu         | Giữ khung trang; hiện khung xương (skeleton) ở bảng, cây hoặc biểu đồ đang tải.                                |
| Rỗng                     | Nói rõ chưa có dữ liệu hay do bộ lọc; hiện nút hành động chính nếu có quyền (ví dụ "Thêm Objective đầu tiên"). |
| Lỗi dữ liệu nhập         | Giữ nguyên giá trị đã nhập, hiện lỗi ngay dưới ô bị sai, đưa con trỏ tới lỗi đầu tiên.                         |
| Lỗi API                  | Hiện thông báo ngắn kèm mã tra cứu; không hiện chi tiết kỹ thuật.                                              |
| Hết phiên (401)          | Xóa phiên đăng nhập và về trang đăng nhập.                                                                     |
| Không có quyền (403)     | Giữ phiên đăng nhập, hiện `#/403` kèm đường quay lại.                                                          |
| Đang lưu                 | Khóa nút gửi để tránh gửi hai lần, hiện trạng thái đang xử lý.                                                 |
| Thành công               | Báo thành công, đóng modal nếu có, làm mới dữ liệu liên quan (ví dụ tiến độ trên cây sau check-in).            |
| Xác nhận xóa             | Nêu tên Objective và nói rõ nó biến khỏi cây, báo cáo nhưng vẫn giữ lịch sử.                                   |
| Chu kỳ đã đóng           | Hiện nhãn "Chu kỳ đã đóng — chỉ xem"; ẩn mọi nút sửa và check-in.                                              |
| Kết quả bị ẩn vì ẩn danh | Ghi "Chưa đủ 3 phiếu nên không hiển thị để bảo vệ ẩn danh", không để ô trống.                                  |
| Nội dung do AI tạo       | Luôn có nhãn "Do AI tạo" cạnh nội dung; nhãn, gợi ý, bản tin không có nút sửa số liệu OKR hay 360.             |
| AI đang xử lý            | Sau khi check-in hay lưu Objective, không chờ AI; nhãn AI xuất hiện sau, khi người dùng mở lại trang.          |
| Luồng AI tắt hoặc lỗi    | Mọi tính năng không dùng AI vẫn chạy; khối AI ghi "Chưa có phân tích" thay vì báo lỗi cho người dùng thường.   |

## Quy tắc responsive và trợ năng

- Dùng tốt từ màn hình 375 px. Cây OKR trên màn hình hẹp chuyển thành danh sách lồng nhau có thể mở rộng; bảng cuộn ngang thay vì giấu cột.
- Mức tự tin và tiến độ không chỉ thể hiện bằng màu: luôn kèm chữ ("Đúng hướng", "Có rủi ro", "Chệch hướng") và con số phần trăm.
- Modal vừa khung nhìn, giữ nút hành động luôn thấy được, khóa phím Tab bên trong modal, đóng bằng `Escape` khi không đang lưu, trả con trỏ về nút đã mở modal.
- Mọi ô nhập có nhãn hiển thị; nút chỉ có biểu tượng có tên cho trình đọc màn hình.
- Người dùng bàn phím đi được qua sidebar, bộ lọc, cây OKR, nút trong modal và phân trang theo thứ tự hợp lý.
- Ngày theo định dạng `dd/MM/yyyy`; phần trăm làm tròn đến số nguyên; điểm làm tròn 2 chữ số.

## Nối màn hình với API

Tên thao tác khớp với hợp đồng [OpenAPI](api/openapi.yaml).

| Màn hình                   | Thao tác API                                                                                                                                       |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Đăng nhập                  | `login`, `logout`                                                                                                                                  |
| Dashboard                  | `getMyDashboard`, `getTeamDashboard`, `getCompanyDashboard`                                                                                        |
| OKR của tôi, Cây OKR       | `listObjectives`, `getObjectiveTree`                                                                                                               |
| Chi tiết Objective         | `getObjective`, `deleteObjective`, `listCheckins`, `createCheckinComment`                                                                          |
| Tạo / sửa Objective        | `createObjective`, `updateObjective`, `createKeyResult`, `updateKeyResult`, `deleteKeyResult`, `linkParentObjective`                               |
| Check-in                   | `createCheckin`                                                                                                                                    |
| Phiếu cần điền, Điền phiếu | `listMyReviewForms`, `getReviewForm`, `saveReviewDraft`, `submitReviewForm`                                                                        |
| Đề cử đồng nghiệp          | `getMyNomination`, `submitNomination`                                                                                                              |
| Duyệt người đánh giá       | `listPendingNominations`, `approveNomination`                                                                                                      |
| Kết quả 360                | `getReviewResult`                                                                                                                                  |
| Kết quả cuối kỳ            | `calculateFinalResults`, `listFinalResults`, `exportFinalResults`, `publishFinalResults`                                                           |
| Báo cáo                    | `getReport`, `exportReport`                                                                                                                        |
| Chu kỳ OKR                 | `listCycles`, `createCycle`, `updateCycle`, `activateCycle`, `closeCycle`                                                                          |
| Phòng ban                  | `listDepartments`, `createDepartment`, `updateDepartment`, `deactivateDepartment`                                                                  |
| Người dùng                 | `listUsers`, `getUser`, `createUser`, `updateUser`, `updateUserStatus`                                                                             |
| Đợt đánh giá, Chi tiết đợt | `listCampaigns`, `createCampaign`, `updateCampaign`, `openNomination`, `openCollection`, `getCampaignProgress`, `remindReviewers`, `closeCampaign` |
| Bộ tiêu chí                | `listTemplates`, `createTemplate`, `updateTemplate`, `duplicateTemplate`                                                                           |
| Nhật ký                    | `listAuditLogs`                                                                                                                                    |
| Thông báo                  | `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`                                                                            |
| Hồ sơ cá nhân              | `getProfile`, `updateProfile`, `changePassword`                                                                                                    |
| Vướng mắc chuyển đến       | `listRoutedBlockers`, `acknowledgeBlocker`, `rejectBlocker`                                                                                        |
| Bản tin tuần               | `listWeeklyDigests`, `getWeeklyDigest`                                                                                                             |
| Bản nháp 1-1               | `listOneOnOneDrafts`, `getOneOnOneDraft`, `updateOneOnOneDraft`, `sendOneOnOneDraft`, `discardOneOnOneDraft`                                       |
| Luồng tự động              | `listAutomationFlows`, `updateAutomationFlow`, `listAutomationRuns`, `retryAutomationRun`                                                          |
| Điền phiếu (cảnh báo AI)   | `checkReviewComment` (gọi khi bấm nộp, tối đa 5 giây)                                                                                              |
| Chi tiết Objective (AI)    | `listObjectiveReviewNotes`, `dismissObjectiveReviewNote`                                                                                           |
| Ngăn "AI đã làm gì?"       | `getAiRunExplanation`                                                                                                                              |
| Thao tác dùng chung        | `listUserDirectory`, `getCampaign`, `listReviewResultSubjects`, `getMyFinalResult`, `getAutomationRun`                                             |

Thao tác `listCycles` và `listDepartments` cũng cung cấp danh sách chọn cho bộ chọn chu kỳ, bộ lọc và biểu mẫu; chúng không cần màn hình riêng cho việc đó.

## Giao diện mẫu

Bản giao diện mẫu React chạy bằng dữ liệu giả nằm ở [src/frontend](../src/frontend/README.md). Ảnh chụp được lưu theo vai trò:

| Thư mục               | Vai trò                         | Màn hình đã chụp                                                                                                                                                                                                            |
| --------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `images/chung/`       | Chưa đăng nhập, tính năng chung | `SCR-01`, bảng tìm kiếm nhanh, chế độ nền sáng                                                                                                                                                                              |
| `images/nhan-vien/`   | Nhân viên (Lan)                 | `SCR-02`, `SCR-10`, `SCR-11`, `SCR-12`, `SCR-13`, `SCR-14`, `SCR-20`, `SCR-21`, `SCR-22`, `SCR-24`, `SCR-60`, `SCR-70`                                                                                                      |
| `images/quan-ly/`     | Quản lý (Nam, Hà)               | `SCR-02` đội nhóm, `SCR-23`, `SCR-24` của nhân viên và trường hợp gộp nhóm, `SCR-40`                                                                                                                                        |
| `images/nhan-su/`     | Nhân sự (Mai)                   | `SCR-02` công ty, `SCR-53`, `SCR-54`, `SCR-30`, `SCR-55`, `SCR-52`                                                                                                                                                          |
| `images/quan-tri/`    | Quản trị viên (Hùng)            | `SCR-02` công ty, `SCR-50`, `SCR-51`, `SCR-56`, `SCR-90`                                                                                                                                                                    |
| `images/tu-dong-hoa/` | Hà, Nam, Mai, Hùng, Lan, An     | `SCR-80`, `SCR-81`, `SCR-82`, `SCR-83` (2 tab), `SCR-84`, luồng demo từ check-in tới người nhận (ảnh 11–18), nhãn AI trên check-in và gợi ý rà soát ở `SCR-12`, cảnh báo nhận xét ở `SCR-21`, tóm tắt từ quản lý ở `SCR-24` |

**Liên quan:** [Use case](03-use-cases.md) · [User stories](08-invest-requirements.md) · [Tiêu chí chấp nhận](06-acceptance-criteria.md)
