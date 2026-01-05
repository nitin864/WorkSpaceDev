import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { fetchWorkspaces } from '../features/workspaceSlice'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useUser, SignIn, useAuth, CreateOrganization } from '@clerk/clerk-react'

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCreatingOrg, setIsCreatingOrg] = useState(false)
  const { loading, workspaces, error } = useSelector((state) => state.workspace)
  const dispatch = useDispatch()
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()

  // Initial load of theme
  useEffect(() => {
    dispatch(loadTheme())
  }, [dispatch])

  // Initial load of workspaces
  useEffect(() => {
    if (isLoaded && user) {
      console.log('Fetching workspaces for user:', user.id)
      dispatch(fetchWorkspaces({ getToken }))
    }
  }, [isLoaded, user, dispatch, getToken])

  // Poll for workspaces after organization creation
  useEffect(() => {
    if (!isCreatingOrg) return

    console.log('Starting polling for new workspace...')
    const pollInterval = setInterval(() => {
      console.log('Polling workspaces...')
      dispatch(fetchWorkspaces({ getToken }))
    }, 3000) // Poll every 3 seconds

    // Stop polling after 30 seconds
    const timeout = setTimeout(() => {
      console.log('Polling timeout reached')
      clearInterval(pollInterval)
      setIsCreatingOrg(false)
    }, 30000)

    return () => {
      clearInterval(pollInterval)
      clearTimeout(timeout)
    }
  }, [isCreatingOrg, dispatch, getToken])

  // Stop polling once we have workspaces
  useEffect(() => {
    if (isCreatingOrg && workspaces.length > 0) {
      console.log('Workspace detected, stopping polling')
      setIsCreatingOrg(false)
    }
  }, [workspaces.length, isCreatingOrg])

  const handleRetry = () => {
    console.log('Retrying workspace fetch...')
    dispatch(fetchWorkspaces({ getToken }))
  }

  // Loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
        <Loader2 className="size-7 text-blue-500 animate-spin" />
      </div>
    )
  }

  // Show sign in if no user
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-zinc-950">
        <SignIn />
      </div>
    )
  }

  // Error state
  if (error && !loading) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-white dark:bg-zinc-950 gap-4 p-6'>
        <AlertCircle className="size-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load workspaces</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md text-center">
          {error || 'An unexpected error occurred'}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
        <div className="mt-4 p-4 bg-gray-100 dark:bg-zinc-900 rounded-lg max-w-2xl overflow-auto">
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
            Debug info: Check browser console and backend logs
          </p>
        </div>
      </div>
    )
  }

  // Loading workspaces
  if (loading && !isCreatingOrg && workspaces.length === 0) {
    return (
      <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
        <Loader2 className="size-7 text-blue-500 animate-spin" />
      </div>
    )
  }

  // Show loader while creating organization
  if (isCreatingOrg) {
    return (
      <div className='flex flex-col items-center justify-center h-screen bg-white dark:bg-zinc-950 gap-4'>
        <Loader2 className="size-7 text-blue-500 animate-spin" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Setting up your workspace...</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">This may take a few moments</p>
      </div>
    )
  }

  // Create organization if no workspaces
  if (user && workspaces.length === 0 && !loading) {
    return (
      <div className='min-h-screen flex justify-center items-center bg-white dark:bg-zinc-950'>
        <CreateOrganization
          afterCreateOrganizationUrl="/"
          skipInvitationScreen={true}
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg"
            }
          }}
        />
      </div>
    )
  }

  // Main layout
  return (
    <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen">
        <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default Layout