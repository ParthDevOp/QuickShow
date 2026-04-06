import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Ticket, QrCode, ClipboardList, LogOut, Search, Popcorn, CalendarClock } from 'lucide-react'; 
import { useClerk } from '@clerk/clerk-react';

const cinemaLinks = [
    { name: 'Facility Overview', path: '/cinema', icon: LayoutDashboard },
    { name: 'POS Terminal', path: '/cinema/pos', icon: Ticket },
    { name: 'Access Gate', path: '/cinema/scan', icon: QrCode },
    { name: 'Daily Manifest', path: '/cinema/manifest', icon: ClipboardList },
    { name: 'All Bookings', path: '/cinema/bookings', icon: Search }, 
    { name: 'Concessions Menu', path: '/cinema/snacks', icon: Popcorn },
    { name: 'Schedule Requests', path: '/cinema/requests', icon: CalendarClock }, 
];

const CinemaSidebar = () => {
    const { signOut } = useClerk();

    return (
        <aside className="fixed top-0 left-0 h-screen w-20 md:w-64 bg-[#0a0a0a] border-r border-white/5 z-40 flex flex-col font-outfit transition-all duration-300">
            
            {/* Desktop Logo Area */}
            <div className="p-6 hidden md:flex items-center border-b border-white/5">
                <Link to="/cinema" className="flex items-center gap-3 outline-none group">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300">
                        <Ticket size={20} className="text-black" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black leading-none text-white tracking-tight">QuickShow</span>
                        <span className="text-[9px] text-gray-500 font-bold tracking-widest uppercase mt-1">
                            Partner Portal
                        </span>
                    </div>
                </Link>
            </div>

            {/* Mobile Logo (Icon Only) */}
            <div className="p-5 flex md:hidden justify-center border-b border-white/5">
                <Link to="/cinema" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <Ticket size={20} className="text-black" />
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 md:px-4 mt-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest ml-3 mb-4 hidden md:block">Menu</p>
                
                {cinemaLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <NavLink 
                            key={link.name} 
                            to={link.path} 
                            end 
                            className={({ isActive }) => `
                                flex items-center justify-center md:justify-start gap-3 px-3 py-3 md:py-3 rounded-xl transition-all duration-200 group
                                ${isActive 
                                    ? 'bg-white/10 text-white font-bold shadow-sm' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 font-medium'}
                            `}
                            title={link.name} 
                        >
                            <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 ${/* isActive styling handled by parent */ ''}`} />
                            <span className="hidden md:block text-sm tracking-wide">{link.name}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom Logout */}
            <div className="p-4 mb-2 border-t border-white/5 mt-auto">
                <button 
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center md:justify-start gap-3 text-gray-500 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 px-3 py-3 rounded-xl transition-all duration-200 border border-transparent group"
                    title="End Shift"
                >
                    <LogOut size={18} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden md:block font-bold text-sm">Secure Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default CinemaSidebar;