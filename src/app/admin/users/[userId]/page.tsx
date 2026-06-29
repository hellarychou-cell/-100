import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { AssessmentReportView } from "@/components/AssessmentReportView";
import {
  calculateAssessmentResult,
  AssessmentResult,
  DimensionId,
  DimensionScore,
} from "@/lib/assessment";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type PageProps = { params: Promise<{ userId: string }> };

async function getUserReport(userId: string) {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Server misconfigured");
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const [{ data: profile }, { data: assessment }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, phone").eq("id", userId).maybeSingle(),
    supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("expires_at, ai_paused")
      .eq("user_id", userId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!profile) return null;

  let result: AssessmentResult | null = null;
  if (assessment) {
    if (assessment.raw_total !== null) {
      result = {
        rawTotal: assessment.raw_total,
        totalScore100: Number(assessment.total_score_100),
        dimensionScores: assessment.dimension_scores as Record<DimensionId, DimensionScore>,
        primaryMode: assessment.primary_mode,
        recommendedDay: assessment.recommended_day,
      };
    } else if (assessment.answers) {
      const answers = assessment.answers as Record<string, number>;
      result = calculateAssessmentResult(answers);
    }
  }

  return { user: profile, assessment, membership, result };
}

export default async function AdminUserReportPage({ params }: PageProps) {
  const { userId } = await params;
  const data = await getUserReport(userId);
  if (!data) notFound();

  const { assessment, user, result } = data;
  const createdAt = assessment?.created_at ? new Date(assessment.created_at) : new Date();

  return (
    <main className="viewport botanical-page admin-viewport">
      <section className="paper-frame admin-mobile-shell grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100 · 后台</div>
          <span>{user.display_name || "用户"} · 测评报告</span>
          <a className="text-link" href="/admin">返回用户列表</a>
        </header>

        {!result ? (
          <div className="grid place-items-center p-16 text-center">
            <p className="text-clay">该用户暂未完成测评。</p>
            <a className="text-link mt-4" href="/admin">返回</a>
          </div>
        ) : (
          <section className="assessment-report min-h-0 overflow-auto">
            <AssessmentReportView
              createdAt={createdAt}
              profile={{ name: user.display_name || user.phone || "她" }}
              result={result}
            />
          </section>
        )}
      </section>
    </main>
  );
}
