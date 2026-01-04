import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { fetchWorkspaces } from '../features/workspaceSlice' // ADD THIS
import { Loader2 } from 'lucide-react' // Fixed: Loader2Icon -> Loader2
import { useUser, SignIn, useAuth, CreateOrganization  } from '@clerk/clerk-react'
  // ADD THIS (or wherever your component is)

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { loading, workspaces } = useSelector((state) => state.workspace)
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
    dispatch(fetchWorkspaces({ getToken }));
  }
}, [isLoaded, user]);


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

  // Loading workspaces
  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
        <Loader2 className="size-7 text-blue-500 animate-spin" />
      </div>
    )
  }

  // Create organization if no workspaces
  if (user && workspaces.length === 0) {
    return (
      <div className='min-h-screen flex justify-center items-center bg-white dark:bg-zinc-950'>
        <CreateOrganization/>
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