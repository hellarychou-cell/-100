"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ReportRadar } from "@/components/ReportRadar";
import {
  ASSESSMENT_DIMENSIONS,
  AssessmentResult,
  DimensionId,
  DimensionScore,
} from "@/lib/assessment";
import { LOCAL_PROFILE_KEY, LOCAL_RESULT_KEY } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type StoredResult = {
  result: AssessmentResult;
  createdAt: string;
};

type Profile = {
  name?: string;
};

const WHY_FROM_DAY: Record<number, string> = {
  1: "你的内在系统整体比较稳定，大概率旧程序已经被看见。你适合从第一天开始完整体验。",
  8: "你已经有明显的自我意识，但某些特定场景还会触发旧程序。可以从 Day 8 进入，直接开始看见更具体的旧程序。",
  20: "你知道很多问题和自己有关，但真的遇到事情还是被打回原形。适合从 Day 20 进入，先把最明显的模式看清楚。",
  26: "你的很多选择被关系、权威、恐惧和家族脚本推着走。适合直接进入 Day 26，从原生家庭和旧脚本里追溯来源。",
  51: "你可能背了太多不属于你的声音。适合从 Day 51 开始，每天一个非常小的新行为，让身体重新体验「我可以不一样」。",
};

export function AssessmentResultClient() {
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showWhyTooltip, setShowWhyTooltip] = useState(false);
  const [showLevelTooltip, setShowLevelTooltip] = useState(false);
  const [showSeedlingTooltip, setShowSeedlingTooltip] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const localProfile = readJson<Profile>(LOCAL_PROFILE_KEY);
      const localResult = readJson<StoredResult>(LOCAL_RESULT_KEY);
      if (!cancelled) {
        setProfile(localProfile ?? {});
        if (localResult?.result) setStored(localResult);
      }

      let loggedIn = false;
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        loggedIn = Boolean(userData.user);
        if (userData.user && !cancelled) {
          const [{ data: profileData }, { data: assessmentData }] = await Promise.all([
            supabase.from("profiles").select("display_name").eq("id", userData.user.id).maybeSingle(),
            supabase
              .from("assessments")
              .select("raw_total,total_score_100,dimension_scores,primary_mode,recommended_day,created_at")
              .eq("user_id", userData.user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          if (!cancelled) {
            if (profileData?.display_name) setProfile({ name: profileData.display_name });
            if (assessmentData) {
              setStored({
                createdAt: assessmentData.created_at,
                result: {
                  rawTotal: assessmentData.raw_total,
                  totalScore100: Number(assessmentData.total_score_100),
                  dimensionScores: assessmentData.dimension_scores as Record<DimensionId, DimensionScore>,
                  primaryMode: assessmentData.primary_mode,
                  recommendedDay: assessmentData.recommended_day,
                },
              });
            }
          }
        }
      }

      if (!cancelled && !loggedIn && localResult?.result) {
        setShowAuthPopup(true);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const result = stored?.result;
  const dimensionRows = useMemo(() => {
    if (!result) return [];
    return ASSESSMENT_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      name: dimension.name,
      score: result.dimensionScores[dimension.id].raw,
      index: result.dimensionScores[dimension.id].index,
      text: getDimensionText(dimension.id, result.dimensionScores[dimension.id].index),
      level: getDimensionLevel(result.dimensionScores[dimension.id].index),
    }));
  }, [result]);

  if (loading) {
    return <EmptyReport title="正在读取报告" text="稍等一下，正在打开你最近一次测评结果。" />;
  }

  if (!result) {
    return <EmptyReport title="还没有报告。" text="完成 42 题后，这里会生成你的雷达图、主模式和推荐起点。" />;
  }

  const name = profile.name || "她";
  const overall = getOverallInfo(result.totalScore100);

  return (
    <>
      {showAuthPopup && (
        <div className="popup-overlay fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm">
          <div className="thin-panel w-full max-w-sm p-8 text-center">
            <div className="mb-4 text-5xl">🔒</div>
            <h2 className="mb-3 text-3xl font-normal">仅登录后可查看知识库</h2>
            <p className="mb-3 text-[#563a2e]">当前你的测评不会保留。</p>
            <p className="mb-6 text-sm text-[var(--muted)]">
              请先登录/注册，登录后你的测评结果、100天进度、神秘卡和AI对话才会存入「我的匣子」。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="border border-ink px-4 py-2"
                onClick={() => setShowAuthPopup(false)}
                type="button"
              >
                关闭
              </button>
              <Link className="bg-ink px-4 py-2 text-white text-center" href="/auth?mode=login">
                去登录
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        <div className="grid min-h-0 grid-cols-[minmax(280px,.7fr)_1fr] max-lg:grid-cols-1 max-lg:overflow-auto">
          {/* Left panel */}
          <aside className="grid min-h-0 grid-rows-[auto_auto_auto] gap-5 border-r border-[var(--line)] bg-paper/50 p-[clamp(20px,3vw,36px)] max-lg:border-b max-lg:border-r-0">
            <div>
              <div className="eyebrow mb-3">Personal report · 42 questions</div>
              <h1 className="font-serif text-[clamp(38px,5vw,68px)] font-normal leading-[.92] text-ink">
                {name}的
                <br />
                底层代码
                <br />
                诊断。
              </h1>
            </div>

            <div className="self-center">
              <div className="flex items-end gap-3">
                <strong className="text-[88px] font-normal leading-[.85]">{Math.round(result.totalScore100)}</strong>
                <span className="pb-2 sans text-sm text-[var(--muted)]">/ 100</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* 标签1：内耗程度 */}
                <div className="relative">
                  <button
                    type="button"
                    className="pill cursor-pointer border border-clay bg-[#f7ead8] text-clay hover:bg-clay hover:text-soft"
                    onClick={() => setShowLevelTooltip((v) => !v)}
                  >
                    {overall.label} ▾
                  </button>
                  {showLevelTooltip && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-64 border border-[var(--line)] bg-soft p-4 shadow-xl">
                      <p className="m-0 text-sm font-medium text-ink">{overall.label}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#563a2e]">{overall.description}</p>
                      <button
                        type="button"
                        className="mt-2 text-xs text-clay underline"
                        onClick={() => setShowLevelTooltip(false)}
                      >
                        收起
                      </button>
                    </div>
                  )}
                </div>

                {/* 标签2：小苗苗状态 */}
                <div className="relative">
                  <button
                    type="button"
                    className="pill cursor-pointer border border-clay bg-[#f7ead8] text-clay hover:bg-clay hover:text-soft"
                    onClick={() => setShowSeedlingTooltip((v) => !v)}
                  >
                    {overall.seedling} ▾
                  </button>
                  {showSeedlingTooltip && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-64 border border-[var(--line)] bg-soft p-4 shadow-xl">
                      <p className="m-0 text-sm font-medium text-ink">{overall.seedling}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#563a2e]">
                        这是你100天旅程开始时的内在状态。每个阶段都有它独特的美，不需要焦虑。
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-xs text-clay underline"
                        onClick={() => setShowSeedlingTooltip(false)}
                      >
                        收起
                      </button>
                    </div>
                  )}
                </div>

                {/* 标签3：推荐起点 */}
                <div className="relative">
                  <button
                    type="button"
                    className="pill cursor-pointer border border-clay bg-[#f7ead8] text-clay hover:bg-clay hover:text-soft"
                    onClick={() => setShowWhyTooltip((v) => !v)}
                  >
                    推荐从 Day {result.recommendedDay} 开始 ▾
                  </button>
                  {showWhyTooltip && (
                    <div className="absolute left-0 top-full z-20 mt-2 w-64 border border-[var(--line)] bg-soft p-4 shadow-xl">
                      <p className="m-0 text-sm font-medium text-ink">为什么是 Day {result.recommendedDay}？</p>
                      <p className="mt-2 text-xs leading-relaxed text-[#563a2e]">
                        {WHY_FROM_DAY[result.recommendedDay] ?? "系统根据你的总分和维度分布，选择一个相对稳定的入口。"}
                      </p>
                      <Link
                        className="mt-2 block text-link text-xs"
                        href={`/day/${result.recommendedDay}`}
                        onClick={() => setShowWhyTooltip(false)}
                      >
                        立即跳转 Day {result.recommendedDay} →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-4 text-base leading-[1.8] text-[#563a2e]">{overall.description}</p>
            </div>

            <div className="grid gap-4 self-end">
              <div className="border-t border-[var(--line)] pt-4">
                <h2 className="m-0 text-2xl font-normal leading-tight">
                  主模式：{result.primaryMode}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#563a2e]">
                  {getModeText(result.primaryMode)}
                </p>
              </div>
              <div className="border-t border-[var(--line)] pt-4">
                <ReportRadar
                  data={dimensionRows.map((row) => ({
                    name: row.name.slice(0, 2),
                    value: row.index,
                  }))}
                />
                <p className="mt-2 sans text-xs text-[var(--muted)]">
                  越靠外圈，该维度内耗越重
                </p>
              </div>
            </div>
          </aside>

          {/* Right panel */}
          <section className="grid min-h-0 gap-0 overflow-auto p-[clamp(16px,2.4vw,28px)] max-lg:overflow-visible">
            <div className="mb-4 border-b border-[var(--line)] pb-4">
              <h2 className="m-0 text-2xl font-normal">六维度解读</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                点击展开各维度详情 · {dimensionRows.filter((r) => r.level === "high").length}个高位维度优先处理
              </p>
            </div>
            <div className="grid gap-3">
              {dimensionRows.map((dimension) => (
                <DimensionCard key={dimension.id} dimension={dimension} />
              ))}
            </div>
          </section>
        </div>

        {/* 底部入口 - 截图时不显示 */}
        <div className="no-print flex flex-col items-center gap-3 border-t border-[var(--line)] bg-soft/50 p-8">
          <Link className="action-primary" href={`/day/${result.recommendedDay}`}>
            从 Day {result.recommendedDay} 开始
          </Link>
          <Link className="text-link text-sm" href="/knowledge">
            查看全部100天目录
          </Link>
        </div>
      </div>
    </>
  );
}

function DimensionCard({
  dimension,
}: {
  dimension: {
    id: string;
    name: string;
    score: number;
    index: number;
    text: string;
    level: string;
  };
}) {
  const [open, setOpen] = useState(dimension.level === "high");

  return (
    <div className={`border border-[var(--line)] ${dimension.level === "high" ? "border-clay/40 bg-[#f7ead8]/40" : "bg-soft/40"}`}>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-normal text-ink">{dimension.name}</span>
              <span
                className={`pill ${
                  dimension.index > 60
                    ? "bg-red-100 text-red-700"
                    : dimension.index > 40
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {dimension.index > 60 ? "重度" : dimension.index > 40 ? "中度" : "轻度"}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="progress-track w-24">
                <i
                  className="progress-fill"
                  style={{
                    width: `${dimension.index}%`,
                    background: dimension.index > 60 ? "var(--clay)" : dimension.index > 40 ? "#c8a05b" : "#6b9e78",
                  }}
                />
              </div>
              <span className="sans text-xs text-[var(--muted)]">
                {dimension.score}/35 · {dimension.index}分
              </span>
            </div>
          </div>
        </div>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line)] text-clay transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="border-t border-[var(--line)] p-4">
          <p className="text-sm leading-[1.85] text-[#563a2e]">{dimension.text}</p>
        </div>
      )}
    </div>
  );
}

function EmptyReport({ title, text }: { title: string; text: string }) {
  return (
    <section className="grid min-h-0 place-items-center p-8 text-center">
      <div className="max-w-xl">
        <div className="eyebrow mb-4">Assessment report</div>
        <h1 className="display-title text-[clamp(48px,7vw,86px)]">{title}</h1>
        <p className="mx-auto mt-4 max-w-md leading-[1.85] text-[#563a2e]">{text}</p>
        <Link className="action-primary mt-6 inline-flex" href="/assessment/profile">
          去完成测评
        </Link>
      </div>
    </section>
  );
}

function readJson<T>(key: string): T | null {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

// --- Interpretation content ---

function getModeText(mode: string): string {
  const map: Record<string, string> = {
    讨好型: "你的系统很擅长照顾别人，也很容易把别人的反应当成自己的责任。你在关系中总是那个先让步的人，不是因为你软弱，是因为你内在有一个声音在说：如果我不好说话，就会被抛弃。",
    证明型: "你很容易把价值感放在结果上，好像必须不断做到，才允许自己安心。外在条件好的时候你能自信，但内心深处总有一个'还不够'的声音在追赶你。",
    失权型: "你可能习惯先看别人怎么想，再决定自己可不可以要。你把自己的需求藏得很深，不是不要，是不敢要。",
    高敏内耗型: "你对细节和关系氛围很敏锐，也容易因此消耗太多精力。你像一块情绪海绵——周围人的情绪你全部吸收了，社交后需要很长时间恢复。",
    冻结拖延型: "你不是没有能力行动，而是重要的事会先触发紧张和迟疑。你的能量在'油门'和'刹车'之间被撕裂，忙了一天但什么都没推进。",
    财富收缩型: "你向往拥有更多，但身体里也可能同时运行着不配得和不安全。你在赚钱和花钱之间没有真正的自主感，总是被某种'应该'驱动。",
    控制型: "如果我不掌控一切，就会失控。你总是在预判风险、控制局面，用过度准备来缓解焦虑。",
    混合型: "你的情况较为复杂，多个维度都有较高分数，建议做一次完整的1v1解读。",
  };
  return map[mode] ?? "你的六个维度交织在一起，报告会帮你找到最适合先打开的入口。";
}

function getDimensionLevel(index: number): "high" | "mid" | "low" {
  if (index > 60) return "high";
  if (index > 40) return "mid";
  return "low";
}

function getDimensionText(id: string, index: number): string {
  const texts: Record<string, { high: string; mid: string; low: string }> = {
    "self-worth": {
      high: "「证明程序」运行中。你内在有一个声音在说：你还不够好，你需要做得更多才值得被爱。外在条件好的时候你能自信，但内心深处总有一个'还不够'的声音在追赶你。你不是不优秀，是你的系统把'被认可'当成了呼吸一样的需求——得不到就窒息。",
      mid: "「摇摆模式」。你有时候觉得自己挺好的，有时候又会掉进'我不配'的漩涡。外在条件好的时候你能自信，一旦遇到挫折或被质疑，内在的不安全感会迅速涌上来。你正在'知道'和'做到'之间挣扎。",
      low: "「内在稳定」。你对自己的价值有比较清晰的认知，不太容易被外界评价动摇。你能接受自己的不完美，也能接收别人的认可。你的自我价值感是从内在长出来的，不依赖外部证明。",
    },
    boundaries: {
      high: "「讨好程序」全速运行。你在关系中扮演的是'付出者''调和者''照顾者'，但很少是'自己'。你不是不想为自己说话，是内在有个声音告诉你：如果你不好说话了，你就会被抛弃。你把大量的生命能量用在了'管理别人的情绪'上，时间、精力、注意力都在围着别人转，留给自己的所剩无几。",
      mid: "「有觉察但还做不到」。你已经意识到自己在关系中的讨好模式，但在真实场景中还是很难做到拒绝。你可能'脑子很清楚但身体很诚实'——知道该说不，但嘴巴先说了好。你正在建立边界感的路上，偶尔会退回去，这很正常。",
      low: "「边界清晰」。你在关系中能比较好地保持自我，能温和但坚定地表达需求。你不为别人的情绪过度负责，也不怕因为说'不'而失去关系。你的关系边界是健康的。",
    },
    decision: {
      high: "「外包模式」运行中。你的决策系统被外包了。你不是没有判断力，是内在有一个底层代码在说：'如果我选错了，那就是我的错，而我承受不起这个后果。'所以你宁愿不选、晚选、让别人选。决策前的焦虑 + 决策后的后悔，组成了一个永动机般的内耗循环。",
      mid: "「半自主模式」。你在一些领域能自主决策，但在关键领域（事业方向、定价、大额投资）还是容易犹豫和依赖他人意见。你正在从'向外求'走向'向内看'，但还需要更多练习'信任自己的判断'。",
      low: "「内在导航在线」。你有比较清晰的内在导航系统，能在收集信息后做出自主判断，并为自己的选择负责。你不怕做错，因为你知道'做了再调整'比'永远在想'更有效。",
    },
    emotion: {
      high: "「情绪海绵」模式。你是一块情绪海绵——周围人的情绪你全部吸收了。你的底层代码里写着：'别人的感受比我的重要，别人不开心我就不安全。'你花大量精力在'读空气'上，在社交后需要很长时间恢复。你的情绪系统一直在超负荷运转。",
      mid: "「部分渗透」。你能感知到自己有时候会被别人的情绪影响，但还能在一些时候找回自己的中心。你在亲近的人面前更容易被影响，在不太熟的人面前可以保持距离。你正在学习'分辨哪些情绪是我的，哪些不是'。",
      low: "「情绪主权在握」。你能比较好地分辨哪些情绪是自己的、哪些是别人的。你有同理心，但不会被别人的情绪裹挟。你能在感受到对方情绪的同时保持自己的中心。",
    },
    action: {
      high: "「刹车模式」全开。你的行动通道被一个'内在刹车系统'卡住了。你不缺想法，不缺能力，甚至不缺机会——你缺的是'允许自己开始'的许可。你的底层代码在说：'如果不完美，就不要做；如果可能犯错，就不要开始。'你的大量能量不是花在'做'上，而是花在'想做但不敢做'和'做了怕做不好'上。",
      mid: "「间歇启动」。你有时候可以突破阻力开始行动，但在关键时刻（发布新产品、做重大决定、暴露自己）会卡住。你能做别人安排的事，但对'自己主导'的事更容易拖延。你的行动力有波动——状态好的时候很猛，状态差的时候完全停滞。",
      low: "「创造通道畅通」。你能比较快地将想法转化为行动，不追求完美主义，接受'边做边调整'。你面对新机会时的第一反应是兴奋而不是恐惧。你的能量主要用于创造，而不是对抗自己。",
    },
    wealth: {
      high: "「漏斗模式」。你的财富容器有漏洞。不是你赚不到钱，是你的内在系统'承不住'钱。你对钱的恐惧和对钱的渴望，同时在运行。你在财富上的能量是分裂的——一边想赚更多，一边在潜意识里推走已经到手的。",
      mid: "「有限容器」。你能赚到一定水平的钱，但很难突破到下一个台阶。你在某个收入区间会觉得'差不多了'或'到头了'。你对钱不是完全排斥，但在金额变大的时候会紧张。当超出容量时，钱会通过各种方式'漏出去'。",
      low: "「财富容器扩容中」。你与金钱的关系比较健康，能自在地赚钱和花钱。你不回避谈钱，也不被钱绑架。你相信丰盛是可以持续的，也愿意为自己投资。",
    },
  };
  const data = texts[id];
  if (!data) return "";
  if (index > 60) return data.high;
  if (index > 40) return data.mid;
  return data.low;
}

function getOverallInfo(score: number): { label: string; seedling: string; description: string } {
  if (score > 80) {
    return {
      label: "第五档：深度隐形内耗",
      seedling: "🌑 还在土里，但已经有力量",
      description: "你可能经常觉得累、卡、拧巴、不自由。但这不是你不行。更可能是你身上背了太多不属于你的声音：家庭的声音、社会的声音、关系里的声音、传统观念的声音、过去创伤的声音。它们运行得太久，已经让你误以为那就是你。你现在最需要的不是再逼自己想通，而是被系统地看见、承接和支持。",
    };
  }
  if (score > 60) {
    return {
      label: "第四档：重度隐形内耗",
      seedling: "🌰 刚刚破土",
      description: "你的很多选择可能并不是从自己出发，而是被关系、权威、恐惧、羞耻、旧信念和家族脚本推着走。你不是不努力，而是大量能量都消耗在对抗自己、解释自己、怀疑自己和照顾别人上。脑子知道要为自己活，但身体做不到；想拒绝，但话到嘴边又咽回去。",
    };
  }
  if (score > 40) {
    return {
      label: "第三档：中度隐形内耗",
      seedling: "🌿 根系正在变深",
      description: "你已经不是完全没有觉察的人。你知道很多问题和自己的内在模式有关。但你会发现：知道归知道，真的遇到事情还是会被打回原形。你的卡点不是单一的，它可能同时出现在事业、关系、情绪和金钱里。",
    };
  }
  if (score > 20) {
    return {
      label: "第二档：轻中度隐形内耗",
      seedling: "🌱 正在扎根生长",
      description: "你已经有明显的自我意识，也开始知道自己不是只能活在别人的期待里。但在某些特定场景里，旧程序还是会突然接管你，比如亲密关系、父母评价、客户反馈、谈钱收费、公开表达、做重要选择。",
    };
  }
  return {
    label: "第一档：轻度隐形内耗",
    seedling: "🌿 正在抽枝开花",
    description: "你的内在系统整体比较稳定。你不是没有卡点，而是多数旧程序已经能被你觉察、识别和调整。你在关系中能保留自己，在事业里有一定判断力，也能逐渐接住金钱、机会、赞美和更好的生活。你已经不太适合用恐惧、讨好和自我怀疑来驱动自己了。",
  };
}
