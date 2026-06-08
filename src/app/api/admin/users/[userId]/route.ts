import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ASSESSMENT_DIMENSIONS, calculateAssessmentResult } from "@/lib/assessment";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { userId } = await context.params;
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

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 如果有原始答卷数据，重新计算结果
  let result = null;
  if (assessment) {
    if (assessment.raw_total !== null) {
      // 有完整存储，直接用
      result = {
        rawTotal: assessment.raw_total,
        totalScore100: Number(assessment.total_score_100),
        dimensionScores: assessment.dimension_scores,
        primaryMode: assessment.primary_mode,
        recommendedDay: assessment.recommended_day,
      };
    } else if (assessment.answers) {
      // 从答卷重新计算
      const answers = assessment.answers as Record<string, number>;
      result = calculateAssessmentResult(answers);
    }
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      name: profile.display_name,
      phone: profile.phone,
    },
    assessment: assessment
      ? {
          id: assessment.id,
          createdAt: assessment.created_at,
          ...(result ?? {}),
        }
      : null,
    membership: membership
      ? {
          expiresAt: membership.expires_at,
          aiPaused: membership.ai_paused,
        }
      : null,
  });
}