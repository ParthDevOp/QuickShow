import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
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
        <div className="pb-20 font-outfit text-white animate-fadeIn">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <Title text1="Daily" text2="Manifest" />
                    <p className="text-gray-500 text-sm mt-1 font-medium">Live guest list and real-time check-in status for today's shows.</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-500" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search by name or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0c0c0c] border border-white/10 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-gray-500 text-sm transition-colors shadow-lg"
                        />
                    </div>
                    
                    <button 
                        onClick={() => fetchManifest(true)} 
                        disabled={isRefreshing}
                        className="bg-[#121212] border border-white/5 hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg"
                    >
                        <RefreshCcw size={14} className={isRefreshing ? "animate-spin text-orange-500" : ""} /> 
                        <span className="hidden sm:inline">Sync</span>
                    </button>

                    <button onClick={() => window.print()} className="bg-[#121212] border border-white/5 hover:bg-white/5 text-gray-300 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-widest shadow-lg">
                        <Download size={14}/> Export
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid (Upgraded to 4 columns) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Expected</p>
                        <p className="text-2xl font-black text-white">{totalExpected}</p>
                    </div>
                    <Users size={28} className="text-gray-700" />
                </div>
                <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between border-b-2 border-b-emerald-500/50 shadow-xl">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Checked In</p>
                        <p className="text-2xl font-black text-emerald-400">{checkedInCount}</p>
                    </div>
                    <CheckCircle2 size={28} className="text-emerald-500/20" />
                </div>
                <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between border-b-2 border-b-orange-500/50 shadow-xl">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Awaiting Arrival</p>
                        <p className="text-2xl font-black text-orange-400">{pendingCount}</p>
                    </div>
                    <CircleDashed size={28} className="text-orange-500/20" />
                </div>
                <div className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex items-center justify-between border-b-2 border-b-red-500/50 shadow-xl">
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Expired / Missed</p>
                        <p className="text-2xl font-black text-red-400">{expiredCount}</p>
                    </div>
                    <XCircle size={28} className="text-red-500/20" />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] border-b border-white/5">
                            <tr>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Guest Info</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Booking ID</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Feature & Time</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned Seats</th>
                                <th className="py-5 px-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Live Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredManifest.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-16 text-center text-gray-500">
                                        <Film size={32} className="mx-auto text-gray-700 mb-3" />
                                        <p className="text-sm font-medium">No guests found matching your criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredManifest.map((booking) => {
                                    const StatusInfo = getBookingStatus(booking);
                                    const Icon = StatusInfo.icon;
                                    const isExpiredRow = StatusInfo.label.includes("Expired");

                                    return (
                                        <tr key={booking._id} className={`hover:bg-white/[0.02] transition-colors ${isExpiredRow ? 'opacity-60 grayscale-[50%]' : ''}`}>
                                            
                                            {/* Guest Info */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                        <User size={16} className="text-gray-500"/>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-200 tracking-tight">
                                                            {booking.guestName || booking.user?.name || "Walk-in Guest"}
                                                        </p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">
                                                            {booking.user?.email || "Box Office Sale"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Booking ID */}
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs font-bold text-gray-400 bg-[#121212] border border-white/5 px-2.5 py-1 rounded-md">
                                                    #{booking._id.slice(-8).toUpperCase()}
                                                </span>
                                            </td>

                                            {/* Feature & Time */}
                                            <td className="py-4 px-6">
                                                <p className="text-sm font-bold text-orange-400/90">{booking.show?.movie?.title || "N/A"}</p>
                                                <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5 mt-1">
                                                    <Clock size={12}/> {booking.show?.showDateTime ? new Date(booking.show.showDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                                                </p>
                                            </td>

                                            {/* Seats */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <TicketIcon size={14} className="text-gray-600"/>
                                                    <span className="text-sm font-mono font-bold text-gray-300">
                                                        {(booking.bookedSeats || booking.selectedSeats)?.join(', ') || "N/A"}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="inline-flex flex-col items-end">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${StatusInfo.color}`}>
                                                        <Icon size={14} strokeWidth={2.5}/> {StatusInfo.label}
                                                    </span>
                                                    {booking.checkInTime && booking.isCheckedIn && (
                                                        <span className="text-[9px] text-gray-500 mt-1.5 font-mono">
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
                    .bg-[#0c0c0c], .bg-[#121212], .bg-white\/\\[0\\.02\\] { background: white !important; border-color: #ddd !important; box-shadow: none !important; }
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