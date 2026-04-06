import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { useAppContext } from '../../context/AppContext';
import CinemaSidebar from '../../components/cinema/CinemaSidebar';
import CinemaNavbar from '../../components/cinema/CinemaNavbar';
import { Loader2 } from 'lucide-react';

const CinemaLayout = () => {
    const { user, dbUser } = useAppContext();

    if (!user) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-[#050505]">
                <SignIn routing="hash" fallbackRedirectUrl={'/cinema'} 
                    appearance={{ 
                        elements: { 
                            formButtonPrimary: 'bg-white hover:bg-gray-200 text-black font-bold', 
                            card: 'bg-[#0a0a0a] border border-gray-800 text-white shadow-2xl' 
                        } 
                    }}
                />
            </div>
        );
    }

    if (user && !dbUser) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            </div>
        );
    }

    if (dbUser.role !== 'cinema' && dbUser.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen bg-[#000000] font-outfit text-gray-200 selection:bg-white/20">
            <CinemaSidebar />
            
            {/* Fixed the left margin to match the w-64 sidebar exactly */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
                <CinemaNavbar />
                
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CinemaLayout;