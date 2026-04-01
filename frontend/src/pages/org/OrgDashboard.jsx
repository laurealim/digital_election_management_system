import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getOrgAdminDashboard } from '@/api/dashboard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import { Vote, Users, CheckCircle2, BarChart2, Loader2 } from 'lucide-react'

const STATUS_COLORS = {
  draft:     '#94a3b8',
  scheduled: '#f59e0b',
  active:    '#22c55e',
  completed: '#6366f1',
  cancelled: '#ef4444',
}

export default function OrgDashboard() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['org-dashboard'],
    queryFn:  () => getOrgAdminDashboard().then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> {t('common.loading')}
      </div>
    )
  }

  if (!data) return null

  const { totals, participation, status_counts } = data

  const pieData = Object.entries(status_counts ?? {}).map(([status, count]) => ({
    name:  t(`election.${status}`, { defaultValue: status }),
    value: Number(count),
    color: STATUS_COLORS[status] ?? '#94a3b8',
  }))

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Vote size={20} />}         label={t('dashboard.total_elections')}  value={totals.elections} />
        <StatCard icon={<CheckCircle2 size={20} />} label={t('dashboard.active_elections')} value={totals.active_elections} highlight />
        <StatCard icon={<Users size={20} />}        label={t('dashboard.total_voters')}     value={totals.voters} />
        <StatCard icon={<BarChart2 size={20} />}    label={t('dashboard.votes_cast')}       value={totals.votes_cast} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participation bar chart */}
        <div className="border rounded-xl p-5 bg-card space-y-3">
          <h2 className="font-semibold text-sm">{t('dashboard.participation')}</h2>
          {participation?.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.no_data')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={participation} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis unit="%" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="turnout_pct" name={t('dashboard.turnout')} radius={[4, 4, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie chart */}
        <div className="border rounded-xl p-5 bg-card space-y-3">
          <h2 className="font-semibold text-sm">{t('dashboard.election_status')}</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.no_data')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, highlight }) {
  return (
    <div className="border rounded-xl p-4 bg-card flex items-center gap-3">
      <div className={`p-2 rounded-lg ${highlight ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value ?? 0}</p>
      </div>
    </div>
  )
}
