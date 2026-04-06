import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import { 
    Ticket, Users, Banknote, MonitorPlay, Calendar, Clock, MapPin, 
    QrCode, Activity, ArrowRight, TrendingUp, CreditCard, Globe, Film, X, User, RefreshCw 
} from 'lucide-react';
import Loading from '../../components/Loading';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CinemaDashboard = () => {
    const { axios, getToken } = useAppContext();
    const navigate = useNavigate();
    
    // State
    const [stats, setStats] = useState(null);
    const [theaterName, setTheaterName] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); // <-- Added for refresh button
    
    const [selectedShow, setSelectedShow] = useState(null);
    const [showBookings, setShowBookings] = useState([]);
    const [isMapLoading, setIsMapLoading] = useState(false);

    // Fetch Stats Data
    const fetchTheaterStats = useCallback(async (isSilent = false) => {
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/box-office/dashboard-stats", {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (data.success) {
                setStats(data.stats);
                setTheaterName(data.theaterName);
            }
        } catch (error) {
            console.error("Failed to load theater stats:", error);
            if (!isSilent) toast.error("Failed to load dashboard data.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [axios, getToken]);

    // Initial load and polling
    useEffect(() => {
        fetchTheaterStats(false);
        // CHANGED: Poll every 10 seconds instead of 60 seconds so it feels "Live"
        const interval = setInterval(() => fetchTheaterStats(true), 10000); 
        return () => clearInterval(interval);
    }, [fetchTheaterStats]);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        fetchTheaterStats(true); // Silent true so it doesn't spam toasts on success
    };

    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setSelectedShow(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    // Fetch Manifest for Seat Map
    const openSeatMap = async (show) => {
        setSelectedShow(show);
        setIsMapLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get("/api/box-office/manifest", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                const specificBookings = data.bookings.filter(b => b.show?._id === show.id);
                setShowBookings(specificBookings);
            } else {
                toast.error("Failed to load seat data.");
            }
        } catch (error) {
            toast.error("Network error while loading seat map.");
        } finally {
            setIsMapLoading(false);
        }
    };

    const seatMapDict = useMemo(() => {
        const dict = {};
        showBookings.forEach(booking => {
            const guest = booking.guestName || booking.user?.name || "Walk-in Guest";
            booking.bookedSeats?.forEach(seat => {
                dict[seat] = {
                    guest,
                    method: booking.paymentMethod,
                    id: booking._id,
                    time: booking.createdAt
                };
            });
        });
        return dict;
    }, [showBookings]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading) return <Loading />;

    return (
        <div className="pb-20 font-outfit text-white animate-fadeIn relative">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[300px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-[20%] right-[-5%] w-[30%] h-[400px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>

            <div className="relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 bg-[#0a0a0a]/50 p-6 rounded-2xl border border-white/5 backdrop-blur-xl shadow-xl">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-[0.2em]">System Online</p>
                            
                            {/* ADDED: Manual Refresh Button */}
                            <button 
                                onClick={handleManualRefresh} 
                                className="ml-2 p-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 transition-colors group"
                                title="Force Refresh Data"
                            >
                                <RefreshCw size={12} className={`text-gray-400 group-hover:text-white ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
                            </button>
                        </div>
                        <Title text1="Facility" text2="Overview" />
                        <p className="text-gray-400 text-sm mt-2 flex items-center gap-2 font-medium bg-white/5 inline-flex px-3 py-1.5 rounded-md border border-white/5">
                            <MapPin size={14} className="text-orange-500" /> {theaterName || 'Local Dashboard View'}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <button onClick={() => navigate('/cinema/scan')} className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm border border-white/10 hover:border-white/20 shadow-lg">
                            <QrCode size={16} className="text-blue-400"/> Access Gate
                        </button>
                        <button onClick={() => navigate('/cinema/pos')} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)] border border-orange-400/50">
                            <Ticket size={16}/> POS Terminal
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <StatCard icon={<Users size={22}/>} label="Total Seats Sold" value={stats?.totalGuests || 0} colorTheme="blue" />
                    <StatCard icon={<Ticket size={22}/>} label="Bookings Today" value={stats?.todayTickets || 0} colorTheme="purple" />
                    <StatCard icon={<Banknote size={22}/>} label="POS Cash Collected" value={formatCurrency(stats?.posCashRevenue)} colorTheme="emerald" />
                    <StatCard icon={<MonitorPlay size={22}/>} label="Gross Revenue" value={formatCurrency(stats?.totalRevenue)} colorTheme="orange" trend="+ Live"/>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Today's Screenings */}
                    <div className="lg:col-span-8 bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-widest">
                                <Calendar size={16} className="text-orange-500" /> Today's Screenings
                            </h3>
                            <span className="text-xs font-medium text-gray-500 bg-black px-2 py-1 rounded-md border border-gray-800">{stats?.upcomingShows?.length || 0} Shows</span>
                        </div>
                        
                        {stats?.upcomingShows?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-gray-800 rounded-xl bg-black/50">
                                <Film size={40} className="text-gray-700 mb-3" />
                                <p className="text-gray-500 text-sm font-medium">No shows scheduled for today.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {stats?.upcomingShows?.map((show, i) => {
                                    // Parse capacity and bookings aggressively to prevent NaN bugs
                                    const capacity = parseInt(show.capacity || show.totalSeats) || 100; 
                                    let bookedCount = parseInt(show.bookedSeatsCount, 10);
                                    if (isNaN(bookedCount)) bookedCount = 0;

                                    const occupancyPercentage = Math.min(100, Math.round((bookedCount / capacity) * 100));
                                    
                                    let progressColor = "from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
                                    if (occupancyPercentage > 50) progressColor = "from-orange-500 to-amber-400 shadow-[0_0_10px_rgba(249,115,22,0.5)]";
                                    if (occupancyPercentage > 85) progressColor = "from-red-500 to-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";

                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => openSeatMap(show)}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#121212] rounded-xl border border-white/5 hover:border-orange-500/50 hover:bg-white/[0.04] transition-all gap-4 group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-16 rounded-md overflow-hidden shrink-0 bg-black border border-gray-800 shadow-md group-hover:shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-all relative">
                                                    <img src={show.poster} className="w-full h-full object-cover" alt={`${show.movieTitle} poster`} loading="lazy" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-100 text-base mb-1 group-hover:text-orange-400 transition-colors">{show.movieTitle}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                                        <span className="flex items-center gap-1 bg-black px-2 py-1 rounded-md border border-gray-800">
                                                            <Clock size={12} className="text-orange-500"/> 
                                                            {new Date(show.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                        <span className="border border-gray-700 px-2 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold bg-black">
                                                            {show.format}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="w-full sm:w-56 flex flex-col gap-2 bg-black/40 p-3 rounded-lg border border-white/5">
                                                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    <span>Occupancy</span>
                                                    <span className="text-white">{bookedCount} / {capacity} <span className="text-gray-500 font-normal">({occupancyPercentage}%)</span></span>
                                                </div>
                                                <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-black inset-shadow">
                                                    <div className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-1000 ease-out`} style={{ width: `${occupancyPercentage}%` }}></div>
                                                </div>
                                                <div className="text-[10px] text-center text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Click to view live seat map
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Live Activity Feed */}
                    <div className="lg:col-span-4 bg-[#0a0a0a]/80 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <h3 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-widest">
                                <Activity size={16} className="text-blue-500" /> Live Feed
                            </h3>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        {stats?.recentSales?.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-50">
                                <Activity size={32} className="mb-3 text-gray-600"/>
                                <p className="text-gray-500 text-sm font-medium">Awaiting live transactions...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1">
                                {stats?.recentSales?.map((sale, i) => {
                                    let MethodIcon = Banknote;
                                    let methodColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
                                    let methodLabel = "CASH";

                                    if (sale.method === 'CARD_TERMINAL') {
                                        MethodIcon = CreditCard;
                                        methodColor = "text-purple-400 bg-purple-400/10 border-purple-400/20";
                                        methodLabel = "CARD";
                                    } else if (sale.method === 'ONLINE') {
                                        MethodIcon = Globe;
                                        methodColor = "text-blue-400 bg-blue-400/10 border-blue-400/20";
                                        methodLabel = "ONLINE";
                                    }

                                    return (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#121212] border border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${methodColor}`}>
                                                    <MethodIcon size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-200 truncate max-w-[120px]" title={sale.customer}>{sale.customer}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] text-gray-500 font-medium">
                                                            {new Date(sale.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                        <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {sale.seats.split(',').length} Tix
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono text-sm font-bold text-emerald-400">+{formatCurrency(sale.amount)}</p>
                                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block ${methodColor}`}>
                                                    {methodLabel}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        
                        <button onClick={() => navigate('/cinema/manifest')} className="w-full mt-6 py-3 bg-black border border-white/10 hover:border-white/20 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all flex justify-center items-center gap-2 shadow-lg">
                            View Full Manifest <ArrowRight size={14}/>
                        </button>
                    </div>
                </div>
            </div>

            {selectedShow && (
                <SeatMapModal 
                    show={selectedShow} 
                    onClose={() => setSelectedShow(null)} 
                    isLoading={isMapLoading} 
                    seatMapDict={seatMapDict} 
                />
            )}
            
        </div>
    );
};

const StatCard = ({ icon, label, value, colorTheme, trend }) => {
    const themes = {
        blue: { bg: 'from-blue-500/10 to-transparent', border: 'border-blue-500/20', iconColor: 'text-blue-500', glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]' },
        purple: { bg: 'from-purple-500/10 to-transparent', border: 'border-purple-500/20', iconColor: 'text-purple-500', glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]' },
        emerald: { bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/20', iconColor: 'text-emerald-500', glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]' },
        orange: { bg: 'from-orange-500/10 to-transparent', border: 'border-orange-500/20', iconColor: 'text-orange-500', glow: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]' },
    };

    const theme = themes[colorTheme] || themes.blue;

    return (
        <div className={`relative overflow-hidden bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 flex flex-col justify-between group transition-all duration-300 hover:-translate-y-1 ${theme.glow}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${theme.bg} rounded-full blur-2xl pointer-events-none transform translate-x-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl border bg-[#121212] ${theme.border} ${theme.iconColor}`}>{icon}</div>
                {trend && (
                    <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                        <TrendingUp size={12}/> {trend}
                    </div>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-3xl font-bold text-white tracking-tight mb-1 font-mono drop-shadow-md">{value}</p>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.15em]">{label}</p>
            </div>
        </div>
    );
};

const SeatMapModal = ({ show, onClose, isLoading, seatMapDict }) => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    return createPortal(
        <div 
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-800 bg-[#121212] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <MonitorPlay className="text-orange-500" /> {show.movieTitle}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1 font-mono">{new Date(show.time).toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#050505] custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-gray-700 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest">Loading Live Map...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex flex-wrap gap-4 mb-10 bg-[#121212] px-6 py-3 rounded-full border border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1a1a1a] border border-gray-700 rounded-sm"></div> Available</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500 rounded-sm"></div> Box Office (Cash)</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500/20 border border-purple-500 rounded-sm"></div> Card Terminal</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded-sm"></div> Online App</div>
                            </div>

                            <div className="w-full max-w-2xl mb-16 relative">
                                <div className="h-1.5 bg-gradient-to-r from-gray-800 via-gray-500 to-gray-800 w-full rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.1)]"></div>
                                <p className="text-center text-[10px] text-gray-500 uppercase tracking-[15px] mt-4 font-bold">Screen</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                {rows.map(row => (
                                    <div key={row} className="flex justify-center items-center gap-2 sm:gap-3">
                                        <span className="w-6 text-center text-xs font-bold text-gray-600 font-mono">{row}</span>
                                        {cols.map(col => {
                                            const seatId = `${row}${col}`;
                                            const booking = seatMapDict[seatId];
                                            
                                            let seatStyle = 'bg-[#1a1a1a] border-gray-700 text-gray-500'; 
                                            if (booking) {
                                                if (booking.method === 'VENUE') seatStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
                                                else if (booking.method === 'CARD_TERMINAL') seatStyle = 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
                                                else seatStyle = 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
                                            }

                                            return (
                                                <div key={seatId} className="relative group cursor-crosshair">
                                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm border text-xs font-bold flex items-center justify-center transition-all duration-300 ${seatStyle} ${booking ? 'group-hover:scale-110 group-hover:brightness-150 z-10' : ''}`}>
                                                        {col}
                                                    </div>
                                                    
                                                    {booking && (
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max bg-[#121212] border border-gray-700 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl z-50 transform group-hover:-translate-y-1">
                                                            <p className="font-bold flex items-center gap-1.5 mb-1 text-sm"><User size={14} className="text-gray-400"/> {booking.guest}</p>
                                                            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest border-t border-gray-800 pt-1 mt-1">ID: TXN-{booking.id.slice(-6)}</p>
                                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#121212] border-b border-r border-gray-700 rotate-45"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <span className="w-6 text-center text-xs font-bold text-gray-600 font-mono">{row}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CinemaDashboard;