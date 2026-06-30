export type MilestoneContent = {
  collectedItems: Array<{
    icon: string;
    label: string;
  }>;
  completedRange: string;
  day: number;
  eyebrow: string;
  stats: Array<{
    icon: string;
    label: string;
    value: number;
  }>;
  summary: string;
  title: string;
  weekNumber: number;
};

export const LOCAL_MILESTONE_VIEWED_KEY = "chengta.milestonesViewed";
