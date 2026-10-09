# Định hướng sản phẩm và roadmap cho Omni-Channel OMS SaaS

*Ngày rà soát: 09/10/2026 · Mục tiêu người dùng xác nhận: SaaS cho nhiều doanh nghiệp trong 3–6 tháng · Trạng thái: đề xuất, chưa phải cam kết triển khai*

## 1. Kết luận ngắn

Hướng đáng theo đuổi là **OMS vận hành đáng tin cậy cho cửa hàng bán nhiều kênh**: gom đơn, quản lý hàng có thể bán, phát hiện đồng bộ lỗi và đưa ra hành động khắc phục rõ ràng. Trong 3 tháng đầu, nên chứng minh một luồng từ một marketplace thật đến một tenant thật, có đối soát và cô lập tenant. Mở rộng kênh và nghiệp vụ chỉ sau khi luồng đó vận hành ổn định.

Đây là **suy luận sản phẩm**, chưa được xác nhận bằng phỏng vấn khách hàng, dữ liệu sử dụng hay doanh thu. Repository hiện thiên về pilot Shopee; chưa xác minh quyền Partner API hoặc lựa chọn phân khúc khách hàng đầu tiên. Vì vậy, “Shopee trước” là giả định cần kiểm tra, không phải quyết định khóa cứng.

## 2. Bằng chứng từ project hiện tại

| Khu vực | Hiện trạng quan sát | Ý nghĩa cho SaaS |
|---|---|---|
| Nghiệp vụ lõi | Tạo đơn, giữ tồn, movement, audit và outbox được ghi trong transaction; reserve dùng conditional update; database có constraint tồn kho ([OrdersService](../backend/src/orders/orders.service.ts), [InventoryService](../backend/src/inventory/inventory.service.ts), [migration](../backend/src/database/migrations/1706606000000-AddInventoryIntegrityConstraints.ts)). | Có nền tảng để phát triển tiếp; cần tập trung vào các khoảng trống vận hành thay vì viết lại lõi. |
| Tenant | Có schema riêng theo tenant, membership, lời mời và giới hạn gói ([TenantsService](../backend/src/tenants/tenants.service.ts), [TenantLimitsService](../backend/src/tenants/tenant-limits.service.ts)). | Mô hình dữ liệu đã chọn cần được chứng minh bằng kiểm thử cô lập và quy trình tạo tenant có khả năng phục hồi. |
| Marketplace | Ba adapter vẫn dùng dữ liệu `Map` trong bộ nhớ; Shopee webhook production đang chặn; reconciliation trả `BLOCKED_CONTRACT` ([ShopeeService](../backend/src/integrations/shopee/shopee.service.ts), [WebhooksService](../backend/src/webhooks/webhooks.service.ts), [IntegrationOperationsService](../backend/src/integration-operations/integration-operations.service.ts)). | Chưa có connector production; không nên quảng bá là đã đồng bộ thực. |
| Độ tin cậy async | Có bảng webhook inbox/outbox nhưng chưa thấy worker ghi/đọc chúng; retry exception hiện chủ yếu đổi trạng thái ([reliability migration](../backend/src/database/migrations/1706608000000-AddLeanCoreReliability.ts), [IntegrationOperationsService](../backend/src/integration-operations/integration-operations.service.ts)). | Cần nối đủ đường nhận sự kiện, xử lý, phát stock và đối soát. |
| Giao diện SaaS | Có tenant switcher, team, usage, trang Channels/Exceptions; nút tạo store trỏ đến `/onboarding` chưa tồn tại; một số bulk action báo thành công nhưng không gọi API ([tenants page](../frontend/app/tenants/page.tsx), [bulk operations](../frontend/app/bulk-operations/page.tsx), [products page](../frontend/app/products/page.tsx)). | Trước khi mở beta, luồng tạo doanh nghiệp và các hành động hiển thị phải hoạt động thật hoặc được ẩn rõ ràng. |
| Kiểm thử | Backend có 44 test chạy qua nhưng line coverage toàn backend là **22,7%** trong lần chạy `npm test -- --runInBand --coverage --silent`; frontend chưa có test script trong [package.json](../frontend/package.json). | Cần test theo invariant và các đường nhiều tenant, không lấy việc test hiện tại chạy qua làm bằng chứng production readiness. |

### Rủi ro nên chặn trước beta nhiều tenant

1. **Trạng thái job chưa kiểm tra tenant sở hữu.** API cần đăng nhập nhưng [JobsController](../backend/src/jobs/jobs.controller.ts) và [JobsService](../backend/src/jobs/jobs.service.ts) không so `job.data.tenantId` trước khi trả result hoặc failure reason. Điều kiện khai thác là người dùng biết hoặc đoán được job ID còn lưu; chưa kiểm tra Redis thực tế.
2. **Tenant bị tạm ngưng vẫn qua được đường auth dùng header.** [JWT strategy](../backend/src/auth/jwt.strategy.ts) kiểm membership nhưng không kiểm `isActive/status`. Nhánh đọc `tenantId` từ JWT còn tin role trong token mà không kiểm membership; hiện luồng phát JWT chưa ký `tenantId`, nên đây là rủi ro tiềm ẩn cần khóa trước khi thêm token kiểu đó.
3. **Chuyển tenant có thể giữ đơn cũ trên UI.** [useOrders](../frontend/hooks/useOrders.ts) dùng SWR key không chứa tenant; [useTenants](../frontend/hooks/useTenants.ts) cập nhật localStorage nhưng không cô lập cache. Cần key theo user/tenant, xóa trạng thái hiển thị cũ và bỏ response đến trễ.
4. **Tạo tenant chưa phải một workflow có thể phục hồi.** Bản ghi tenant, schema và membership được tạo qua nhiều bước riêng; schema bootstrap cũng trùng logic migration trong [TenantsService](../backend/src/tenants/tenants.service.ts). Cần trạng thái provisioning, idempotency/compensation và kiểm thử schema mới so với schema đã migrate.

## 3. Bối cảnh ngoài repository

- AWS coi cô lập tenant và onboarding lặp lại được là yêu cầu cơ bản của SaaS; schema-per-tenant là một biến thể hợp lệ nhưng thêm chi phí provisioning, migration và giám sát theo tenant. [AWS SaaS Lens](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html), [AWS PostgreSQL bridge model](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/bridge.html).
- Shopify ghi rõ webhook có thể trùng, sai thứ tự hoặc bị bỏ lỡ, và khuyến nghị xác minh chữ ký, chống xử lý trùng, đối soát định kỳ. Đây là bằng chứng cho pattern connector, **không phải bằng chứng Shopee có contract giống Shopify**. [Shopify webhooks](https://shopify.dev/docs/apps/build/webhooks).
- Inventory theo kênh và kho thường có nhiều trạng thái: on-hand, available, committed, reserved, safety stock. Một cột `quantity` không đủ để giải thích số có thể bán. [Shopify inventory management](https://shopify.dev/docs/apps/build/orders-fulfillment/inventory-management-apps).
- Nếu chọn TikTok Shop, cần thiết kế trạng thái `ON_HOLD` và chặn fulfillment trong khoảng giữ đơn theo quy định của nền tảng; API Order List cho phép truy vấn thay đổi theo thời gian để đối soát. [TikTok Shop OMS](https://partner.tiktokshop.com/docv2/page/order-management-system-oms), [Order List API](https://partner.tiktokshop.com/docv2/page/get-order-list-202309).
- Đơn có thể tách thành nhiều phần fulfillment hoặc phương thức giao khác nhau; nên giữ mô hình order và fulfillment tách biệt khi nghiệp vụ pilot thật đòi hỏi. [Shopify orders and fulfillment](https://shopify.dev/docs/apps/build/orders-fulfillment).

## 4. Ba hướng sản phẩm

| Hướng | Giá trị hứa hẹn | Chi phí/rủi ro | Nhận định |
|---|---|---|---|
| A. Bảng tổng hợp đơn từ 3 marketplace sớm | Demo phạm vi rộng. | 3 connector, nhiều trạng thái và lỗi vận hành trước khi có một luồng đáng tin; rủi ro hỗ trợ cao. | Không khuyến nghị trong 3 tháng đầu. |
| **B. Một connector thật + bàn làm việc xử lý lỗi/đối soát** | Giải quyết công việc hằng ngày, đo được độ tin cậy và thời gian xử lý. | Phụ thuộc quyền API, cần đầu tư inbox/outbox, monitoring và UX exception. | **Khuyến nghị** cho beta; độ phức tạp L, rủi ro trung bình nếu có pilot shop và quyền API. |
| C. ERP toàn diện: mua hàng, kế toán, CRM, forecasting, vận chuyển | Phạm vi bán hàng lớn về lâu dài. | XL, nhiều tích hợp và quy tắc nghiệp vụ chưa được kiểm chứng. | Để sau khi xác định phân khúc và tín hiệu trả tiền. |

Điểm khác biệt nên thử nghiệm: **“Không mất đơn và biết chính xác vì sao tồn kho lệch.”** Đây là giả thuyết định vị, chưa phải kết quả nghiên cứu thị trường. Phỏng vấn 5–10 merchant có ít nhất hai kênh bán để kiểm tra mức đau của sai tồn, trễ đơn và quy trình xử lý hiện tại.

## 5. Roadmap đề xuất

*Ước lượng theo giả định 2 kỹ sư full-stack và QA bán thời gian như [pilot plan hiện có](implementation-plan-production-pilot.md). Mốc phụ thuộc quyền API, cửa hàng thử nghiệm và tình trạng deployment.*

| Giai đoạn | Mục tiêu / feature tối thiểu | Điều kiện hoàn thành |
|---|---|---|
| **0–4 tuần: nền SaaS an toàn** | Sửa job IDOR, tenant suspension/JWT path, cache khi đổi tenant; onboarding tạo store + invite acceptance; provisioning có retry; bỏ/ẩn hành động UI chưa hoạt động; test xuyên tenant. | Tenant A không thể đọc dữ liệu/job của B; tenant bị tạm ngưng bị chặn; đổi tenant không còn hiển thị dữ liệu cũ; tạo store từ UI hoạt động từ đầu đến cuối. |
| **4–10 tuần: một connector production** | Chốt một pilot shop và API access; OAuth/token lifecycle nếu provider cần; webhook signature + dedupe + inbox worker; order pull theo mốc thời gian; mapping theo channel account; stock publish qua outbox; reconciliation. | Một đơn thật đi từ marketplace đến OMS, giữ tồn đúng và không tạo trùng; có thể khôi phục khi webhook bị bỏ lỡ hoặc worker lỗi. |
| **10–14 tuần: bàn làm việc vận hành** | Exception queue có owner, nguyên nhân, retry thật, lịch sử; health theo shop; ATS theo kho/SKU; trạng thái sync và cảnh báo; server pagination cho danh sách lớn. | Người vận hành tìm được đơn/tồn lệch và xử lý trong một màn hình; không cần đọc log server cho lỗi phổ biến. |
| **14–24 tuần: mở rộng có kiểm chứng** | Thêm connector thứ hai **hoặc** fulfillment/pick-pack/ship và partial cancel/return tùy dữ liệu pilot; metering theo tenant, gói cước và thanh toán khi đã chốt willingness-to-pay. | Ưu tiên theo dữ liệu sử dụng và hợp đồng thử nghiệm, không theo số trang demo. |

Nếu chỉ có 3 tháng, dừng ở beta với **một kênh thật**, onboarding và exception console. Nếu quyền API chưa có, làm contract tests với fixtures/sandbox và chuyển thời gian sang tenant + operations; không trình bày mock là live integration.

### Backlog feature theo giá trị và dependency

| Feature | Giá trị dự kiến | Effort tương đối | Phụ thuộc / lưu ý |
|---|---|---|---|
| Tenant isolation + provisioning | Rất cao | M–L | Trước mọi pilot nhiều doanh nghiệp. |
| Self-service onboarding + invite acceptance | Cao | M | Phụ thuộc provisioning an toàn. |
| Webhook inbox, replay, reconciliation | Rất cao | L | Phụ thuộc một provider và credential thật. |
| Shop/account-specific SKU mapping | Cao | M | Tránh nhầm hai shop cùng provider. |
| ATS và stock drift theo SKU/kho | Cao | M | Quyết định chính sách safety stock và nguồn sự thật. |
| Exception work queue + sync health | Cao | M | Cần retry/reconciliation thật. |
| Fulfillment work queue / SLA | Trung bình–cao | L | Chỉ khi pilot thực sự xử lý fulfillment trong OMS. |
| Partial cancel, returns, exchanges | Trung bình | L | Cần dữ liệu đơn và inventory ledger ổn định. |
| Operational analytics | Trung bình | M | Dựa trên event thật; không xuất mock reports. |
| Billing tự phục vụ | Trung bình | M | Cần mô hình gói, metering và khách sẵn sàng trả tiền. |

## 6. Quyết định kiến trúc

1. **Giữ modular monolith + worker/queue hiện có.** Chưa có bằng chứng tải, ownership hay nhu cầu deploy độc lập để tách microservices. Đơn giản hóa stack queue nếu một hệ thống không có consumer thật.
2. **Giữ schema-per-tenant trong pilot; tự động hóa trước khi cân nhắc đổi mô hình.** AWS mô tả nó là bridge model với chi phí provisioning và migration. Chỉ cân nhắc pool + RLS khi số tenant hoặc migration overhead thực tế buộc phải đổi; PostgreSQL lưu ý owner và role `BYPASSRLS` có thể vượt chính sách RLS. [AWS](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/bridge.html), [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
3. **Connector là boundary theo provider/account.** Lưu token/permission/version theo account; xác minh event trước khi ghi inbox; business transaction ghi outbox; worker publish có idempotency; reconciliation xử lý drift. Mỗi provider có trạng thái riêng, không ép về một enum làm mất thông tin.
4. **Frontend giữ Next/SWR đang có và sửa contract/state trước.** Bổ sung typed API, cache key theo tenant, loading/error/empty state, URL filters và role-aware actions. Rewrite toàn bộ sang Server Components chưa giải quyết rủi ro chính của pilot.
5. **Định nghĩa nguồn sự thật cho từng trường.** OMS là nguồn cho master SKU/ATS? Marketplace là nguồn cho order status? Merchant được sửa tồn ở đâu? Trả lời bằng một pilot cụ thể trước khi bật đồng bộ hai chiều.

## 7. Chỉ số để quyết định có mở rộng hay không

Các số sau là **mục tiêu đề xuất**, chưa đo được hiện tại: 0 đơn trùng từ cùng external order ID; 0 thao tác cross-tenant được phép; tỷ lệ nhập đơn thành công ≥99%; đối soát tồn ≥99,5%; lỗi sync quan trọng được phát hiện trong <5 phút; người vận hành xử lý exception phổ biến trong <10 phút; ≥3 cửa hàng pilot dùng hệ thống hằng tuần mà không quay lại Excel cho luồng đã chọn. Cần instrument trước khi coi bất kỳ con số nào là kết quả.

## 8. Câu hỏi cần chốt với pilot merchant

1. Khách hàng đầu tiên là shop Việt Nam bán Shopee/TikTok, hay shop Shopify/website? Có quyền API/sandbox và shop thử nghiệm chưa?
2. Mỗi merchant có bao nhiêu shop, SKU, đơn/ngày, kho, nhân viên? Sai sót nào tốn nhiều tiền/thời gian nhất?
3. Khi đơn đến, tồn được giữ lúc nào; trừ on-hand lúc nào; kênh nào được quyền sửa số tồn?
4. Merchant muốn OMS làm fulfillment hay chỉ theo dõi trạng thái từ marketplace/đơn vị vận chuyển?
5. Merchant đang dùng phần mềm nào và có sẵn sàng trả tiền cho việc giảm sai tồn/mất đơn không?

## 9. Giới hạn nghiên cứu

Rà soát repository, các kế hoạch trong `docs/` và tài liệu chính thức AWS, PostgreSQL, Shopify, TikTok Shop qua tìm kiếm web và đọc các trang liên quan. Không có Firecrawl/Exa MCP trong phiên này; nghiên cứu dùng công cụ web hiện có. Các nguồn vendor đáng tin cậy cho hành vi API và mô hình kỹ thuật, nhưng không độc lập để chứng minh nhu cầu thị trường. Chưa phỏng vấn merchant, chưa kiểm chứng giá bán, chưa có bằng chứng quyền Shopee Partner API, chưa chạy E2E với marketplace thật. Các trang nghiên cứu mô tả pattern và API của từng nền tảng; chúng không chứng minh mức độ phù hợp thương mại với phân khúc khách hàng mục tiêu.

### Nguồn chính

1. [AWS SaaS Lens — silo, pool và bridge](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/silo-pool-and-bridge-models.html): khung lựa chọn mô hình tenant.
2. [AWS — PostgreSQL bridge model](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/bridge.html): chi phí và giới hạn schema-per-tenant.
3. [PostgreSQL — Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html): giới hạn kỹ thuật của lựa chọn RLS nếu xem xét sau này.
4. [Shopify — Webhooks](https://shopify.dev/docs/apps/build/webhooks): duplicate, ordering và reconciliation.
5. [Shopify — Inventory management](https://shopify.dev/docs/apps/build/orders-fulfillment/inventory-management-apps): trạng thái tồn kho theo location.
6. [Shopify — Orders and fulfillment](https://shopify.dev/docs/apps/build/orders-fulfillment): mô hình order/fulfillment.
7. [TikTok Shop — OMS](https://partner.tiktokshop.com/docv2/page/order-management-system-oms): scope OMS và On Hold.
8. [TikTok Shop — Get Order List](https://partner.tiktokshop.com/docv2/page/get-order-list-202309): truy vấn đơn theo cập nhật để đối soát.
