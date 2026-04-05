import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getResults,
  exportResultsPdf,
  exportResultsExcel,
} from "@/api/results";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Trophy,
  ChevronLeft,
  Loader2,
  FileText,
  FileSpreadsheet,
  Users,
  BarChart3,
  Award,
} from "lucide-react";
import useAuthStore, { isSuperAdmin, hasPermission } from "@/store/authStore";

const BAR_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
];

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const superAdmin = useAuthStore(isSuperAdmin);
  const canExport = useAuthStore(hasPermission("export-results"));
  const isAdmin = superAdmin || canExport;

  const { data, isLoading, error } = useQuery({
    queryKey: ["results", id],
    queryFn: () => getResults(id).then((r) => r.data.data),
    retry: false,
  });

  async function handleExport(type) {
    try {
      const res =
        type === "pdf"
          ? await exportResultsPdf(id)
          : await exportResultsExcel(id);
      const ext = type === "pdf" ? "pdf" : "xlsx";
      const mime =
        type === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `election-results-${id}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {
      alert(t("results.export_failed"));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" />{" "}
        {t("common.loading")}
      </div>
    );
  }

  if (error) {
    const status = error.response?.status;
    if (status === 403) {
      return (
        <div className="w-full max-w-lg mx-auto py-12 text-center space-y-3 px-4 sm:px-0">
          <p className="text-sm text-muted-foreground">
            {t("results.not_published")}
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft size={14} className="mr-1" /> {t("common.back")}
          </Button>
        </div>
      );
    }
    return (
      <p className="text-sm text-destructive py-4">{t("results.failed")}</p>
    );
  }

  if (!data) return null;

  const { election, turnout, posts } = data;

  if (!election.is_result_published && !isAdmin) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 text-center space-y-3 px-4 sm:px-0">
        <p className="text-sm text-muted-foreground">
          {t("results.not_published")}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft size={14} className="mr-1" /> {t("common.back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border rounded-xl bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
            >
              <ChevronLeft size={14} /> {t("common.back")}
            </button>
            <h1 className="text-2xl font-bold">{election.name}</h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {election.organization} ·{" "}
              {new Date(election.election_date).toLocaleDateString("bn-BD", {
                dateStyle: "long",
              })}
              {election.completed_at && (
                <>
                  {" "}
                  · {t("results.completed_on")}{" "}
                  {new Date(election.completed_at).toLocaleDateString("bn-BD", {
                    dateStyle: "medium",
                  })}
                </>
              )}
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("pdf")}
              >
                <FileText size={14} className="mr-1.5" />{" "}
                {t("results.export_pdf")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("excel")}
              >
                <FileSpreadsheet size={14} className="mr-1.5" />{" "}
                {t("results.export_excel")}
              </Button>
            </div>
          )}

          {!isAdmin && election.is_result_published && (
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("excel")}
              >
                <FileSpreadsheet size={14} className="mr-1.5" />{" "}
                {t("results.export_excel")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Turnout summary */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent border-b px-5 py-3 flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/50">
            <Users size={14} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="font-semibold text-sm">{t("results.turnout")}</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label={t("results.total_voters")}
              value={turnout.total_voters}
              color="blue"
            />
            <StatCard
              label={t("results.votes_cast")}
              value={turnout.voted_count}
              color="indigo"
            />
            <StatCard
              label={t("results.turnout")}
              value={`${turnout.turnout_pct}%`}
              highlight={turnout.turnout_pct >= 50}
              color="green"
            />
          </div>
        </div>
      </div>

      {/* All winners summary */}
      {/* <WinnersSummary posts={posts} t={t} /> */}

      {/* Per-post results */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
            <BarChart3
              size={14}
              className="text-indigo-600 dark:text-indigo-400"
            />
          </div>
          <h2 className="font-semibold">{t("results.detailed_results")}</h2>
        </div>
        {posts.map((post) => (
          <PostResultCard key={post.id} post={post} t={t} />
        ))}
      </div>
    </div>
  );
}

// ─── Winners summary table ────────────────────────────────────────────────────
function WinnersSummary({ posts, t }) {
  const allWinners = posts.flatMap((post) =>
    post.winners.map((w) => ({
      postTitle: post.title,
      name: w.user.name,
      designation: w.user.designation,
      votes: w.vote_count,
      totalVotes: post.total_votes,
      pctValue:
        post.total_votes > 0
          ? ((w.vote_count / post.total_votes) * 100).toFixed(1)
          : "0.0",
    })),
  );

  if (allWinners.length === 0) return null;

  return (
    <div className="border-2 border-amber-200 dark:border-amber-800/60 rounded-xl overflow-hidden bg-card shadow-sm">
      <div className="bg-gradient-to-r from-amber-50 via-amber-50/60 to-transparent dark:from-amber-950/40 dark:via-amber-950/20 dark:to-transparent border-b border-amber-200/60 dark:border-amber-800/30 px-5 py-3.5 flex items-center gap-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 shadow-sm">
          <Award size={16} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="font-bold text-sm">{t("results.all_winners")}</h2>
          <p className="text-xs text-muted-foreground">
            {allWinners.length} {allWinners.length === 1 ? "winner" : "winners"}{" "}
            across {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">
                {t("results.post")}
              </th>
              <th className="text-left px-4 py-2.5 font-medium">
                {t("results.winner")}
              </th>
              <th className="text-right px-4 py-2.5 font-medium">
                {t("results.votes")}
              </th>
              <th className="text-right px-4 py-2.5 font-medium">
                {t("results.share")}
              </th>
            </tr>
          </thead>
          <tbody>
            {allWinners.map((w, i) => (
              <tr
                key={i}
                className="border-t hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition-colors"
              >
                <td className="px-4 py-3 font-medium">{w.postTitle}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={13} className="text-amber-500 shrink-0" />
                    <div>
                      <p className="font-medium">{w.name}</p>
                      {w.designation && (
                        <p className="text-xs text-muted-foreground">
                          {w.designation}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {w.votes}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    {w.pctValue}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
const STAT_COLORS = {
  blue: "border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20",
  indigo: "border-l-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20",
  green: "border-l-green-400 bg-green-50/50 dark:bg-green-950/20",
};

function StatCard({ label, value, highlight, color = "blue" }) {
  return (
    <div
      className={`rounded-xl p-4 text-center border border-l-4 ${STAT_COLORS[color] ?? STAT_COLORS.blue}`}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p
        className={`text-2xl font-bold mt-1 ${highlight ? "text-green-600 dark:text-green-400" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Per-post result card ─────────────────────────────────────────────────────
function PostResultCard({ post, t }) {
  const { title, candidates, winners, total_votes } = post;

  const winnerIds = new Set(winners.map((w) => w.id));

  const barData = candidates
    .slice()
    .sort((a, b) => b.vote_count - a.vote_count)
    // .slice(0, 3)
    .map((c) => ({
      name: c.user.name,
      votes: c.vote_count,
      isWinner: winnerIds.has(c.id),
    }));

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Post header */}
      <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-transparent dark:from-slate-800/50 dark:via-slate-800/20 dark:to-transparent border-b px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-8 rounded-full bg-indigo-500" />
          <h2 className="font-bold text-base">{title}</h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          {t("results.votes_cast_n", { count: total_votes })}
        </Badge>
      </div>

      <div className="p-5 space-y-6">
        {/* Winner cards */}
        {/* {winners.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Trophy size={12} /> {t("results.winner")}
            </p>
            <div className="flex flex-wrap gap-3">
              {winners.map((w, i) => (
                <div
                  key={w.id}
                  className="flex items-center gap-3 border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-950/10 rounded-xl px-4 py-3 min-w-48 shadow-sm"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800/60">
                    <Trophy
                      size={14}
                      className="text-amber-700 dark:text-amber-300"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {w.user.name}
                    </p>
                    {w.user.designation && (
                      <p className="text-xs text-muted-foreground truncate">
                        {w.user.designation}
                      </p>
                    )}
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                      {w.vote_count} {t("results.votes")}
                      {total_votes > 0
                        ? ` · ${pct(w.vote_count, total_votes)}%`
                        : ""}
                    </p>
                  </div>
                  {post.max_votes > 1 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto shrink-0 text-xs"
                    >
                      #{i + 1}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Candidate table */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {t("results.candidate")} {t("results.details_label")}
          </p>
          <div className="border rounded-lg overflow-x-auto text-sm">
            <table className="w-full min-w-[500px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">
                    {t("results.candidate")}
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    {t("results.votes")}
                  </th>
                  <th className="text-right px-4 py-2.5 font-medium">
                    {t("results.share")}
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-t ${winnerIds.has(c.id) ? "bg-amber-50/60 dark:bg-amber-950/10" : "hover:bg-muted/30"} transition-colors`}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{c.user.name}</p>
                      {c.user.designation && (
                        <p className="text-xs text-muted-foreground">
                          {c.user.designation}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">
                      {c.vote_count}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {total_votes > 0
                        ? `${pct(c.vote_count, total_votes)}%`
                        : "—"}
                    </td>
                    {/* <td className="px-4 py-2.5 text-right">
                      {winnerIds.has(c.id) && (
                        <Badge variant="success" className="text-xs">
                          {t("results.winner")}
                        </Badge>
                      )}
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bar chart — top 10 candidates */}
        {barData.length > 0 && total_votes > 0 && (
          <div className="bg-muted/20 dark:bg-muted/10 rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              {t("results.votes_per_candidate")}
              {candidates.length > 10
                ? ` (${t("results.top_n", { count: 10 })})`
                : ""}
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={barData}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                barCategoryGap="10%"
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={100}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="votes" radius={[4, 4, 0, 0]} barSize="50%">
                  {barData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={BAR_COLORS[i % BAR_COLORS.length]}
                      opacity={entry.isWinner ? 1 : 0.65}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function pct(votes, total) {
  return total > 0 ? ((votes / total) * 100).toFixed(1) : "0.0";
}
