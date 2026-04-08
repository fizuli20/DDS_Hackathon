import { Suspense } from "react";
import { StudentsScreen } from "@/components/hspts-screens";

export default function StudentsPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-[#e5e7eb] bg-white p-8 text-sm text-[#6b7280]">
          Loading filters…
        </div>
      }
    >
      <StudentsScreen />
    </Suspense>
  );
}
