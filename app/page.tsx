// app/page.tsx
import { Suspense } from "react";
import JennyBeesCreation from "../components/JennyBeesCreation";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <JennyBeesCreation />
    </Suspense>
  );
}
