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

export function AssessmentResultClient() {
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [profile, setProfile] = useState<Profile>({});
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

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

      if (!cancelled) {
        setIsLoggedIn(loggedIn);
        // Show popup only if result exists (localStorage has data) but user is not logged in
        if (!loggedIn && localResult?.result) {
          setShowAuthPopup(true);
        }
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm">
          <div className="thin-panel w-full max-w-sm p-8 text-center">
            <div className="mb-4 text-5xl">🔒</div>
            <h2 className="mb-3 text-3xl font-normal">仅登录后可查看知识库</h2>
            <p className="mb-3 text-[#563a2e]">当前你的测评不会保留。</p>
            <p className="mb-6 text-sm text-[var(--muted)]">
              请先登录/注册，登录后你的测评结果、100天进度、神秘卡和AI对话才会存入「我的匣子」。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link className="border border-ink px-4 py-2 text-center" href="/">
                关闭
              </Link>
              <Link className="bg-ink px-4 py-2 text-white" href="/auth?mode=login">
                去登录
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="grid min-h-0 grid-cols-[minmax(280px,.7fr)_1fr] max-lg:grid-cols-1 max-lg:overflow-auto">
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
            <div className="mt-3 flex items-center gap-2">
              <span className="pill">{overall.label}</span>
              <span className="pill">{overall.seedling}</span>
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
      </section>
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
              {dimension.level === "high" && (
                <span className="pill bg-clay/20 text-clay">高位</span>
              )}
              {dimension.level === "low" && (
                <span className="pill bg-green-100 text-green-700">稳定</span>
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="progress-track w-24">
                <i
                  className="progress-fill"
                  style={{
                    width: `${dimension.index}%`,
                    background: dimension.level === "high" ? "var(--clay)" : dimension.level === "low" ? "#6b9e78" : "var(--ink)",
                  }}
                />
              </div>
              <span className="sans text-xs text-[var(--muted)]">
                {dimension.score}/30 · {dimension.level === "high" ? "高" : dimension.level === "mid" ? "中" : "低"}
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
  };
  return map[mode] ?? "你的六个维度交织在一起，报告会帮你找到最适合先打开的入口。";
}

function getDimensionLevel(index: number): "high" | "mid" | "low" {
  if (index >= 70) return "high";
  if (index >= 40) return "mid";
  return "low";
}

function getDimensionText(id: string, index: number): string {
  const texts: Record<string, { high: string; mid: string; low: string }> = {
    "self-worth": {
      high: "「证明模式」运行中。你的底层代码里有一个声音在说：「你还不够好，你需要做得更多才值得被爱。」你对自己的要求很高，内在有一个永远不满意的声音。你可能在事业上做得不错，但内心深处始终觉得「这不够」。你不是不优秀，是你的系统把「被认可」当成了呼吸一样的需求——得不到就窒息。你花大量能量在「证明自己」上，而不是在「享受自己」上。",
      mid: "「摇摆模式」。你有时候觉得自己挺好的，有时候又会掉进「我不配」的漩涡。外在条件好的时候你能自信，一旦遇到挫折或被质疑，内在的不安全感会迅速涌上来。你正在「知道」和「做到」之间挣扎。你的自我价值感不稳定，容易被外部评价左右，能量花在了情绪波动上。",
      low: "「内在稳定」。你对自己的价值有比较清晰的认知，不太容易被外界评价动摇。你能接受自己的不完美，也能接收别人的认可。你的自我价值感是从内在长出来的，不依赖外部证明。",
    },
    boundaries: {
      high: "「讨好程序」全速运行。你的关系模式被一个旧程序控制着：「我必须让别人满意，才能确保自己是安全的。」你在关系中扮演的是「付出者」「调和者」「照顾者」，但很少是「自己」。你不是不想为自己说话，是内在有个声音告诉你：如果你不好说话了，你就会被抛弃。你把大量的生命能量用在了「管理别人的情绪」上。你的时间、精力、注意力都在围着别人转，留给自己的所剩无几。这也是为什么你总觉得很累，但说不出具体累在哪。",
      mid: "「有觉察但还做不到」。你已经意识到自己在关系中的讨好模式，但在真实场景中还是很难做到拒绝。你可能「脑子很清楚但身体很诚实」——知道该说不，但嘴巴先说了好。你正在建立边界感的路上，偶尔会退回去，这很正常。内在的「旧我」和「新我」在拉扯，你为「做不到」自己知道该做的事而自我攻击。",
      low: "「边界清晰」。你在关系中能比较好地保持自我，能温和但坚定地表达需求。你不为别人的情绪过度负责，也不怕因为说「不」而失去关系。你的关系边界是健康的。",
    },
    decision: {
      high: "「外包模式」运行中。你的决策系统被外包了。你不是没有判断力，是内在有一个底层代码在说：「如果我选错了，那就是我的错，而我承受不起这个后果。」所以你宁愿不选、晚选、让别人选。你的「选择困难」不是因为选项太多，是因为你的内在系统承受不了「为自己负责」这件事。决策前的焦虑 + 决策后的后悔，组成了一个永动机般的内耗循环。",
      mid: "「半自主模式」。你在一些领域能自主决策（比如日常生活），但在关键领域（事业方向、定价、大额投资）还是容易犹豫和依赖他人意见。你正在从「向外求」走向「向内看」，但还需要更多练习「信任自己的判断」。在重要决策节点上的反复纠结消耗了你本该用于行动的能量。",
      low: "「内在导航在线」。你有比较清晰的内在导航系统，能在收集信息后做出自主判断，并为自己的选择负责。你不怕做错，因为你知道「做了再调整」比「永远在想」更有效。",
    },
    emotion: {
      high: "「情绪海绵」模式。你是一块情绪海绵——周围人的情绪你全部吸收了。你不只是「高敏感」，你的底层代码里写着：「别人的感受比我的重要，别人不开心我就不安全。」你花大量精力在「读空气」上，在社交后需要很长时间恢复。你的情绪不是你自己的——一半是你的，一半是你从别人那里拿过来的。你的情绪系统一直在超负荷运转，因为它不只在处理你自己的情绪，还在处理所有你接触到的人的情绪。这是最消耗能量的隐形内耗之一。",
      mid: "「部分渗透」。你能感知到自己有时候会被别人的情绪影响，但还能在一些时候找回自己的中心。你在亲近的人面前更容易被影响，在不太熟的人面前可以保持距离。你正在学习「分辨哪些情绪是我的，哪些不是」。在亲密关系和重要客户面前，你的情绪边界会变得模糊，被对方的情绪带着走。",
      low: "「情绪主权在握」。你能比较好地分辨哪些情绪是自己的、哪些是别人的。你有同理心，但不会被别人的情绪裹挟。你能在感受到对方情绪的同时保持自己的中心。",
    },
    action: {
      high: "「刹车模式」全开。你的行动通道被一个「内在刹车系统」卡住了。你不缺想法，不缺能力，甚至不缺机会——你缺的是「允许自己开始」的许可。你的底层代码在说：「如果不完美，就不要做；如果可能犯错，就不要开始。」你的大量能量不是花在「做」上，而是花在「想做但不敢做」和「做了怕做不好」上。拖延不是懒，是内在在打架。一边想做，一边怕做。你的能量在「油门」和「刹车」之间被撕裂，忙了一天但什么都没推进。",
      mid: "「间歇启动」。你有时候可以突破阻力开始行动，但在关键时刻（比如发布新产品、做重大决定、暴露自己）会卡住。你能做别人安排的事，但对「自己主导」的事更容易拖延。你的行动力有波动——状态好的时候很猛，状态差的时候完全停滞。能量不稳定，在「冲刺」和「停滞」之间来回切换，缺少持续且平稳的行动节奏。",
      low: "「创造通道畅通」。你能比较快地将想法转化为行动，不追求完美主义，接受「边做边调整」。你面对新机会时的第一反应是兴奋而不是恐惧。你的能量主要用于创造，而不是对抗自己。",
    },
    wealth: {
      high: "「漏斗模式」。你的财富容器有漏洞。不是你赚不到钱，是你的内在系统「承不住」钱。你的底层代码可能是：「有钱的人不是好人」「钱来了一定会走」「我不配拥有太多。」所以你赚到了就花、到手了就散、越有钱越焦虑。你对钱的恐惧和对钱的渴望，同时在运行。你在财富上的能量是分裂的——一边想赚更多，一边在潜意识里推走已经到手的。你的「赚钱动力」和「财富恐惧」在互相对抗。",
      mid: "「有限容器」。你能赚到一定水平的钱，但很难突破到下一个台阶。你在某个收入区间会觉得「差不多了」或「到头了」。你对钱不是完全排斥，但在金额变大的时候会紧张。你的财富容器有大小——当超出容量时，钱会通过各种方式「漏出去」。你在赚钱和花钱之间没有真正的自主感，总是被某种「应该」驱动。",
      low: "「财富容器扩容中」。你与金钱的关系比较健康，能自在地赚钱和花钱。你不回避谈钱，也不被钱绑架。你相信丰盛是可以持续的，也愿意为自己投资。",
    },
  };
  const data = texts[id];
  if (!data) return "";
  if (index >= 70) return data.high;
  if (index >= 40) return data.mid;
  return data.low;
}

function getOverallInfo(score: number): { label: string; seedling: string; description: string } {
  if (score >= 145) {
    return {
      label: "深度隐形内耗",
      seedling: "🌑 还在土里",
      description: "你现在的状态可能是——活得很累，但不知道为什么；想要改变，但不知道怎么改；甚至怀疑「是不是我这个人本来就不行」。我想告诉你：你不是不行，是旧程序太重了。你从小到大被安装了太多「规矩」和「应该」，你的系统已经超负荷运转了很久。你的累不是你的错，你的卡也不是你的错。你只是需要有人帮你找到那个「开关」，把这些旧程序一个一个关掉。",
    };
  }
  if (score >= 109) {
    return {
      label: "重度隐形内耗",
      seedling: "🌰 刚刚破土",
      description: "你的内在正在经历一个重要的转变——你开始意识到「我不能再这样了」。你的旧程序运行了很多年，你可能之前一直不知道自己在内耗，觉得「大家不都这样吗」。但现在你感受到了——累、卡、不自由。这种感觉虽然不舒服，但它是改变的起点。看见，就是改变的开始。你已经迈出了第一步。",
    };
  }
  if (score >= 73) {
    return {
      label: "中度隐形内耗",
      seedling: "🌱 正在扎根",
      description: "你已经开始觉醒了——你知道问题在哪里，也开始尝试改变。但你正处在一个「知道但做不到」的阶段。你的头脑已经升级了，但身体和潜意识还在跑旧程序。这不是你不够努力，是改变本来就需要过程。你的系统里有2-3个核心旧程序还在运行，它们在你压力大、被触发的时候会自动接管。你需要被帮助「看见」它们具体长什么样。",
    };
  }
  return {
    label: "轻度隐形内耗",
    seedling: "🌿 正在抽枝",
    description: "恭喜你，你的内在系统运行得相当健康。你已经度过了人格成长中最艰难的阶段，正在走向自由创造的状态。你对自己有清晰的认知，在关系中能保持边界，决策时能信任自己，情绪不容易被别人带走，行动力也比较稳定。大部分旧程序已经被你看见并清理了，剩下的是一些在特定压力场景下才会被触发的小程序。",
  };
}
