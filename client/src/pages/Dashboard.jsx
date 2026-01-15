import { Plus } from 'lucide-react'
import { useState, useEffect } from 'react' // ← ADD useEffect
import StatsGrid from '../components/StatsGrid'
import ProjectOverview from '../components/ProjectOverview'
import RecentActivity from '../components/RecentActivity'
import TasksSummary from '../components/TasksSummary'
import CreateProjectDialog from '../components/CreateProjectDialog'
import { useUser, useAuth } from '@clerk/clerk-react' // ← ADD useAuth
import api from '../configs/api' // ← ADD this import

const Dashboard = () => {
    const { user } = useUser()
    const { getToken } = useAuth() // ← ADD this
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    
    // ========================================
    // 🔥 USER SYNC LOGIC (ADD THIS BLOCK)
    // ========================================
    useEffect(() => {
        const syncUserToDB = async () => {
            if (!user) return;

            try {
                await api.post(
                    "/api/auth/sync",
                    {
                        email: user.emailAddresses[0].emailAddress,
                        name: user.fullName || "",
                        image: user.imageUrl || "",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${await getToken()}`,
                        },
                    }
                );
                console.log("✅ User synced to database");
            } catch (error) {
                console.error("❌ User sync failed:", error);
            }
        };

        syncUserToDB();
    }, [user, getToken]); // ← Runs once when user loads
    // ========================================
    
    return (
        <div className='max-w-6xl mx-auto'>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        Welcome back, {user?.fullName || 'User'}
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                        Here's what's happening with your projects today
                    </p>
                </div>
                <button 
                    onClick={() => setIsDialogOpen(true)} 
                    className="flex items-center gap-2 px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white space-x-2 hover:opacity-90 transition"
                >
                    <Plus size={16} /> New Project
                </button>
            </div>
            
            <CreateProjectDialog 
                isDialogOpen={isDialogOpen} 
                setIsDialogOpen={setIsDialogOpen} 
            />
            
            <StatsGrid />
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <ProjectOverview />
                    <RecentActivity />
                </div>
                <div>
                    <TasksSummary />
                </div>
            </div>
        </div>
    )
}

export default Dashboard