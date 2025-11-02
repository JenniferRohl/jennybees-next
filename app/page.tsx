import { Suspense } from "react";
import JennyBeesCreation from "../components/JennyBeesCreation";

// Helps when using useSearchParams in client components
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <JennyBeesCreation />
    </Suspense>
  );
}