import { useState, useEffect, useCallback } from 'react' // Added useCallback
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { fetchWorkspaces } from '../features/workspaceSlice'
import {
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Users,
  Shield,
  Workflow,
  Star,
  Globe,
  Lock,
  Zap,
  BarChart3,
  Layers,
} from 'lucide-react'
import { useUser, SignIn, useAuth } from '@clerk/clerk-react'

const Layout = () => {
  const [showSignIn, setShowSignIn] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const dispatch = useDispatch()
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    dispatch(loadTheme())
  }, [dispatch])

  // ✅ FIX: Memoize getToken wrapper to prevent infinite loop
  const stableGetToken = useCallback(() => {
    return getToken
  }, [getToken])

  useEffect(() => {
    if (isLoaded && user) {
      dispatch(fetchWorkspaces({ getToken: stableGetToken() }))
    }
  }, [isLoaded, user, dispatch, stableGetToken])

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Loader2 className="size-10 animate-spin text-white" />
      </div>
    )
  }

  /* ================= LANDING ================= */
  if (!user) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">

        {/* LIVE BACKGROUND */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#7c3aed33,transparent_40%),radial-gradient(circle_at_80%_30%,#2563eb33,transparent_40%),radial-gradient(circle_at_50%_80%,#db277733,transparent_40%)] animate-gradient" />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/30 blur-[120px] rounded-full animate-float" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-600/30 blur-[120px] rounded-full animate-float delay-2000" />
        <div className="absolute -bottom-40 left-1/2 w-[500px] h-[500px] bg-pink-600/30 blur-[120px] rounded-full animate-float delay-4000" />

        {/* NAV */}
        <nav className="relative z-10 flex justify-between items-center px-8 h-16 backdrop-blur-xl bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles />
            </div>
            <span className="font-bold text-xl">WorkSpaceDev</span>
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            className="px-6 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20"
          >
            Sign In
          </button>
        </nav>

        {/* HERO */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 pt-32 text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold">
            One Workspace.
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
              Infinite Focus.
            </span>
          </h1>

          <p className="mt-8 text-xl text-white/70 max-w-3xl mx-auto">
            Plan, track, collaborate, and ship — without switching tools,
            breaking flow, or losing context.
          </p>

          <div className="mt-12 flex justify-center">
            <button
              onClick={() => setShowSignIn(true)}
              className="px-10 py-5 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 font-semibold text-lg shadow-[0_0_40px_#7c3aed66]"
            >
              Start Building Free <ArrowRight className="inline ml-2" />
            </button>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="relative z-10 max-w-6xl mx-auto mt-48 px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Why Most Teams Lose Momentum
          </h2>
          <p className="text-white/70 max-w-3xl mx-auto">
            Too many tools. Too many meetings. Too much context switching.
            Productivity dies when focus is fragmented.
          </p>
        </section>

        {/* SOLUTION */}
        <section className="relative z-10 max-w-6xl mx-auto mt-24 px-6 grid md:grid-cols-3 gap-8">
          {[
            ['Clarity', 'Everything lives in one structured workspace'],
            ['Speed', 'No friction between planning and execution'],
            ['Ownership', 'Clear roles, responsibilities, and progress'],
          ].map(([title, desc], i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl">
              <h3 className="text-2xl font-bold mb-3">{title}</h3>
              <p className="text-white/70">{desc}</p>
            </div>
          ))}
        </section>

        {/* USE CASES */}
        <section className="relative z-10 max-w-7xl mx-auto mt-48 px-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            Built for Every Kind of Team
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              ['Developers', 'Plan sprints, track bugs, ship faster'],
              ['Startups', 'Move fast without breaking alignment'],
              ['Freelancers', 'Manage clients and deadlines cleanly'],
              ['Enterprises', 'Scale securely across departments'],
            ].map(([title, desc], i) => (
              <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h3 className="font-bold text-xl mb-2">{title}</h3>
                <p className="text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECURITY */}
        <section className="relative z-10 max-w-6xl mx-auto mt-48 px-6 text-center">
          <Lock className="mx-auto mb-6 text-purple-400" size={40} />
          <h2 className="text-4xl font-bold mb-6">Security First. Always.</h2>
          <p className="text-white/70 max-w-3xl mx-auto">
            Authentication, authorization, and data isolation are built-in —
            not bolted on later.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              'Clerk-powered authentication',
              'Role-based access control',
              'Workspace-level isolation',
            ].map((t, i) => (
              <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <CheckCircle2 className="text-green-400 mb-3" />
                <p>{t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STATS */}
        <section className="relative z-10 max-w-6xl mx-auto mt-48 px-6 grid md:grid-cols-4 gap-8 text-center">
          {[
            ['10K+', 'Teams'],
            ['500K+', 'Projects'],
            ['1M+', 'Tasks'],
            ['99.9%', 'Uptime'],
          ].map(([n, t], i) => (
            <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <div className="text-4xl font-bold text-purple-400">{n}</div>
              <div className="text-white/70 mt-2">{t}</div>
            </div>
          ))}
        </section>

        {/* FINAL CTA */}
        <section className="relative z-10 max-w-5xl mx-auto mt-48 px-6 text-center pb-40">
          <h2 className="text-5xl font-extrabold mb-6">
            Focus is a Superpower.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            Create your workspace and experience deep work again.
          </p>
          <button
            onClick={() => setShowSignIn(true)}
            className="px-12 py-6 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 font-bold text-xl shadow-[0_0_60px_#7c3aed88]"
          >
            Create Your Workspace
          </button>
        </section>

        {/* SIGN IN MODAL */}
        {showSignIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
            <div className="relative bg-black/80 border border-white/10 rounded-3xl p-8">
              <button
                onClick={() => setShowSignIn(false)}
                className="absolute top-3 right-4 text-white/70"
              >
                ✕
              </button>
              <SignIn />
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes float {
            0%,100% { transform: translateY(0) }
            50% { transform: translateY(-40px) }
          }
          .animate-float {
            animation: float 12s ease-in-out infinite;
          }
          .delay-2000 { animation-delay: 2s }
          .delay-4000 { animation-delay: 4s }
          @keyframes gradient {
            0% { filter: hue-rotate(0deg) }
            100% { filter: hue-rotate(360deg) }
          }
          .animate-gradient {
            animation: gradient 40s linear infinite;
          }
        `}</style>
      </div>
    )
  }

  /* ================= APP ================= */
  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout