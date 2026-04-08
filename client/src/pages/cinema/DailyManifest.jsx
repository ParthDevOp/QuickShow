import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Loading from '../../components/Loading';
import { 
    Search, User, Clock, Film, Ticket as TicketIcon, 
    CheckCircle2, CircleDashed, Users, Download, RefreshCcw, XCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

const DailyManifest = () => {
    const { axios, getToken } = useAppContext();
    const [manifest, setManifest] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchManifest = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/box-office/manifest", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setManifest(data.bookings);
            }
        } catch (error) {
            console.error("Manifest Error:", error);
            toast.error("Failed to load daily manifest.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [axios, getToken]);

    useEffect(() => {
        fetchManifest();
        // Auto-refresh every 2 minutes to keep times and statuses highly accurate
        const interval = setInterval(() => fetchManifest(false), 120000);
        return () => clearInterval(interval);
    }, [fetchManifest]);

    // --- TIME VERIFICATION & STATS CALCULATION ---
    const now = new Date();
    let totalExpected = manifest.length;
    let checkedInCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;

    manifest.forEach(b => {
        if (b.isCheckedIn) {
            checkedInCount++;
        } else {
            // Assume 3 hours after showtime = Show Ended / Ticket Expired
            const showTime = new Date(b.show?.showDateTime);
            const showEndTime = new Date(showTime.getTime() + (3 * 60 * 60 * 1000));
            
            if (now > showEndTime) {
                expiredCount++;
            } else {
                pendingCount++;
            }
        }
    });

    // Helper to generate dynamic badges based on time logic
    const getBookingStatus = (booking) => {
        if (booking.isCheckedIn) {
            return {
                label: "Checked In",
                color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
                icon: CheckCircle2
            };
        }

        const showTime = new Date(booking.show?.showDateTime);
        const showEndTime = new Date(showTime.getTime() + (3 * 60 * 60 * 1000));

        if (now > showEndTime) {
            return {
                label: "Expired (No Show)",
                color: "text-red-400 bg-red-400/10 border-red-400/20",
                icon: XCircle
            };
        }

        return {
            label: "Expected",
            color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
            icon: CircleDashed
        };
    };

    // Filter logic
    const filteredManifest = manifest.filter(booking => {
        const guestName = booking.guestName?.toLowerCase() || booking.user?.name?.toLowerCase() || 'walk-in guest';
        const movieId = booking._id.toLowerCase();
        const search = searchTerm.toLowerCase();
        return guestName.includes(search) || movieId.includes(search);
    });

    if (loading) return <Loading />;

    return (
        <div className="pb-20 font-outfit text-white animate-fadeIn relative max-w-[1600px] mx-auto">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-1/4 w-[50%] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-0 right-0 w-[40%] h-[400px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
            
            <div className="relative z-10 w-full">
                {/* Header Sub-Nav Style */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 bg-[#060606]/80 p-8 rounded-3xl border border-white/[0.04] backdrop-blur-2xl shadow-2xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Users fill="currentColor" size={12} className="text-blue-500" />
                            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.25em]">Guest Operations</p>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Daily Manifest</h2>
                        <p className="text-gray-400 text-sm flex items-center gap-2 font-medium bg-white/[0.03] inline-flex px-3.5 py-1.5 rounded-lg border border-white/[0.05] shadow-inner">
                            Live guest list and real-time check-in status
                        </p>
                    </div>
                
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={16} className="text-gray-500" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Search Name or ID..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#121212] border border-white/10 text-white pl-11 pr-4 py-3.5 rounded-xl outline-none focus:border-blue-500/50 text-sm transition-all shadow-inner placeholder:text-gray-600"
                            />
                        </div>
                        
                        <button 
                            onClick={() => fetchManifest(true)} 
                            disabled={isRefreshing}
                            className="bg-[#121212] border border-white/5 hover:border-white/10 hover:bg-white/5 text-gray-300 px-5 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all text-xs uppercase tracking-[0.15em] disabled:opacity-50 shadow-lg"
                        >
                            <RefreshCcw size={16} className={isRefreshing ? "animate-spin text-blue-500" : ""} /> 
                            <span className="hidden sm:inline">Sync</span>
                        </button>

                        <button onClick={() => window.print()} className="bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/30">
                            <Download size={16}/> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid (Upgraded to 4 columns) */}
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                    <div className="bg-[#060606]/80 backdrop-blur-xl border border-white/[0.04] p-6 lg:p-8 rounded-3xl flex items-center justify-between shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="relative z-10">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Expected</p>
                            <p className="text-3xl lg:text-4xl font-mono font-black text-white drop-shadow-md">{totalExpected}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 relative z-10">
                            <Users size={24} className="text-blue-500" />
                        </div>
                    </div>
                    
                    <div className="bg-[#060606]/80 backdrop-blur-xl border border-white/[0.04] p-6 lg:p-8 rounded-3xl flex items-center justify-between shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0"></div>
                        <div className="relative z-10">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Checked In</p>
                            <p className="text-3xl lg:text-4xl font-mono font-black text-emerald-400 drop-shadow-md">{checkedInCount}</p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 relative z-10">
                            <CheckCircle2 size={24} className="text-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-[#060606]/80 backdrop-blur-xl border border-white/[0.04] p-6 lg:p-8 rounded-3xl flex items-center justify-between shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500/0 via-orange-500/50 to-orange-500/0"></div>
                        <div className="relative z-10">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Awaiting Arrival</p>
                            <p className="text-3xl lg:text-4xl font-mono font-black text-orange-400 drop-shadow-md">{pendingCount}</p>
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 relative z-10">
                            <CircleDashed size={24} className="text-orange-500 animate-[spin_4s_linear_infinite]" />
                        </div>
                    </div>

                    <div className="bg-[#060606]/80 backdrop-blur-xl border border-white/[0.04] p-6 lg:p-8 rounded-3xl flex items-center justify-between shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500/0 via-red-500/50 to-red-500/0"></div>
                        <div className="relative z-10">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Expired / Missed</p>
                            <p className="text-3xl lg:text-4xl font-mono font-black text-red-500 drop-shadow-md">{expiredCount}</p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 relative z-10">
                            <XCircle size={24} className="text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-[#060606]/80 backdrop-blur-2xl border border-white/[0.04] rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-blue-500/30 to-transparent"></div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#030303]/50 border-b border-white/[0.05]">
                                <tr>
                                    <th className="py-6 px-8 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Guest Profile</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Transaction ID</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Screening Details</th>
                                    <th className="py-6 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Allocation</th>
                                    <th className="py-6 px-8 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Live Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredManifest.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-24 text-center text-gray-500 bg-black/20">
                                            <Film size={48} className="mx-auto text-gray-800 mb-4" />
                                            <p className="text-sm font-medium tracking-wide">No guests matching your criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredManifest.map((booking) => {
                                        const StatusInfo = getBookingStatus(booking);
                                        const Icon = StatusInfo.icon;
                                        const isExpiredRow = StatusInfo.label.includes("Expired");
                                        const isCheckedIn = StatusInfo.label.includes("Checked");

                                        return (
                                            <tr key={booking._id} className={`hover:bg-white/[0.02] transition-colors ${isExpiredRow ? 'opacity-40 grayscale-[80%]' : ''} ${isCheckedIn ? 'bg-emerald-500/[0.02]' : ''}`}>
                                                
                                                {/* Guest Info */}
                                                <td className="py-5 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                                                            <User size={18} className="text-gray-400"/>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-200 tracking-tight">
                                                                {booking.guestName || booking.user?.name || "Walk-in Guest"}
                                                            </p>
                                                            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">
                                                                {booking.user?.email || "Box Office Sale"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Booking ID */}
                                                <td className="py-5 px-6">
                                                    <span className="font-mono text-[11px] font-bold text-gray-400 bg-black border border-white/5 px-2.5 py-1.5 rounded-lg shadow-inner">
                                                        #{booking._id.slice(-8).toUpperCase()}
                                                    </span>
                                                </td>

                                                {/* Feature & Time */}
                                                <td className="py-5 px-6">
                                                    <p className="text-[13px] font-bold text-gray-200">{booking.show?.movie?.title || "N/A"}</p>
                                                    <p className="text-[11px] font-bold text-orange-400 mt-1.5 flex items-center gap-1.5 bg-orange-500/10 inline-flex px-2 py-0.5 rounded border border-orange-500/20">
                                                        <Clock size={10}/> {booking.show?.showDateTime ? new Date(booking.show.showDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                                                    </p>
                                                </td>

                                                {/* Seats */}
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-2.5 bg-[#111] border border-white/5 inline-flex px-3 py-1.5 rounded-lg shadow-inner">
                                                        <TicketIcon size={14} className="text-gray-500"/>
                                                        <span className="text-xs font-mono font-bold text-gray-300">
                                                            {(booking.bookedSeats || booking.selectedSeats)?.join(', ') || "N/A"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="py-5 px-8 text-right">
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border ${StatusInfo.color}`}>
                                                            <Icon size={14} strokeWidth={2.5} className={!isExpiredRow && !isCheckedIn ? 'animate-[spin_4s_linear_infinite]' : ''}/> {StatusInfo.label}
                                                        </span>
                                                        {booking.checkInTime && booking.isCheckedIn && (
                                                            <span className="text-[9px] text-gray-500 mt-2 font-mono bg-[#0a0a0a] border border-white/5 px-2 py-0.5 rounded">
                                                                Time: {new Date(booking.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .animate-fadeIn, .animate-fadeIn * { visibility: visible; }
                    .animate-fadeIn { position: absolute; left: 0; top: 0; width: 100%; }
                    button, input { display: none !important; }
                    .bg-[#060606]\\/80, .bg-[#0c0c0c], .bg-[#121212], .bg-[white\\\\/0\\.02] { background: white !important; border-color: #ddd !important; box-shadow: none !important; }
                    * { color: black !important; }
                    /* Force colored badges to print correctly if the browser supports it */
                    .text-emerald-400 { color: #10b981 !important; }
                    .text-orange-400 { color: #f97316 !important; }
                    .text-red-400 { color: #ef4444 !important; }
                }
            `}</style>
        </div>
    );
};

export default DailyManifest;