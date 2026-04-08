import React from 'react';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { useAppContext } from '../../context/AppContext';
import { MapPin, ShieldCheck, Film, Navigation, Ticket } from 'lucide-react';

const CinemaNavbar = () => {
    const { user, dbUser } = useAppContext();
    const { isLoaded } = useAuth();

    // Determine the theater name exactly how the backend defines or fallback to a standard name.
    const cinemaName = dbUser?.theaterName || dbUser?.theaterConfig?.name || dbUser?.name || 'Box Office Console';
    const userRole = dbUser?.role === 'admin' ? 'System Administrator' : 'Box Office Manager';

    return (
        <div className="h-20 bg-[#060606]/90 backdrop-blur-xl border-b border-white/[0.04] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-50">
            
            {/* Left side: Location & Branding details */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                    <MapPin size={22} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        {cinemaName}
                        {dbUser?.role === 'admin' && (
                            <span className="text-[9px] bg-red-500/20 text-red-500 border border-red-500/30 px-1.5 py-0.5 rounded font-black uppercase tracking-widest leading-none transform -translate-y-1">Admin Mode</span>
                        )}
                    </h1>
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-[0.15em] mt-0.5 flex items-center gap-1.5">
                        <Navigation size={10} className="text-gray-600"/> Local Facility Operations
                    </p>
                </div>
            </div>

            {/* Right side: Actions & Profile */}
            <div className="flex items-center gap-5 md:gap-8">
                
                {/* Security Badge */}
                <div className="hidden md:flex flex-col items-end">
                     <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Network Secure</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"></div>
                    </div>
                </div>
                
                <div className="w-px h-8 bg-white/[0.06] hidden md:block"></div>
                
                {/* User Profile */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col items-end mr-1">
                        <span className="text-sm font-bold text-gray-200">{user?.fullName || 'Staff Member'}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-orange-400">{userRole}</span>
                    </div>
                    {isLoaded ? (
                        <div className="rounded-xl overflow-hidden border-2 border-white/10 hover:border-orange-500/50 shadow-lg transition-all duration-300">
                             <UserButton 
                                appearance={{ 
                                    elements: { 
                                        avatarBox: "w-10 h-10 rounded-none",
                                        userButtonTrigger: "rounded-none focus:shadow-none"
                                    } 
                                }} 
                            />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-white/5 rounded-xl animate-pulse"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CinemaNavbar;