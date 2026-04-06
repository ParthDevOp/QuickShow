import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = await getToken();
            const [reqRes, movieRes] = await Promise.all([
                axios.get("/api/schedule-requests/my-theater", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("/api/movie/latest") 
            ]);

            if (reqRes.data.success) setRequests(reqRes.data.requests);
            if (movieRes.data.success) setMovies(movieRes.data.movies);
        } catch (error) {
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

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
        <div className="pb-20 font-outfit text-white animate-fadeIn">
            {/* Header Section */}
            <div className="mb-8">
                <Title text1="Schedule" text2="Requests" />
                <p className="text-gray-400 text-sm mt-2 font-medium max-w-2xl">
                    Submit requests for new movie runs, special screenings, or extensions. Central Admin will review and allocate digital prints accordingly.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- LEFT: REQUEST FORM --- */}
                <div className="lg:col-span-5 sticky top-6">
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <CalendarClock size={20} className="text-orange-500"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">New Request</h3>
                                <p className="text-xs text-gray-500 font-medium">Draft a new schedule proposal</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Movie Selection */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Select Movie Title</label>
                                <select 
                                    name="movieId" 
                                    value={formData.movieId} 
                                    onChange={handleInputChange} 
                                    className="w-full bg-[#151515] border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm appearance-none cursor-pointer"
                                >
                                    <option value="" className="text-gray-500">-- Browse Currently Available Movies --</option>
                                    <option value="CUSTOM" className="text-orange-400 font-semibold">✨ Request an unlisted movie...</option>
                                    {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
                                </select>
                                
                                {formData.movieId === 'CUSTOM' && (
                                    <div className="mt-3 animate-fadeIn">
                                        <input 
                                            type="text" 
                                            name="customMovieTitle" 
                                            value={formData.customMovieTitle} 
                                            onChange={handleInputChange} 
                                            placeholder="Enter the exact movie title..." 
                                            className="w-full bg-[#151515] border border-orange-500/30 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm" 
                                        />
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-1.5 ml-1">
                                            <Info size={10} /> Central Admin will verify availability.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Dates Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Start Date</label>
                                    <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-[#151515] border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">End Date</label>
                                    <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full bg-[#151515] border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm" />
                                </div>
                            </div>

                            {/* Times */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Preferred Showtimes</label>
                                <input type="text" name="preferredTimes" value={formData.preferredTimes} onChange={handleInputChange} placeholder="e.g., 10:00 AM, 2:30 PM, 7:00 PM" className="w-full bg-[#151515] border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm placeholder:text-gray-600" />
                            </div>

                            {/* Message */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Justification / Notes</label>
                                <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder="Briefly explain why this movie will perform well in your theater..." rows="3" className="w-full bg-[#151515] border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all text-sm resize-none placeholder:text-gray-600 custom-scrollbar" />
                            </div>

                            {/* Submit */}
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full py-4 mt-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:shadow-[0_0_25px_rgba(249,115,22,0.3)]"
                            >
                                {isSubmitting ? 'Submitting to Admin...' : 'Send Schedule Request'} 
                                {!isSubmitting && <Send size={18} className="ml-1"/>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT: REQUEST HISTORY --- */}
                <div className="lg:col-span-7">
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
                        
                        {/* History Header */}
                        <div className="px-6 py-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex items-center justify-between shrink-0">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300 flex items-center gap-2">
                                <Clock size={16} className="text-gray-500"/> Status Board
                            </h3>
                            <span className="text-xs font-medium bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10">
                                {requests.length} Total
                            </span>
                        </div>
                        
                        {/* Scrollable History List */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                            {requests.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-60">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Film size={32} className="text-gray-500"/>
                                    </div>
                                    <p className="text-gray-300 text-lg font-bold">No History Yet</p>
                                    <p className="text-gray-500 text-sm mt-1">Your schedule requests will appear here.</p>
                                </div>
                            ) : (
                                requests.map(req => {
                                    const Status = getStatusConfig(req.status);
                                    const StatusIcon = Status.icon;

                                    return (
                                        <div key={req._id} className="bg-white/[0.02] border border-white/5 rounded-xl p-5 hover:bg-white/[0.04] transition-all group">
                                            
                                            {/* Header Row */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-bold text-gray-100 text-xl tracking-tight group-hover:text-orange-400 transition-colors">
                                                        {req.movie?.title || req.customMovieTitle}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mt-1">Submitted on {new Date(req.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${Status.color}`}>
                                                    <StatusIcon size={14} strokeWidth={2.5}/> {req.status}
                                                </div>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 gap-3 mb-2">
                                                <div className="bg-[#121212] p-3 rounded-lg border border-white/5 flex items-center gap-3">
                                                    <CalendarRange size={16} className="text-gray-600 shrink-0"/>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Proposed Run</p>
                                                        <p className="text-xs text-gray-200 font-medium">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="bg-[#121212] p-3 rounded-lg border border-white/5 flex items-center gap-3">
                                                    <Clock3 size={16} className="text-gray-600 shrink-0"/>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Showtimes</p>
                                                        <p className="text-xs text-orange-400 font-medium">{req.preferredTimes?.join(', ') || 'Any Available'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Admin Reply Callout */}
                                            {req.adminReply && (
                                                <div className={`mt-4 p-3.5 rounded-r-lg border-l-2 flex items-start gap-3 ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500'
                                                }`}>
                                                    <MessageSquare size={16} className={`mt-0.5 shrink-0 ${req.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'}`}/>
                                                    <div>
                                                        <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${req.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            Central Admin Reply
                                                        </p>
                                                        <p className="text-sm text-gray-200 leading-relaxed">{req.adminReply}</p>
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