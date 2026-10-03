import { PublicFooter, PublicHeader } from "@/components/brand/public-shell";
import { ClinicLocator } from "@/components/clinic/clinic-locator";
import { Breadcrumbs, MetricCard } from "@/components/ui/primitives";
import { getClinics } from "@/lib/api";

export default async function ClinicLocatorPage() {
  const clinics = await getClinics();

  return (
    <>
      <PublicHeader />
      <main>
        <section className="bg-[color:var(--surface)] pt-8">
          <div className="content-shell">
            <Breadcrumbs
              items={[
                { href: "/", label: "Trang chủ" },
                { label: "Tìm điểm bán" },
              ]}
            />
          </div>
        </section>

        <section className="relative overflow-hidden bg-[color:var(--surface)] py-14">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-white" />
          <div className="content-shell relative">
            <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--secondary)]">
                  O2O clinic discovery
                </p>
                <h1 className="display-title mt-5 max-w-4xl">
                  Tìm nơi đo mắt và tư vấn tròng kính phù hợp gần bạn.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
                  OPTIQIS kết nối người dùng với hệ thống phòng khám và đại lý
                  đối tác để trải nghiệm đo mắt trực tiếp, nhận tư vấn vật liệu,
                  lớp phủ và chỉ số tròng kính. MVP không hỗ trợ đặt lịch hay
                  bán tròng online.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <MetricCard label="Địa điểm demo" value={clinics.length} />
                <MetricCard label="Hotline tư vấn" value="1800 6919" />
                <MetricCard label="Dịch vụ trọng tâm" value="12 bước" />
              </div>
            </div>
          </div>
        </section>

        <ClinicLocator clinics={clinics} />
      </main>
      <PublicFooter />
    </>
  );
}
