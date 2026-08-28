import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sileo'
import 'sileo/styles.css'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { TournamentToasts } from './components/TournamentToasts'
import { PublicLayout } from './layouts/PublicLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { HomePage } from './pages/HomePage'
import { TeamsPage } from './pages/TeamsPage'
import { TeamDetailPage } from './pages/TeamDetailPage'
import { FixturesPage } from './pages/FixturesPage'
import { StandingsPage } from './pages/StandingsPage'
import { ChampionPage } from './pages/ChampionPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage'
import { AdminPlayersPage } from './pages/admin/AdminPlayersPage'
import { AdminMatchesPage } from './pages/admin/AdminMatchesPage'
import { AdminMatchControlPage } from './pages/admin/AdminMatchControlPage'
import { AdminRoulettePage } from './pages/admin/AdminRoulettePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Toaster theme="light" position="top-center" />
      <TournamentToasts />
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="teams/:id" element={<TeamDetailPage />} />
            <Route path="fixtures" element={<FixturesPage />} />
            <Route path="standings" element={<StandingsPage />} />
            <Route path="champion" element={<ChampionPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="teams" element={<AdminTeamsPage />} />
            <Route path="players" element={<AdminPlayersPage />} />
            <Route path="matches" element={<AdminMatchesPage />} />
            <Route path="matches/:id" element={<AdminMatchControlPage />} />
            <Route path="roulette" element={<AdminRoulettePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
