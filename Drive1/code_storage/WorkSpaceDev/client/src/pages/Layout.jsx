import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const { loading } = useSelector((state) => state.workspace)
    const dispatch = useDispatch()
    const { user, isLoaded } = useUser()

    // Initial load of theme
    useEffect(() => {
        dispatch(loadTheme())
    }, [dispatch])

    // Show loader while Clerk is loading
    if (!isLoaded) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
            </div>
        )
    }

    // Show sign-in UI when user is not authenticated
    if (!user) {
        return (
            <div className='flex flex-col justify-center items-center gap-4 h-screen bg-white dark:bg-zinc-950'>
                <h1 className='text-2xl font-semibold text-gray-900 dark:text-slate-100'>
                    Welcome to WorkSpaceDev!  Please sign in to continue
                </h1>
                <SignInButton mode="modal">
                    <button className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition'>
                        Sign In
                    </button>
                </SignInButton>
            </div>
        )
    }

    // Show workspace loader
    if (loading) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
            </div>
        )
    }

    // Main layout for authenticated users
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