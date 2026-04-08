import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import { 
    CalendarClock, Send, Clock, Film, MessageSquare, 
    CheckCircle2, XCircle, Clock3, CalendarRange, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const ScheduleRequests = () => {
    const { axios, getToken } = useAppContext();
    const [requests, setRequests] = useState([]);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        movieId: '',
        customMovieTitle: '',
        startDate: '',
        endDate: '',
        preferredTimes: '', 
        message: ''
    });

    const fetchInitialData = useCallback(async () => {
        try {
            const token = await getToken();
            const [reqRes, movieRes] = await Promise.all([
                axios.get("/api/schedule-requests/my-theater", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/movie/latest") 
            ]);

            if (reqRes.data.success) setRequests(reqRes.data.requests);
            if (movieRes.data.success) setMovies(movieRes.data.movies);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    }, [axios, getToken]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Strict Validation
        if (!formData.movieId) {
            return toast.error("Please select a movie or choose 'Request an unlisted movie'.");
        }

        if (formData.movieId === 'CUSTOM' && !formData.customMovieTitle.trim()) {
            return toast.error("Please enter the custom movie title.");
        }

        if (!formData.startDate || !formData.endDate) {
            return toast.error("Start and End dates are required.");
        }

        setIsSubmitting(true);
        try {
            const token = await getToken();
            const timesArray = formData.preferredTimes ? formData.preferredTimes.split(',').map(t => t.trim()) : [];
            
            // 2. PAYLOAD CLEANUP (Fixes the Mongoose CastError)
            const payload = { 
                // If it's custom, send null so Mongoose doesn't try to cast "CUSTOM" to an ObjectId
                movieId: formData.movieId === 'CUSTOM' ? null : formData.movieId, 
                customMovieTitle: formData.movieId === 'CUSTOM' ? formData.customMovieTitle : '',
                startDate: formData.startDate,
                endDate: formData.endDate,
                preferredTimes: timesArray,
                message: formData.message
            };

            const { data } = await axios.post("/api/schedule-requests/create", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success(data.message);
                setFormData({ movieId: '', customMovieTitle: '', startDate: '', endDate: '', preferredTimes: '', message: '' });
                fetchInitialData(); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Network error.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case 'APPROVED': return { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 };
            case 'REJECTED': return { color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: XCircle };
            default: return { color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: Clock3 };
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="pb-20 font-outfit text-white animate-fadeIn relative max-w-[1600px] mx-auto">
            
            {/* Ambient Background Glows */}
            <div className="fixed top-20 right-1/4 w-[40%] h-[500px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-[40%] h-[400px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

            {/* Header Sub-Nav Style */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 bg-[#060606]/80 p-8 rounded-3xl border border-white/[0.04] backdrop-blur-2xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <CalendarClock fill="currentColor" size={12} className="text-orange-500" />
                        <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.25em]">Allocation Management</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Schedule Requests</h2>
                    <p className="text-gray-400 text-sm flex items-center gap-2 font-medium bg-white/[0.03] inline-flex px-3.5 py-1.5 rounded-lg border border-white/[0.05] shadow-inner max-w-2xl">
                        Submit proposals for new movie runs, special screenings, or extensions to Central Admin
                    </p>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- LEFT: REQUEST FORM --- */}
                <div className="lg:col-span-4 xl:col-span-5 relative">
                    <div className="bg-[#060606]/80 backdrop-blur-xl border border-white/[0.04] rounded-3xl p-8 shadow-2xl sticky top-6 overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-orange-500/50 to-transparent"></div>
                        
                        <div className="flex items-center gap-4 mb-8 border-b border-white/[0.05] pb-5">
                            <div className="p-4 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
                                <CalendarClock size={24} className="text-orange-500"/>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">New Proposal</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mt-1">Draft Schedule Plan</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Movie Selection */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block ml-1">Assigned Feature</label>
                                <select 
                                    name="movieId" 
                                    value={formData.movieId} 
                                    onChange={handleInputChange} 
                                    className="w-full bg-[#121212] border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm appearance-none cursor-pointer shadow-inner font-bold"
                                >
                                    <option value="" className="text-gray-500">-- Browse Active Distribution Catalog --</option>
                                    <option value="CUSTOM" className="text-orange-400 font-semibold">✨ Request an unlisted or legacy feature...</option>
                                    {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                                </select>
                                
                                {formData.movieId === 'CUSTOM' && (
                                    <div className="mt-4 animate-fadeIn">
                                        <input 
                                            type="text" 
                                            name="customMovieTitle" 
                                            value={formData.customMovieTitle} 
                                            onChange={handleInputChange} 
                                            placeholder="Enter the exact exact nomenclature..." 
                                            className="w-full bg-[#121212] border border-orange-500/50 text-white px-5 py-4 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm shadow-[inset_0_0_15px_rgba(249,115,22,0.1)] font-bold placeholder:text-gray-600 placeholder:font-sans" 
                                        />
                                        <p className="text-[10px] font-black text-gray-500 flex items-center gap-1.5 mt-2 ml-1 uppercase tracking-wider">
                                            <Info size={10} className="text-orange-500"/> Central Admin will verify DRM distribution rights.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Dates Grid */}
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block ml-1">Launch Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm shadow-inner font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block ml-1">Termination Date</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm shadow-inner font-mono" />
                                </div>
                            </div>

                            {/* Times */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block ml-1">Allocated Timeslots</label>
                                <input type="text" name="preferredTimes" value={formData.preferredTimes} onChange={handleInputChange} placeholder="e.g., 10:00 AM, 2:30 PM, 7:00 PM" className="w-full bg-[#121212] border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm placeholder:text-gray-600 shadow-inner block" />
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block ml-1">Justification Brief</label>
                                <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Define local market logic for this feature deployment..." rows="3" className="w-full bg-[#121212] border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm resize-none placeholder:text-gray-600 custom-scrollbar shadow-inner" />
                            </div>

                            {/* Submit */}
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full py-4.5 mt-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] border border-orange-400/30"
                            >
                                {isSubmitting ? 'Transmitting...' : 'Transmit Proposal'} 
                                {!isSubmitting && <Send size={16} strokeWidth={2.5}/>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT: REQUEST HISTORY --- */}
                <div className="lg:col-span-8 xl:col-span-7">
                    <div className="bg-[#060606]/80 backdrop-blur-2xl border border-white/[0.04] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-160px)] min-h-[700px] relative">
                        <div className="absolute top-0 right-0 w-[50%] h-[1px] bg-gradient-to-l from-transparent via-white/20 to-transparent"></div>
                        
                        {/* History Header */}
                        <div className="px-8 py-6 border-b border-white/[0.05] flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Log Feed</h3>
                                <p className="text-xs text-gray-500 mt-1 font-medium">Historical dispatch records and central admin verdicts.</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/[0.03] text-gray-400 px-4 py-2 rounded-xl border border-white/[0.05] shadow-inner">
                                {requests.length} Proposals
                            </span>
                        </div>
                        
                        {/* Scrollable History List */}
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-5 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01),transparent)]">
                            {requests.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-60">
                                    <div className="w-24 h-24 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mb-6 shadow-inner">
                                        <Film size={40} className="text-gray-600"/>
                                    </div>
                                    <p className="text-white text-xl font-black tracking-tight drop-shadow-md">No Log Detected</p>
                                    <p className="text-gray-500 text-sm mt-2 font-medium">Past submissions will be archived here.</p>
                                </div>
                            ) : (
                                requests.map(req => {
                                    const Status = getStatusConfig(req.status);
                                    const StatusIcon = Status.icon;

                                    return (
                                        <div key={req._id} className="bg-[#030303] border border-white/[0.05] rounded-2xl p-6 hover:bg-[#0a0a0a] transition-all group shadow-lg">
                                            
                                            {/* Header Row */}
                                            <div className="flex justify-between items-start mb-5 pb-5 border-b border-white/[0.05]">
                                                <div>
                                                    <h4 className="font-bold text-gray-100 text-xl tracking-tight group-hover:text-orange-400 transition-colors pr-4">
                                                        {req.movie?.title || req.customMovieTitle}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-mono">Dispatched {new Date(req.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border shadow-inner ${Status.color}`}>
                                                    <StatusIcon size={14} strokeWidth={2.5}/> {req.status}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                                <div className="bg-[#111] p-4 rounded-xl border border-white/[0.05] flex items-center gap-4 shadow-inner">
                                                    <div className="p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                                                        <CalendarRange size={16} className="text-gray-500 shrink-0"/>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black mb-1">Target Window</p>
                                                        <p className="text-sm text-gray-200 font-bold">{new Date(req.startDate).toLocaleDateString()} &mdash; {new Date(req.endDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-[#111] p-4 rounded-xl border border-white/[0.05] flex items-center gap-4 shadow-inner">
                                                    <div className="p-2.5 bg-gray-900 rounded-lg border border-gray-800">
                                                        <Clock3 size={16} className="text-gray-500 shrink-0"/>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black mb-1">Target Slots</p>
                                                        <p className="text-sm text-orange-400 font-bold font-mono">{req.preferredTimes?.join(', ') || 'Any Available'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin Reply Callout */}
                                            {req.adminReply && (
                                                <div className={`mt-5 p-4 rounded-xl border flex items-start gap-3.5 shadow-inner ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-500/[0.05] border-emerald-500/20' : 'bg-red-500/[0.05] border-red-500/20'
                                                }`}>
                                                    <div className={`p-2 rounded-lg ${req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        <MessageSquare size={16} strokeWidth={2.5} className="shrink-0"/>
                                                    </div>
                                                    <div className="flex-1 mt-0.5">
                                                        <p className={`text-[9px] uppercase tracking-[0.2em] font-black mb-1.5 ${req.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            System Directive Log
                                                        </p>
                                                        <p className="text-sm text-gray-300 leading-relaxed font-medium">{req.adminReply}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleRequests;