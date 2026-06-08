import { AuthGate } from "@/components/AuthGate";
import { HomeDashboard } from "@/components/HomeDashboard";

export default function HomePage() {
  return (
    <AuthGate requireMember={false}>
      <HomeDashboard />
    </AuthGate>
  );
}
