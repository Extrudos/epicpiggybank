import { createServiceRoleClient } from "./supabase";

const XP_PER_LEVEL = 100;

const XP_REWARDS: Record<string, number> = {
  allowance: 5,
  gift: 5,
  chore: 15,
  good_grades: 20,
  spending: 3,
  withdrawal: 3,
  investment: 25,
  parent_deposit: 5,
  parent_withdrawal: 3,
};

export async function awardXP(kidId: string, transactionType: string): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const supabase = createServiceRoleClient();
  const xpGain = XP_REWARDS[transactionType] || 5;

  const { data: kid } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", kidId)
    .single();

  if (!kid) return { newXP: 0, newLevel: 1, leveledUp: false };

  const newXP = kid.xp + xpGain;
  const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
  const leveledUp = newLevel > kid.level;

  await supabase
    .from("profiles")
    .update({ xp: newXP, level: newLevel })
    .eq("id", kidId);

  return { newXP, newLevel, leveledUp };
}

export async function checkAndAwardBadges(kidId: string, tenantId: string): Promise<string[]> {
  const supabase = createServiceRoleClient();

  // Get kid's current stats
  const { data: kid } = await supabase
    .from("profiles")
    .select("level, xp, streak_days")
    .eq("id", kidId)
    .single();

  if (!kid) return [];

  // Get transaction count
  const { count: txnCount } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .eq("kid_id", kidId)
    .eq("status", "approved");

  // Get completed goals count
  const { count: goalCount } = await supabase
    .from("savings_goals")
    .select("*", { count: "exact", head: true })
    .eq("kid_id", kidId)
    .eq("is_completed", true);

  // Get all badges not yet earned
  const { data: earnedBadges } = await supabase
    .from("kid_badges")
    .select("badge_id")
    .eq("kid_id", kidId);

  const earnedIds = new Set((earnedBadges || []).map((b) => b.badge_id));

  const { data: allBadges } = await supabase
    .from("badges")
    .select("*");

  const newlyEarned: string[] = [];

  for (const badge of allBadges || []) {
    if (earnedIds.has(badge.id)) continue;

    let earned = false;
    switch (badge.criteria_type) {
      case "level":
        earned = kid.level >= badge.criteria_value;
        break;
      case "streak":
        earned = kid.streak_days >= badge.criteria_value;
        break;
      case "transaction_count":
        earned = (txnCount || 0) >= badge.criteria_value;
        break;
      case "savings_goal":
        earned = (goalCount || 0) >= badge.criteria_value;
        break;
    }

    if (earned) {
      await supabase.from("kid_badges").insert({
        tenant_id: tenantId,
        kid_id: kidId,
        badge_id: badge.id,
      });
      newlyEarned.push(badge.name);
    }
  }

  return newlyEarned;
}
