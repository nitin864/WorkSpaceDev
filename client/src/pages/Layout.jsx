import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { Loader2, Sparkles, Zap, Shield, Users, ArrowRight, CheckCircle2 } from 'lucide-react'
import { SignInButton, useUser } from '@clerk/clerk-react'

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { loading } = useSelector((state) => state.workspace)
  const { theme } = useSelector((state) => state.theme)
  const dispatch = useDispatch()
  const { user, isLoaded } = useUser()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    dispatch(loadTheme())
    
    // Scroll listener for parallax effects
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [dispatch])

  /* ---------- Global Styles (INLINE) ---------- */
  const GlobalStyles = () => (
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(5deg); }
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      @keyframes slide-up {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slide-in-left {
        from { opacity: 0; transform: translateX(-50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes slide-in-right {
        from { opacity: 0; transform: translateX(50px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animate-float { animation: float 6s ease-in-out infinite; }
      .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
      .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
      .animate-slide-in-left { animation: slide-in-left 0.8s ease-out forwards; }
      .animate-slide-in-right { animation: slide-in-right 0.8s ease-out forwards; }
      .gradient-animate {
        background-size: 200% 200%;
        animation: gradient-shift 8s ease infinite;
      }
      .delay-100 { animation-delay: 0.1s; }
      .delay-200 { animation-delay: 0.2s; }
      .delay-300 { animation-delay: 0.3s; }
      .delay-400 { animation-delay: 0.4s; }
      .delay-500 { animation-delay: 0.5s; }
      .glass-effect {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
    `}</style>
  )

  /* ---------- Clerk Loader ---------- */
  if (!isLoaded) {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
            <div className="text-white text-xl font-light">Loading WorkSpaceDev...</div>
          </div>
        </div>
      </>
    )
  }

  /* ---------- Sign In Screen ---------- */
  if (!user) {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
            <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
          </div>

          {/* Navigation */}
          <nav className="relative z-50 glass-effect">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center space-x-3 animate-slide-in-left">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center animate-pulse-glow">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-white">WorkSpaceDev</span>
                </div>
                <div className="hidden md:flex items-center space-x-8 animate-slide-in-right">
                  <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                  <a href="#benefits" className="text-gray-300 hover:text-white transition-colors">Benefits</a>
                  <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
                  <SignInButton mode="modal">
                    <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center">
              <div className="inline-block mb-6 animate-slide-up">
                <div className="glass-effect px-4 py-2 rounded-full text-purple-300 text-sm font-medium">
                  ✨ Next-generation workspace platform
                </div>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-slide-up delay-100">
                Welcome to
                <span className="block gradient-animate bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  WorkSpaceDev
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto animate-slide-up delay-200">
                Organize workspaces. Collaborate faster. Build smarter.
              </p>
              
              <p className="text-lg text-gray-400 mb-12 animate-slide-up delay-300">
                The ultimate platform for modern teams to create, collaborate, and conquer
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-400">
                <SignInButton mode="modal">
                  <button className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105 flex items-center space-x-2">
                    <span>Sign In to Continue</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
                <button className="px-8 py-4 glass-effect text-white rounded-full font-semibold text-lg hover:bg-white/20 transition-all">
                  Watch Demo
                </button>
              </div>
              
              <div className="mt-8 text-sm text-gray-400 animate-slide-up delay-500">
                <Shield className="w-4 h-4 inline mr-2" />
                Secure authentication powered by Clerk
              </div>
            </div>

            {/* Floating Cards */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-effect p-8 rounded-2xl hover:bg-white/20 transition-all transform hover:-translate-y-2 animate-slide-up delay-200">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-4 animate-pulse-glow">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
                <p className="text-gray-300">Experience blazing-fast performance with our optimized infrastructure</p>
              </div>
              
              <div className="glass-effect p-8 rounded-2xl hover:bg-white/20 transition-all transform hover:-translate-y-2 animate-slide-up delay-300">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-4 animate-pulse-glow">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Team Collaboration</h3>
                <p className="text-gray-300">Real-time collaboration tools that keep your team in sync</p>
              </div>
              
              <div className="glass-effect p-8 rounded-2xl hover:bg-white/20 transition-all transform hover:-translate-y-2 animate-slide-up delay-400">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-4 animate-pulse-glow">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Enterprise Security</h3>
                <p className="text-gray-300">Bank-level security with end-to-end encryption</p>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-xl text-gray-300">
                Powerful features designed for modern teams
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'Unlimited workspaces',
                'Real-time collaboration',
                'Advanced analytics',
                'Custom integrations',
                'Priority support',
                'Team management'
              ].map((feature, idx) => (
                <div 
                  key={idx}
                  className="glass-effect p-6 rounded-xl flex items-center space-x-4 hover:bg-white/20 transition-all transform hover:scale-105"
                  style={{animation: 'slide-up 0.8s ease-out forwards', animationDelay: `${idx * 0.1}s`}}
                >
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <span className="text-white text-lg">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="glass-effect p-12 md:p-16 rounded-3xl text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to transform your workflow?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of teams already using WorkSpaceDev to build amazing things
              </p>
              <SignInButton mode="modal">
                <button className="px-10 py-5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105">
                  Get Started Free
                </button>
              </SignInButton>
            </div>
          </div>

          {/* Footer */}
          <footer className="relative z-10 border-t border-white/10 mt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="text-center text-gray-400">
                <p>© 2026 WorkSpaceDev. Built with ❤️ for developers.</p>
              </div>
            </div>
          </footer>
        </div>
      </>
    )
  }

  /* ---------- Workspace Loader ---------- */
  if (loading) {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
            <div className="text-white text-xl font-light">Loading workspace...</div>
          </div>
        </div>
      </>
    )
  }

  /* ---------- Main Layout ---------- */
  return (
    <>
      <GlobalStyles />
      <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'} ${isSidebarOpen ? 'overflow-hidden' : ''}`}>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
          <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className={`flex-1 overflow-auto ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}

export default Layout