import { COMMENT_POINT, LIKE_POINT, POINTS_LAUNCHED_AT } from "@/lib/points";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAnyClient = { from: (...args: any[]) => any };

export async function getEngagementPointsByUser(
  admin: SupabaseAnyClient,
  userIds: string[],
  periodStartDate: string,
): Promise<Map<string, number>> {
  const uniqueUserIds = [...new Set(userIds)];
  const pointsByUser = new Map(uniqueUserIds.map((userId) => [userId, 0]));
  if (uniqueUserIds.length === 0) return pointsByUser;

  const periodStartedAt = new Date(
    `${periodStartDate}T00:00:00+09:00`,
  ).toISOString();
  const pointsStartedAt =
    Date.parse(periodStartedAt) > Date.parse(POINTS_LAUNCHED_AT)
      ? periodStartedAt
      : POINTS_LAUNCHED_AT;

  const [reactionsRes, commentsRes] = await Promise.all([
    admin
      .from("feed_reactions")
      .select("user_id, feed_id")
      .in("user_id", uniqueUserIds)
      .gte("created_at", pointsStartedAt),
    admin
      .from("feed_comments")
      .select("user_id, feed_id")
      .in("user_id", uniqueUserIds)
      .gte("created_at", pointsStartedAt),
  ]);

  if (reactionsRes.error || commentsRes.error) return pointsByUser;

  const reactions = reactionsRes.data ?? [];
  const comments = commentsRes.data ?? [];
  const feedIds = [
    ...new Set([
      ...reactions.map((row: { feed_id: string }) => row.feed_id),
      ...comments.map((row: { feed_id: string }) => row.feed_id),
    ]),
  ];
  if (feedIds.length === 0) return pointsByUser;

  const { data: feeds, error: feedsError } = await admin
    .from("feeds")
    .select("id, user_id")
    .in("id", feedIds);
  if (feedsError) return pointsByUser;

  const feedOwnerById = new Map(
    (feeds ?? []).map((feed: { id: string; user_id: string }) => [
      feed.id,
      feed.user_id,
    ]),
  );

  for (const reaction of reactions as { user_id: string; feed_id: string }[]) {
    if (feedOwnerById.get(reaction.feed_id) === reaction.user_id) continue;
    pointsByUser.set(
      reaction.user_id,
      (pointsByUser.get(reaction.user_id) ?? 0) + LIKE_POINT,
    );
  }
  for (const comment of comments as { user_id: string; feed_id: string }[]) {
    if (feedOwnerById.get(comment.feed_id) === comment.user_id) continue;
    pointsByUser.set(
      comment.user_id,
      (pointsByUser.get(comment.user_id) ?? 0) + COMMENT_POINT,
    );
  }

  return pointsByUser;
}

export async function getEngagementPoints(
  admin: SupabaseAnyClient,
  userId: string,
  periodStartDate: string,
): Promise<number> {
  const pointsByUser = await getEngagementPointsByUser(
    admin,
    [userId],
    periodStartDate,
  );
  return pointsByUser.get(userId) ?? 0;
}
