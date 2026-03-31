import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getSuperAdminDashboard } from '@/api/dashboard'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Building2, Vote, Users, CheckCircle2, Loader2, Activity } from 'lucide-react'

const TYPE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

export default function AdminDashboard() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => getSuperAdminDashboard().then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> {t('common.loading')}
      </div>
    )
  }

  if (!data) return null

  const { totals, elections_per_month, orgs_by_type, recent_audit } = data

  const monthlyData = Object.entries(elections_per_month ?? {}).map(([month, count]) => ({
    month,
    count: Number(count),
  }))

  const typeData = Object.entries(orgs_by_type ?? {}).map(([type, count]) => ({
    name:  type,
    value: Number(count),
  }))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Building2 size={20} />}    label={t('dashboard.total_organizations')}  value={totals.organizations} />
        <StatCard icon={<Building2 size={20} />}    label={t('dashboard.active_organizations')} value={totals.active_orgs} highlight />
        <StatCard icon={<Vote size={20} />}         label={t('dashboard.total_elections')}      value={totals.total_elections} />
        <StatCard icon={<Activity size={20} />}     label={t('dashboard.active_elections')}     value={totals.active_elections} highlight />
        <StatCard icon={<Users size={20} />}        label={t('dashboard.total_voters')}         value={totals.total_voters} />
        <StatCard icon={<CheckCircle2 size={20} />} label={t('dashboard.votes_cast')}           value={totals.votes_cast} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-xl p-5 bg-card space-y-3">
          <h2 className="font-semibold text-sm">{t('dashboard.elections_per_month')}</h2>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.no_data')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name={t('election.elections')} fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="border rounded-xl p-5 bg-card space-y-3">
          <h2 className="font-semibold text-sm">{t('dashboard.orgs_by_type')}</h2>
          {typeData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('dashboard.no_data')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  dataKey="value"
                  label={({ value }) => `${value}`}
                  labelLine={false}
                >
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden bg-card">
        <div className="px-5 py-3 bg-muted/40 border-b">
          <h2 className="font-semibold text-sm">{t('dashboard.recent_audit')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2 font-medium">{t('dashboard.event')}</th>
                <th className="text-left px-4 py-2 font-medium">{t('dashboard.organization')}</th>
                <th className="text-left px-4 py-2 font-medium">{t('dashboard.ip')}</th>
                <th className="text-left px-4 py-2 font-medium">{t('dashboard.time')}</th>
              </tr>
            </thead>
            <tbody>
              {(recent_audit ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    {t('dashboard.no_data')}
                  </td>
                </tr>
              ) : (
                (recent_audit ?? []).map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{log.event}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {log.organization?.name ?? `Org #${log.organization_id}`}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground text-xs font-mono">{log.ip_address}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">
                      {new Date(log.created_at).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
