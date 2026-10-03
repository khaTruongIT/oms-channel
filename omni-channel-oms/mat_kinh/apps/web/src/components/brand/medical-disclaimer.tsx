import { AlertTriangle } from "lucide-react";

export function MedicalDisclaimer() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 shrink-0" size={18} />
        <p>
          Noi dung tren nen tang OPTIQIS chi phuc vu giao duc suc khoe thi luc
          va tham khao cong nghe trong kinh. Khach hang can do khuc xa va nhan
          tu van truc tiep tu bac si/chuyen vien truoc khi lua chon giai phap.
        </p>
      </div>
    </div>
  );
}
