import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { ReportRadar } from "@/components/ReportRadar";
import {
  ASSESSMENT_DIMENSIONS,
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

function getOverallInfo(score: number) {
  if (score > 80)
    return { label: "第五档：深度隐形内耗", seedling: "🌑 还在土里，但已经有力量", description: "你可能经常觉得累、卡、拧巴、不自由。但这不是你不行。更可能是你身上背了太多不属于你的声音。" };
  if (score > 60)
    return { label: "第四档：重度隐形内耗", seedling: "🌰 刚刚破土", description: "你的很多选择可能并不是从自己出发，而是被关系、权威、恐惧、羞耻、旧信念和家族脚本推着走。" };
  if (score > 40)
    return { label: "第三档：中度隐形内耗", seedling: "🌿 根系正在变深", description: "你已经知道很多问题和自己的内在模式有关。但真的遇到事情还是会被打回原形。" };
  if (score > 20)
    return { label: "第二档：轻中度隐形内耗", seedling: "🌱 正在扎根生长", description: "你已经有明显的自我意识，也开始知道自己不是只能活在别人的期待里。" };
  return { label: "第一档：轻度隐形内耗", seedling: "🌿 正在抽枝开花", description: "你的内在系统整体比较稳定，多数旧程序已经能被你觉察、识别和调整。" };
}

function getDimensionLevel(index: number): "high" | "mid" | "low" {
  if (index > 60) return "high";
  if (index > 40) return "mid";
  return "low";
}

function getModeText(mode: string): string {
  const map: Record<string, string> = {
    讨好型: "你的系统很擅长照顾别人，也很容易把别人的反应当成自己的责任。",
    证明型: "你很容易把价值感放在结果上，好像必须不断做到，才允许自己安心。",
   失权型: "你可能习惯先看别人怎么想，再决定自己可不可以要。",
    高敏内耗型: "你对细节和关系氛围很敏锐，也容易因此消耗太多精力。",
    冻结拖延型: "你不是没有能力行动，而是重要的事会先触发紧张和迟疑。",
    财富收缩型: "你向往拥有更多，但身体里也可能同时运行着不配得和不安全。",
    控制型: "如果我不掌控一切，就会失控。你总是在预判风险、控制局面。",
    混合型: "你的情况较为复杂，多个维度都有较高分数，建议做一次完整的1v1解读。",
  };
  return map[mode] ?? "你的六个维度交织在一起，报告会帮你找到最适合先打开的入口。";
}

function getDimensionText(id: string, index: number): string {
  const texts: Record<string, { high: string; mid: string; low: string }> = {
    "self-worth": { high: "「证明程序」运行中。你内在有一个声音在说：你还不够好，你需要做得更多才值得被爱。", mid: "「摇摆模式」。你有时候觉得自己挺好的，有时候又会掉进'我不配'的漩涡。", low: "「内在稳定」。你对自己的价值有比较清晰的认知，不太容易被外界评价动摇。" },
    boundaries: { high: "「讨好程序」全速运行。你在关系中扮演的是'付出者''调和者''照顾者'，但很少是'自己'。", mid: "「有觉察但还做不到」。你已经意识到自己在关系中的讨好模式，但在真实场景中还是很难做到拒绝。", low: "「边界清晰」。你在关系中能比较好地保持自我，能温和但坚定地表达需求。" },
    decision: { high: "「外包模式」运行中。你的决策系统被外包了，内在有一个底层代码在说：'如果我选错了，那就是我的错'。", mid: "「半自主模式」。你在一些领域能自主决策，但在关键领域还是容易犹豫和依赖他人意见。", low: "「内在导航在线」。你有比较清晰的内在导航系统，能在收集信息后做出自主判断。" },
    emotion: { high: "「情绪海绵」模式。你是一块情绪海绵——周围人的情绪你全部吸收了，你的情绪系统一直在超负荷运转。", mid: "「部分渗透」。你能感知到自己有时候会被别人的情绪影响，但还能在一些时候找回自己的中心。", low: "「情绪主权在握」。你能比较好地分辨哪些情绪是自己的、哪些是别人的。" },
    action: { high: "「刹车模式」全开。你的行动通道被一个'内在刹车系统'卡住了，你不缺想法和能力，缺的是'允许自己开始'的许可。", mid: "「间歇启动」。你有时候可以突破阻力开始行动，但在关键时刻会卡住。", low: "「创造通道畅通」。你能比较快地将想法转化为行动，不追求完美主义，接受'边做边调整'。" },
    wealth: { high: "「漏斗模式」。你的财富容器有漏洞，不是你赚不到钱，是你的内在系统'承不住'钱。", mid: "「有限容器」。你能赚到一定水平的钱，但很难突破到下一个台阶。", low: "「财富容器扩容中」。你与金钱的关系比较健康，能自在地赚钱和花钱。" },
  };
  const data = texts[id];
  if (!data) return "";
  if (index > 60) return data.high;
  if (index > 40) return data.mid;
  return data.low;
}

export default async function AdminUserReportPage({ params }: PageProps) {
  const { userId } = await params;
  const data = await getUserReport(userId);
  if (!data) notFound();

  const { user, result } = data;
  const overall = result ? getOverallInfo(result.totalScore100) : null;

  const dimensionRows = result
    ? ASSESSMENT_DIMENSIONS.map((dimension) => ({
        id: dimension.id,
        name: dimension.name,
        score: result.dimensionScores[dimension.id].raw,
        index: result.dimensionScores[dimension.id].index,
        text: getDimensionText(dimension.id, result.dimensionScores[dimension.id].index),
        level: getDimensionLevel(result.dimensionScores[dimension.id].index),
      }))
    : [];

  return (
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
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
          <div className="grid min-h-0 grid-cols-[minmax(280px,.7fr)_1fr] max-lg:grid-cols-1 max-lg:overflow-auto">
            <aside className="grid min-h-0 grid-rows-[auto_auto_auto] gap-5 border-r border-[var(--line)] bg-paper/50 p-[clamp(20px,3vw,36px)] max-lg:border-b max-lg:border-r-0">
              <div>
                <div className="eyebrow mb-3">Admin · {user.phone}</div>
                <h1 className="font-serif text-[clamp(38px,5vw,68px)] font-normal leading-[.92] text-ink">
                  {user.display_name || "她"}的<br />底层代码<br />诊断。
                </h1>
              </div>
              <div className="self-center">
                <div className="flex items-end gap-3">
                  <strong className="text-[88px] font-normal leading-[.85]">{Math.round(result.totalScore100)}</strong>
                  <span className="pb-2 sans text-sm text-[var(--muted)]">/ 100</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="pill">{overall!.label}</span>
                  <span className="pill">{overall!.seedling}</span>
                  <span className="pill">推荐 Day {result.recommendedDay}</span>
                </div>
                <p className="mt-4 text-base leading-[1.8] text-[#563a2e]">{overall!.description}</p>
              </div>
              <div className="grid gap-4 self-end">
                <div className="border-t border-[var(--line)] pt-4">
                  <h2 className="m-0 text-2xl font-normal">主模式：{result.primaryMode}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#563a2e]">{getModeText(result.primaryMode)}</p>
                </div>
                <div className="border-t border-[var(--line)] pt-4">
                  <ReportRadar data={dimensionRows.map((row) => ({ name: row.name.slice(0, 2), value: row.index }))} />
                  <p className="mt-2 sans text-xs text-[var(--muted)]">越靠外圈，该维度内耗越重</p>
                </div>
              </div>
            </aside>
            <section className="grid min-h-0 gap-0 overflow-auto p-[clamp(16px,2.4vw,28px)] max-lg:overflow-visible">
              <div className="mb-4 border-b border-[var(--line)] pb-4">
                <h2 className="m-0 text-2xl font-normal">六维度解读</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">{dimensionRows.filter((r) => r.level === "high").length}个高位维度优先处理</p>
              </div>
              <div className="grid gap-3">
                {dimensionRows.map((dimension) => (
                  <details key={dimension.id} className={`border border-[var(--line)] ${dimension.level === "high" ? "border-clay/40 bg-[#f7ead8]/40" : "bg-soft/40"}`}>
                    <summary className="flex cursor-pointer items-center gap-3 p-4 list-none">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="font-serif text-lg font-normal text-ink">{dimension.name}</span>
                        <span className={`pill ${dimension.index > 60 ? "bg-red-100 text-red-700" : dimension.index > 40 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                          {dimension.index > 60 ? "重度" : dimension.index > 40 ? "中度" : "轻度"}
                        </span>
                      </div>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line)] text-clay">▾</span>
                    </summary>
                    <div className="border-t border-[var(--line)] p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="progress-track w-24">
                          <i className="progress-fill" style={{ width: `${dimension.index}%`, background: dimension.index > 60 ? "var(--clay)" : dimension.index > 40 ? "#c8a05b" : "#6b9e78" }} />
                        </div>
                        <span className="sans text-xs text-[var(--muted)]">{dimension.score}/35 · {dimension.index}分</span>
                      </div>
                      <p className="text-sm leading-[1.85] text-[#563a2e]">{dimension.text}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}