import { createBrowserRouter } from 'react-router-dom'

// Layouts
import OrgAdminLayout    from '@/layouts/OrgAdminLayout'
import SuperAdminLayout  from '@/layouts/SuperAdminLayout'
import VoterLayout       from '@/layouts/VoterLayout'

// Guards
import AuthGuard from '@/components/guards/AuthGuard'
import RoleGuard from '@/components/guards/RoleGuard'

// Auth pages
import Login           from '@/pages/auth/Login'
import ForgotPassword  from '@/pages/auth/ForgotPassword'
import ResetPassword   from '@/pages/auth/ResetPassword'
import SetupPassword   from '@/pages/auth/SetupPassword'

// Public pages
import LandingPage              from '@/pages/public/LandingPage'
import RegisterOrganization     from '@/pages/public/RegisterOrganization'
import PublicResultsListPage    from '@/pages/public/PublicResultsListPage'
import PublicElectionResultPage from '@/pages/public/PublicElectionResultPage'

// Super admin pages
import AdminOrganizations from '@/pages/admin/Organizations'
import AdminDashboard     from '@/pages/admin/AdminDashboard'
import RolesPage          from '@/pages/admin/RolesPage'
import UsersPage          from '@/pages/admin/UsersPage'

// Org / management pages
import OrgDashboard   from '@/pages/org/OrgDashboard'
import ElectionList   from '@/pages/elections/ElectionList'
import ElectionDetail from '@/pages/elections/ElectionDetail'
import ElectionForm   from '@/pages/elections/ElectionForm'

// Voter / candidate pages
import VoterDashboard      from '@/pages/voter/Dashboard'
import VotingPage          from '@/pages/voter/VotingPage'
import ResultsPage         from '@/pages/results/ResultsPage'
import CandidateResultsPage from '@/pages/voter/CandidateResultsPage'

// All management roles that share the org admin layout
const MANAGEMENT_ROLES = ['org_admin', 'org_user', 'election_admin', 'election_user']

const router = createBrowserRouter([
  // ─── Public ────────────────────────────────────────────────────────────────
  { path: '/',                 element: <LandingPage /> },
  { path: '/results',          element: <PublicResultsListPage /> },
  { path: '/results/:id',      element: <PublicElectionResultPage /> },
  { path: '/login',            element: <Login /> },
  { path: '/forgot-password',  element: <ForgotPassword /> },
  { path: '/reset-password',   element: <ResetPassword /> },
  { path: '/setup-password',   element: <SetupPassword /> },
  { path: '/register',         element: <RegisterOrganization /> },

  // ─── Super Admin ────────────────────────────────────────────────────────────
  {
    element: (
      <AuthGuard>
        <RoleGuard allow={['super_admin']}>
          <SuperAdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      { path: '/admin/dashboard',               element: <AdminDashboard /> },
      { path: '/admin/organizations',           element: <AdminOrganizations /> },
      { path: '/admin/roles',                   element: <RolesPage /> },
      { path: '/admin/users',                   element: <UsersPage /> },
      { path: '/admin/elections',               element: <ElectionList /> },
      { path: '/admin/elections/new',           element: <ElectionForm /> },
      { path: '/admin/elections/:id/edit',      element: <ElectionForm /> },
      { path: '/admin/elections/:id',           element: <ElectionDetail /> },
      { path: '/admin/elections/:id/results',   element: <ResultsPage /> },
    ],
  },

  // ─── Org Management Roles (org_admin, org_user, election_admin, election_user)
  {
    element: (
      <AuthGuard>
        <RoleGuard allow={MANAGEMENT_ROLES}>
          <OrgAdminLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      { path: '/dashboard',              element: <OrgDashboard /> },
      { path: '/elections',              element: <ElectionList /> },
      { path: '/elections/new',          element: <ElectionForm /> },
      { path: '/elections/:id/edit',     element: <ElectionForm /> },
      { path: '/elections/:id',          element: <ElectionDetail /> },
      { path: '/elections/:id/results',  element: <ResultsPage /> },
    ],
  },

  // ─── Voter & Candidate ──────────────────────────────────────────────────────
  {
    element: (
      <AuthGuard>
        <RoleGuard allow={['voter', 'candidate']}>
          <VoterLayout />
        </RoleGuard>
      </AuthGuard>
    ),
    children: [
      { path: '/voter/dashboard',                       element: <VoterDashboard /> },
      { path: '/voter/elections/:id/vote',              element: <VotingPage /> },
      { path: '/voter/elections/:id/results',           element: <ResultsPage /> },
      { path: '/voter/elections/:id/my-results',        element: <CandidateResultsPage /> },
    ],
  },
])

export default router
