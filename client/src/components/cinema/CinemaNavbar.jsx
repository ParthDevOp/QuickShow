import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { useAppContext } from '../../context/AppContext';
import { MapPin, ShieldCheck } from 'lucide-react';

const CinemaNavbar = () => {
    const { user, dbUser } = useAppContext();

    // Dynamically pull the cinema name (adjust 'theaterName' or 'name' based on your DB schema)
    const cinemaName = dbUser?.theaterName || dbUser?.name || 'Cinema Dashboard';
    const userRole = dbUser?.role === 'admin' ? 'System Administrator' : 'Box Office Manager';

    return (
        <div className="h-20 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center border border-gray-700 shadow-inner">
                    <MapPin size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-base font-bold text-white tracking-wide">{cinemaName}</h1>
                    <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium mt-0.5">
                        {user?.fullName || 'Staff Member'} • <span className="text-primary">{userRole}</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#121212] border border-gray-800 rounded-full shadow-inner">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">System Secure</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1"></div>
                </div>
                
                <div className="w-px h-8 bg-gray-800 hidden md:block"></div>
                
                <UserButton 
                    appearance={{ 
                        elements: { 
                            avatarBox: "w-10 h-10 border border-gray-700 shadow-lg hover:border-gray-500 transition-all" 
                        } 
                    }} 
                />
            </div>
        </div>
    );
};

export default CinemaNavbar;