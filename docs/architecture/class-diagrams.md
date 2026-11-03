# Sơ đồ class — OKR360 V1

> Trạng thái thiết kế: TARGET V1
>
> Trạng thái triển khai: CHƯA BẮT ĐẦU; backend chưa có

Đây là cấp 4 (code) của [kiến trúc C4](c4.md): các class chính của backend NestJS, chia theo module ở [C3](c4.md#c3--component) và theo thư mục ở [cấu trúc thư mục](../07-folder-structure.md). Cách các class phối hợp trong từng thao tác nằm ở [sơ đồ sequence](sequence-diagrams.md).

## Quy ước

- Mỗi module chia ba tầng: **Controller** (tầng API), **Service** (tầng nghiệp vụ), **Repository** (giao diện ở tầng nghiệp vụ, cài đặt bằng Kysely ở tầng hạ tầng).
- Mỗi hàm của controller là đúng một `operationId` trong [OpenAPI](../api/openapi.yaml); tham số và kiểu trả về là schema cùng tên.
- Sơ đồ chỉ ghi các hàm chính của service và repository; hàm phụ, constructor và DTO không vẽ.
- Mọi controller trừ `AuthController.login` đi qua `JwtAuthGuard` và `RolesGuard`. Đường nối tới hai guard này không vẽ lại ở từng module.
- Quan hệ: `..>` là phụ thuộc, `..|>` là cài đặt giao diện.

## 1. Phần dùng chung

```mermaid
classDiagram
    class JwtAuthGuard {
        +canActivate(context) bool
    }
    class RolesGuard {
        +canActivate(context) bool
    }
    class CurrentUser {
        +id
        +role
        +departmentId
    }
    class AccessPolicy {
        +isDirectManager(user, employeeId) bool
        +managesUnit(user, unitId) bool
        +managedUnitIds(user) int[]
        +canViewReviewResult(user, campaign, revieweeId) bool
    }
    class ProblemDetailsFilter {
        +catch(error, host)
    }
    class Database {
        +db Kysely
        +transaction(work) T
    }
    class AuditLogService {
        +record(actor, action, module, entity, summary)
        +list(filter) AuditLogPage
    }
    class NotificationService {
        +notify(userId, type, body, link, dedupeKey)
    }
    JwtAuthGuard ..> CurrentUser : tạo
    RolesGuard ..> CurrentUser : đọc vai trò
    AccessPolicy ..> Database : đọc quan hệ báo cáo
    AuditLogService ..> Database
    NotificationService ..> Database
```

- `AccessPolicy` đọc quan hệ báo cáo từ database ở mỗi lần kiểm tra, nên đổi quản lý có hiệu lực ngay (ADR-006). Với đợt 360, hàm dùng bản chụp lúc mở thu phiếu (BR-055).
- `NotificationService` dùng `dedupeKey` để mỗi người nhận tối đa một lần nhắc cho mỗi sự kiện mỗi ngày (BR-081).
- `AuditLogService` không nhận điểm, nhận xét hay cặp người chấm ẩn danh (BR-083).

## 2. Đăng nhập và tổ chức

```mermaid
classDiagram
    class AuthController {
        +login(LoginRequest) LoginResponse
        +logout()
    }
    class AuthService {
        +login(email, password) LoginResponse
    }
    class PasswordHasher {
        <<interface>>
        +hash(password) string
        +verify(password, hash) bool
    }
    class Argon2PasswordHasher
    class TokenService {
        +sign(user) string
        +verify(token) CurrentUser
    }
    class LoginAttemptLimiter {
        +assertAllowed(email)
        +recordFailure(email)
        +reset(email)
    }
    class ProfileController {
        +getProfile() Profile
        +updateProfile(ProfileUpdate) Profile
        +changePassword(PasswordChange)
    }
    class DepartmentsController {
        +listDepartments() Department[]
        +createDepartment(DepartmentCreate) Department
        +updateDepartment(id, DepartmentUpdate) Department
        +deactivateDepartment(id) Department
    }
    class UsersController {
        +listUsers(filter) UserPage
        +createUser(UserCreate) User
        +listUserDirectory(filter) DirectoryEntryPage
        +getUser(id) User
        +updateUser(id, UserUpdate) User
        +updateUserStatus(id, UserStatusUpdate) User
    }
    class ProfileService {
        +get(actor) Profile
        +update(actor, input) Profile
        +changePassword(actor, current, next)
    }
    class DepartmentService {
        +create(input)
        +update(id, input)
        +deactivate(id)
    }
    class UserService {
        +create(actor, input)
        +update(actor, id, input)
        +setActive(id, isActive)
    }
    class OrganizationRepository {
        <<interface>>
        +findUserByEmail(email)
        +findDepartment(id)
        +countActiveMembers(unitId) int
        +saveUser(user)
        +saveDepartment(unit)
    }
    class KyselyOrganizationRepository
    AuthController ..> AuthService
    AuthService ..> PasswordHasher
    AuthService ..> TokenService
    AuthService ..> LoginAttemptLimiter
    AuthService ..> OrganizationRepository
    Argon2PasswordHasher ..|> PasswordHasher
    ProfileController ..> ProfileService
    DepartmentsController ..> DepartmentService
    UsersController ..> UserService
    ProfileService ..> OrganizationRepository
    ProfileService ..> PasswordHasher
    DepartmentService ..> OrganizationRepository
    UserService ..> OrganizationRepository
    UserService ..> PasswordHasher
    KyselyOrganizationRepository ..|> OrganizationRepository
```

- `UserService.create` từ chối HR gán vai trò Admin (BR-004). Vòng lặp tổ chức và vòng lặp quản lý được database chặn thêm một lớp bằng trigger (BR-010, BR-013).

## 3. OKR và check-in

```mermaid
classDiagram
    class CyclesController {
        +listCycles(status) Cycle[]
        +createCycle(CycleCreate) Cycle
        +updateCycle(id, CycleUpdate) Cycle
        +activateCycle(id) Cycle
        +closeCycle(id) Cycle
    }
    class ObjectivesController {
        +listObjectives(filter) ObjectiveSummaryPage
        +createObjective(ObjectiveCreate) Objective
        +getObjectiveTree(filter) ObjectiveTreeNode[]
        +getObjective(id) Objective
        +updateObjective(id, ObjectiveUpdate) Objective
        +deleteObjective(id)
        +linkParentObjective(id, ParentLink) Objective
        +listObjectiveReviewNotes(id) ObjectiveReviewNote[]
        +dismissObjectiveReviewNote(id, noteId) ObjectiveReviewNote
    }
    class KeyResultsController {
        +createKeyResult(objectiveId, KeyResultInput) KeyResult
        +updateKeyResult(id, KeyResultUpdate) KeyResult
        +deleteKeyResult(id)
    }
    class CheckinsController {
        +listCheckins(keyResultId) Checkin[]
        +createCheckin(keyResultId, CheckinCreate) CheckinResult
        +createCheckinComment(checkinId, CheckinCommentCreate) CheckinComment
    }
    class CycleService {
        +create(input)
        +activate(id)
        +close(id)
    }
    class ObjectiveService {
        +get(id) Objective
        +create(actor, input)
        +update(actor, id, input)
        +softDelete(actor, id)
        +linkParent(actor, id, parentId)
        +tree(filter)
    }
    class KeyResultService {
        +create(actor, objectiveId, input)
        +update(actor, id, input)
        +softDelete(actor, id)
    }
    class CheckinService {
        +list(keyResultId) Checkin[]
        +create(actor, keyResultId, input) CheckinResult
        +comment(actor, checkinId, body)
    }
    class ProgressRollup {
        +recalculateFrom(objectiveId, tx) ObjectiveSummary[]
    }
    class OkrRepository {
        <<interface>>
        +findCycle(id)
        +findTree(filter)
        +findObjectiveChain(objectiveId, tx)
        +findKeyResultForCheckin(keyResultId, tx)
        +insertCheckin(input, tx)
        +updateObjectiveProgress(id, progress, tx)
    }
    class KyselyOkrRepository
    CyclesController ..> CycleService
    ObjectivesController ..> ObjectiveService
    KeyResultsController ..> KeyResultService
    CheckinsController ..> CheckinService
    ObjectiveService ..> ProgressRollup
    KeyResultService ..> ProgressRollup
    CheckinService ..> ProgressRollup
    CheckinService ..> AccessPolicy
    CheckinService ..> NotificationService
    CycleService ..> OkrRepository
    ObjectiveService ..> OkrRepository
    KeyResultService ..> OkrRepository
    CheckinService ..> OkrRepository
    ProgressRollup ..> OkrRepository
    KyselyOkrRepository ..|> OkrRepository
```

- `ProgressRollup` tính tiến độ Objective là trung bình cộng của KR và Objective con, đi ngược lên tới gốc, trong cùng transaction với thao tác gốc (BR-043, BR-044).
- Sự kiện `CHECKIN_CREATED` và `OBJECTIVE_CREATED` do trigger trong database ghi, nên không có class nào trong API gọi AI hay ghi hàng đợi (NFR-REL-001).

## 4. Đánh giá 360

```mermaid
classDiagram
    class ReviewTemplatesController {
        +listTemplates() ReviewTemplate[]
        +createTemplate(ReviewTemplateInput) ReviewTemplate
        +updateTemplate(id, ReviewTemplateInput) ReviewTemplate
        +duplicateTemplate(id) ReviewTemplate
    }
    class CampaignsController {
        +listCampaigns(filter) Campaign[]
        +createCampaign(CampaignCreate) Campaign
        +getCampaign(id) Campaign
        +updateCampaign(id, CampaignUpdate) Campaign
        +openNomination(id) Campaign
        +openCollection(id) Campaign
        +getCampaignProgress(id) CampaignProgress
        +remindReviewers(id) ReminderResult
        +closeCampaign(id) Campaign
    }
    class NominationsController {
        +getMyNomination(campaignId) Nomination
        +submitNomination(campaignId, NominationSubmit) Nomination
        +listPendingNominations(campaignId) Nomination[]
        +approveNomination(campaignId, revieweeId, NominationApprove) Nomination
    }
    class ReviewFormsController {
        +listMyReviewForms(filter) ReviewFormSummary[]
        +getReviewForm(id) ReviewForm
        +saveReviewDraft(id, ReviewFormInput) ReviewForm
        +checkReviewComment(id, CommentCheckRequest) CommentCheckResult
        +submitReviewForm(id, ReviewFormInput) ReviewForm
    }
    class ReviewResultsController {
        +listReviewResultSubjects(campaignId) ReviewResultSubject[]
        +getReviewResult(campaignId, revieweeId) ReviewResult
    }
    class TemplateService {
        +create(input) ReviewTemplate
        +update(id, input) ReviewTemplate
        +duplicate(id) ReviewTemplate
    }
    class CampaignService {
        +create(input) Campaign
        +openNomination(id)
        +openCollection(id)
        +progress(id)
        +close(id)
    }
    class NominationService {
        +submit(actor, campaignId, peerIds)
        +approve(actor, campaignId, revieweeId, peerIds)
    }
    class ReviewFormService {
        +saveDraft(actor, formId, input)
        +submit(actor, formId, input)
    }
    class CommentGuardService {
        +check(actor, formId, answers) CommentCheckResult
    }
    class ReviewResultService {
        +get(actor, campaignId, revieweeId) ReviewResult
        +overallScore(campaignId, revieweeId) number
    }
    class AnonymityAggregator {
        +threshold int
        +aggregate(groupScores, comments) ReviewResult
    }
    class ReviewRepository {
        <<interface>>
        +findAssignment(formId, reviewerId)
        +saveAnswers(formId, answers, tx)
        +closeCampaign(id, tx)
        +groupScores(campaignId, revieweeId)
        +visibleComments(campaignId, revieweeId)
    }
    class KyselyReviewRepository
    ReviewTemplatesController ..> TemplateService
    CampaignsController ..> CampaignService
    NominationsController ..> NominationService
    ReviewFormsController ..> ReviewFormService
    ReviewFormsController ..> CommentGuardService
    ReviewResultsController ..> ReviewResultService
    ReviewResultService ..> AnonymityAggregator
    ReviewResultService ..> AccessPolicy
    CommentGuardService ..> AiGateway
    CommentGuardService ..> QuotaGuard
    TemplateService ..> ReviewRepository
    CampaignService ..> ReviewRepository
    NominationService ..> ReviewRepository
    ReviewFormService ..> ReviewRepository
    ReviewResultService ..> ReviewRepository
    KyselyReviewRepository ..|> ReviewRepository
```

- `ReviewResultService` là nơi duy nhất đọc điểm theo nhóm (`vw_review_group_scores`) và áp ngưỡng ẩn danh qua `AnonymityAggregator` (BR-059). Module khác lấy điểm 360 qua `overallScore`.
- `ReviewRepository.closeCampaign` gọi hàm `close_review_campaign()` của database, hàm tách câu trả lời khỏi người chấm trong một transaction (BR-058).
- `CommentGuardService` không lưu cảnh báo và không ghi lịch sử chạy (BR-101).

## 5. Kết quả, dashboard, báo cáo, hệ thống

```mermaid
classDiagram
    class FinalResultsController {
        +getMyFinalResult(cycleId) FinalResult
        +calculateFinalResults(cycleId) FinalResultSummary
        +listFinalResults(cycleId) FinalResultSummary
        +exportFinalResults(cycleId, format) file
        +publishFinalResults(cycleId) PublishResult
    }
    class DashboardsController {
        +getMyDashboard(cycleId) MyDashboard
        +getTeamDashboard(cycleId) TeamDashboard
        +getCompanyDashboard(cycleId) CompanyDashboard
    }
    class ReportsController {
        +getReport(type, filter) Report
        +exportReport(type, filter, format) file
    }
    class NotificationsController {
        +listNotifications(filter) NotificationPage
        +markAllNotificationsRead() MarkAllReadResult
        +markNotificationRead(id) Notification
    }
    class AuditLogsController {
        +listAuditLogs(filter) AuditLogPage
    }
    class FinalResultService {
        +calculate(cycleId) FinalResultSummary
        +publish(cycleId) PublishResult
    }
    class ScoreCalculator {
        +okrScore(progress) number
        +finalScore(okrScore, reviewScore, okrWeight) number
        +grade(finalScore) ResultGrade
    }
    class DashboardService {
        +personal(actor, cycleId) MyDashboard
        +team(actor, cycleId) TeamDashboard
        +company(cycleId) CompanyDashboard
    }
    class ReportService {
        +build(actor, type, filter) Report
    }
    class ReportExporter {
        <<interface>>
        +export(report) file
    }
    class XlsxReportExporter
    class PdfReportExporter
    FinalResultsController ..> FinalResultService
    FinalResultsController ..> ReportExporter
    DashboardsController ..> DashboardService
    ReportsController ..> ReportService
    ReportsController ..> ReportExporter
    NotificationsController ..> NotificationService
    AuditLogsController ..> AuditLogService
    FinalResultService ..> ScoreCalculator
    FinalResultService ..> ReviewResultService : điểm 360
    FinalResultService ..> NotificationService
    ReportService ..> AccessPolicy
    XlsxReportExporter ..|> ReportExporter
    PdfReportExporter ..|> ReportExporter
```

- `ScoreCalculator` là code thuần, không truy cập database: điểm OKR = 1 + 4 × tiến độ, điểm cuối kỳ theo tỷ trọng, xếp loại theo ngưỡng; thiếu điểm thì trả "Thiếu dữ liệu" (BR-071 đến BR-074).
- `ReportService` lọc theo phạm vi quyền; báo cáo kết quả cuối kỳ của Manager chỉ gồm nhân viên dưới quyền trực tiếp (BR-080).

## 6. Tự động hóa và AI Gateway

### 6.1 Trong API

```mermaid
classDiagram
    class AutomationController {
        +listAutomationFlows() AutomationFlowConfig[]
        +updateAutomationFlow(flow, AutomationFlowUpdate) AutomationFlowConfig
        +listAutomationRuns(filter) AutomationRunPage
        +getAutomationRun(id) AutomationRun
        +retryAutomationRun(id) AutomationRun
        +getAiRunExplanation(id) AiExplanation
    }
    class BlockersController {
        +listRoutedBlockers(filter) RoutedBlockerPage
        +acknowledgeBlocker(checkinId, BlockerAcknowledge) RoutedBlocker
        +rejectBlocker(checkinId, BlockerReject) RoutedBlocker
    }
    class WeeklyDigestsController {
        +listWeeklyDigests() WeeklyDigestSummary[]
        +getWeeklyDigest(id) WeeklyDigest
    }
    class OneOnOneDraftsController {
        +listOneOnOneDrafts(filter) OneOnOneDraftSummary[]
        +getOneOnOneDraft(id) OneOnOneDraft
        +updateOneOnOneDraft(id, OneOnOneDraftUpdate) OneOnOneDraft
        +sendOneOnOneDraft(id) OneOnOneDraft
        +discardOneOnOneDraft(id) OneOnOneDraft
    }
    class AutomationConfigService {
        +update(flow, input) AutomationFlowConfig
    }
    class RunHistoryService {
        +retry(runId)
    }
    class AiExplanationService {
        +explain(actor, runId) AiExplanation
    }
    class BlockerService {
        +acknowledge(actor, checkinId, note)
        +reject(actor, checkinId, note)
    }
    class DigestService {
        +get(actor, id) WeeklyDigest
    }
    class OneOnOneDraftService {
        +edit(actor, id, text)
        +send(actor, id)
        +discard(actor, id)
    }
    class AutomationRepository {
        <<interface>>
        +findFlow(flow)
        +findRun(id)
        +findInsight(checkinId)
        +findDraft(id)
    }
    class KyselyAutomationRepository
    AutomationController ..> AutomationConfigService
    AutomationController ..> RunHistoryService
    AutomationController ..> AiExplanationService
    BlockersController ..> BlockerService
    WeeklyDigestsController ..> DigestService
    OneOnOneDraftsController ..> OneOnOneDraftService
    AiExplanationService ..> Masker : dựng lại bảng mã
    BlockerService ..> AccessPolicy
    BlockerService ..> NotificationService
    OneOnOneDraftService ..> AccessPolicy
    OneOnOneDraftService ..> NotificationService
    AutomationConfigService ..> AutomationRepository
    RunHistoryService ..> AutomationRepository
    BlockerService ..> AutomationRepository
    DigestService ..> AutomationRepository
    OneOnOneDraftService ..> AutomationRepository
    KyselyAutomationRepository ..|> AutomationRepository
```

- Không service nào ở đây sửa được nhãn hay đề xuất gốc của AI; chỉ cập nhật phần của con người như trạng thái xử lý, nội dung đã sửa (05 §7.3).

### 6.2 AI Gateway và Worker

```mermaid
classDiagram
    class AiGateway {
        +complete(AiRequest) AiCallResult
    }
    class AiRequest {
        +flow
        +instructions
        +data
        +outputSchema
        +timeoutMs
        +maskingMap
    }
    class Masker {
        +createMap(people, units) MaskingMap
        +mask(text, map) string
        +unmask(value, map)
    }
    class OutputValidator {
        +validate(raw, schema, allowedRefs) ValidationResult
    }
    class AiProvider {
        <<interface>>
        +send(prompt, timeoutMs) AiRawResponse
    }
    class LlmProviderAdapter
    class FakeAiProvider
    class QuotaGuard {
        +tryConsume(flow) bool
    }
    class OutboxPoller {
        +poll()
    }
    class WorkerScheduler {
        +onTick()
    }
    class FlowRunner {
        +run(handler, target)
        +retryDue()
    }
    class AutomationFlowHandler {
        <<interface>>
        +flow
        +runKey(target) string
        +shouldSkip(target) bool
        +buildRequest(target) AiRequest
        +apply(result, tx)
    }
    class BlockerRoutingFlow
    class CheckinMismatchFlow
    class OkrReviewFlow
    class WeeklyDigestFlow
    class OneOnOneDraftFlow
    class ReminderJob {
        +run()
    }
    class EmailSender {
        +sendPending()
    }
    class AutomationRunRepository {
        <<interface>>
        +createRun(flow, runKey, eventId) bool
        +markRetry(runId, attempt, nextAt)
        +markFinished(runId, status, tokens, error)
    }
    AiGateway ..> Masker
    AiGateway ..> AiProvider
    AiGateway ..> OutputValidator
    LlmProviderAdapter ..|> AiProvider
    FakeAiProvider ..|> AiProvider
    OutboxPoller ..> FlowRunner
    WorkerScheduler ..> FlowRunner : bản tin tuần
    WorkerScheduler ..> ReminderJob
    WorkerScheduler ..> EmailSender
    FlowRunner ..> AutomationFlowHandler
    FlowRunner ..> AiGateway
    FlowRunner ..> QuotaGuard
    FlowRunner ..> AutomationRunRepository
    BlockerRoutingFlow ..|> AutomationFlowHandler
    CheckinMismatchFlow ..|> AutomationFlowHandler
    OkrReviewFlow ..|> AutomationFlowHandler
    WeeklyDigestFlow ..|> AutomationFlowHandler
    OneOnOneDraftFlow ..|> AutomationFlowHandler
```

- Năm luồng chạy nền chỉ khác nhau ở `AutomationFlowHandler`: dữ liệu lấy gì, khuôn JSON nào, hành động gì, đúng như [đặc tả luồng AI](ai-flows.md). `FlowRunner` lo phần chung: bật/tắt, hạn mức, chống trùng, thử lại, ghi lịch sử.
- `AiGateway` là đường duy nhất tới dịch vụ AI (ADR-005). `FakeAiProvider` ghi lại nội dung gửi đi để kiểm thử NFR-PRIV-004.
- `ReminderJob` và `EmailSender` không dùng AI.

## 7. Controller và nhóm API

| Nhóm API (tag OpenAPI) | Controller | Module |
|---|---|---|
| Đăng nhập | `AuthController` | `auth` |
| Hồ sơ | `ProfileController` | `organization` |
| Tổ chức | `DepartmentsController` | `organization` |
| Người dùng | `UsersController` | `organization` |
| Chu kỳ | `CyclesController` | `okr` |
| OKR | `ObjectivesController`, `KeyResultsController` | `okr` |
| Check-in | `CheckinsController` | `okr` |
| Mẫu phiếu 360 | `ReviewTemplatesController` | `reviews` |
| Đợt 360 | `CampaignsController` | `reviews` |
| Đề cử | `NominationsController` | `reviews` |
| Phiếu 360 | `ReviewFormsController` | `reviews` |
| Kết quả 360 | `ReviewResultsController` | `reviews` |
| Kết quả cuối kỳ | `FinalResultsController` | `results` |
| Dashboard | `DashboardsController` | `results` |
| Báo cáo | `ReportsController` | `results` |
| Thông báo | `NotificationsController` | `system` |
| Nhật ký | `AuditLogsController` | `system` |
| Tự động hóa | `AutomationController` | `automation` |
| Vướng mắc | `BlockersController` | `automation` |
| Bản tin tuần | `WeeklyDigestsController` | `automation` |
| Bản nháp 1-1 | `OneOnOneDraftsController` | `automation` |

**Liên quan:** [Sơ đồ sequence](sequence-diagrams.md) · [Kiến trúc C4](c4.md) · [Cấu trúc thư mục](../07-folder-structure.md) · [OpenAPI](../api/openapi.yaml)
