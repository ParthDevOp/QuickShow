import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
    MessageSquare, Ticket, CreditCard, Film, ChevronDown, 
    Bot, Phone, Mail, Clock, AlertCircle, ArrowRight, 
    CheckCircle2, Headset, MapPin, Send, ArrowLeft, User as UserIcon,
    Sparkles, ShieldCheck, LifeBuoy, HelpCircle, ChevronRight,
    Zap, Star, XCircle, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Support = () => {
    const { user, axios, getToken } = useAppContext();
    const navigate = useNavigate();
    
    // Dashboard States
    const [latestBooking, setLatestBooking] = useState(null);
    const [allBookings, setAllBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);
    const [activeTicketStatus, setActiveTicketStatus] = useState(null); 
    const [myTickets, setMyTickets] = useState([]);

    // Chat Window States
    const [activeTicket, setActiveTicket] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef(null);

    // View state for dashboard
    const [view, setView] = useState('dashboard'); // 'dashboard' | 'tickets' | 'bookings'

    // Helper to ensure TMDB images load correctly
    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://image.tmdb.org/t/p/w500${path}`;
    };

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (activeTicket) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages]);

    // Fetch initial data
    useEffect(() => {
        const fetchSupportData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            try {
                const token = await getToken();
                
                const bookingRes = await axios.get('/api/bookings/my-bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (bookingRes.data.success && bookingRes.data.bookings.length > 0) {
                    setAllBookings(bookingRes.data.bookings);
                    setLatestBooking(bookingRes.data.bookings[0]);
                }

                const ticketRes = await axios.get('/api/support/my-tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (ticketRes.data.success) {
                    setMyTickets(ticketRes.data.tickets);
                }

            } catch (error) {
                console.error("Failed to fetch support data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSupportData();
    }, [user, axios, getToken]);

    // --- CREATE TICKET HANDLER ---
    const handleCreateTicket = async (issueType, bookingId = null) => {
        if (!user) return toast.error("Please log in to contact support.");
        
        setActiveTicketStatus(`Creating ticket: ${issueType}...`);
        
        try {
            const token = await getToken();
            const payload = {
                subject: issueType,
                relatedBooking: bookingId || (latestBooking ? latestBooking._id : null)
            };

            const { data } = await axios.post('/api/support/create', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Ticket created! AI has responded.", { icon: '🤖' });
                setMyTickets([data.ticket, ...myTickets]);
                setActiveTicket(data.ticket);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create ticket.");
        } finally {
            setActiveTicketStatus(null);
        }
    };

    // --- SEND MESSAGE ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !activeTicket) return;

        setIsSending(true);
        const token = await getToken();

        const newMessage = { sender: 'User', text: chatInput, timestamp: new Date().toISOString() };
        setActiveTicket(prev => ({ ...prev, messages: [...prev.messages, newMessage] }));
        const inputMemory = chatInput;
        setChatInput('');

        try {
            const { data } = await axios.post('/api/support/message', {
                ticketId: activeTicket._id,
                text: inputMemory,
                sender: 'User'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setActiveTicket(data.ticket);
                setMyTickets(prev => prev.map(t => t._id === data.ticket._id ? data.ticket : t));
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            toast.error("Error sending message");
        } finally {
            setIsSending(false);
        }
    };

    // --- DATA ---
    const faqs = [
        { 
            q: "How do I cancel my ticket and get a refund?", 
            a: "You can cancel up to 4 hours before showtime via 'My Bookings'. You'll receive a 60% refund to your original payment method. The remaining 40% is retained as a cancellation fee, and 60% of earned loyalty coins will be reversed." 
        },
        { 
            q: "Why didn't I receive my E-Ticket?", 
            a: "Emails sometimes land in spam. But don't worry — your ticket is always available in 'My Bookings'. Just show the QR code at the cinema entrance." 
        },
        { 
            q: "How do Loyalty Coins work?", 
            a: "Earn coins (5% of your total) on every booking. Use them at checkout for discounts on future tickets and F&B combos." 
        },
        { 
            q: "What is 'High Demand Surge' pricing?", 
            a: "For blockbuster openings, a small dynamic surge (usually ~10%) is applied based on seat scarcity. It's shown transparently before checkout." 
        },
        { 
            q: "Can I change my seats after booking?", 
            a: "Seat modifications aren't supported after confirmation. You'll need to cancel the booking (if eligible) and rebook with new seats." 
        }
    ];

    const quickActions = [
        { title: "Payment & Refunds", desc: "Charges, refund status, failed payments", icon: CreditCard, gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", iconColor: "text-emerald-400" },
        { title: "Booking Issues", desc: "Seat problems, wrong show, e-ticket", icon: Ticket, gradient: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", iconColor: "text-blue-400" },
        { title: "Theater Experience", desc: "Cleanliness, sound, screen quality", icon: Film, gradient: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/20", iconColor: "text-purple-400" },
        { title: "Account & Offers", desc: "Login issues, promo codes, coins", icon: Star, gradient: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", iconColor: "text-amber-400" }
    ];

    const getStatusConfig = (status) => {
        if (status === 'Resolved' || status === 'Closed') return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' };
        if (status === 'In Progress') return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500 animate-pulse' };
        return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', dot: 'bg-rose-500 animate-pulse' };
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    };


    // ══════════════════════════════════════════════════════════════════
    // RENDER: CHAT VIEW
    // ══════════════════════════════════════════════════════════════════
    if (activeTicket) {
        const isResolved = activeTicket.status === 'Resolved' || activeTicket.status === 'Closed';
        return (
            <div className="min-h-screen bg-[#050505] text-white font-outfit pb-10 pt-24 px-4 md:px-8 lg:px-16 flex justify-center">
                <div className="w-full max-w-5xl flex gap-5 h-[80vh]">
                    
                    {/* Ticket Sidebar */}
                    <div className="hidden lg:flex w-72 bg-[#0a0a0a] border border-white/5 rounded-2xl flex-col overflow-hidden shrink-0">
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <MessageSquare size={12}/> Conversations
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {myTickets.map(ticket => {
                                const cfg = getStatusConfig(ticket.status);
                                return (
                                    <div 
                                        key={ticket._id}
                                        onClick={() => setActiveTicket(ticket)}
                                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                                            activeTicket._id === ticket._id 
                                                ? 'bg-primary/5 border-primary/20' 
                                                : 'bg-transparent border-transparent hover:bg-white/[0.02] hover:border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-white truncate pr-2 flex-1">{ticket.subject}</p>
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}></div>
                                        </div>
                                        <p className="text-[10px] text-gray-600 truncate">
                                            {ticket.messages?.[ticket.messages.length - 1]?.text || ''}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-3 border-t border-white/5">
                            <button 
                                onClick={() => { setActiveTicket(null); setView('dashboard'); }}
                                className="w-full py-2.5 bg-white/[0.03] border border-white/5 text-gray-400 text-xs font-bold rounded-xl hover:bg-white/[0.06] transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={12}/> Back to Help Center
                            </button>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <button 
                                    onClick={() => setActiveTicket(null)}
                                    className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                                    <Headset size={18} className="text-primary"/>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-sm text-white truncate">{activeTicket.subject}</h2>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'}`}></span>
                                        {isResolved ? 'Resolved' : 'Support Active'}
                                        <span className="text-gray-700">•</span>
                                        <span className="font-mono">#{activeTicket._id.slice(-6)}</span>
                                    </p>
                                </div>
                            </div>
                            {!isResolved && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg font-bold hidden sm:block">
                                        Avg reply: ~5 min
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                            {/* Opening timestamp */}
                            <div className="flex items-center justify-center gap-3 my-2">
                                <div className="h-px flex-1 bg-white/5"></div>
                                <span className="text-[9px] text-gray-600 font-mono px-3">
                                    {new Date(activeTicket.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                </span>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>

                            {activeTicket.messages.map((msg, idx) => {
                                const isUser = msg.sender === 'User';
                                const isAI = msg.sender === 'AI';
                                const isAgent = msg.sender === 'Agent';

                                return (
                                    <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex max-w-[85%] md:max-w-[70%] gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                            
                                            {/* Avatar */}
                                            <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                                                isUser 
                                                    ? 'bg-gray-800 border border-gray-700 text-gray-400' 
                                                    : isAI 
                                                        ? 'bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 text-violet-400' 
                                                        : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 text-blue-400'
                                            }`}>
                                                {isUser ? <UserIcon size={14}/> : isAI ? <Sparkles size={14}/> : <ShieldCheck size={14}/>}
                                            </div>

                                            {/* Bubble */}
                                            <div className={`rounded-2xl p-3.5 ${
                                                isUser 
                                                    ? 'bg-primary text-white rounded-tr-sm shadow-[0_4px_20px_rgba(248,69,101,0.15)]' 
                                                    : isAI
                                                        ? 'bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/10 text-gray-200 rounded-tl-sm'
                                                        : 'bg-white/[0.04] border border-white/5 text-gray-200 rounded-tl-sm'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                        isUser ? 'text-red-200' : isAI ? 'text-violet-300' : 'text-blue-300'
                                                    }`}>
                                                        {isUser ? 'You' : isAI ? '✨ QuickShow AI' : '🛡️ Support Agent'}
                                                    </span>
                                                </div>
                                                <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                <span className={`text-[9px] mt-2 block ${isUser ? 'text-red-200/50 text-right' : 'text-gray-600'}`}>
                                                    {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        {!isResolved ? (
                            <div className="p-3 bg-white/[0.02] border-t border-white/5">
                                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                    <div className="flex-1 relative">
                                        <textarea 
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Describe your issue in detail..."
                                            rows={2}
                                            className="w-full bg-black/40 border border-white/5 text-white rounded-xl p-3 text-sm resize-none outline-none focus:border-primary/30 transition-colors custom-scrollbar placeholder-gray-600"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendMessage(e);
                                            }}
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSending || !chatInput.trim()}
                                        className="h-11 px-5 bg-primary hover:bg-rose-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all text-sm shadow-[0_0_15px_rgba(248,69,101,0.2)] disabled:shadow-none"
                                    >
                                        {isSending ? <Clock size={14} className="animate-spin"/> : <Send size={14}/>}
                                    </button>
                                </form>
                                <p className="text-[9px] text-gray-600 text-center mt-1.5">
                                    <kbd className="bg-white/5 px-1 py-0.5 rounded text-[8px]">Ctrl</kbd> + <kbd className="bg-white/5 px-1 py-0.5 rounded text-[8px]">Enter</kbd> to send
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center justify-center gap-3">
                                <CheckCircle2 size={16} className="text-emerald-500"/>
                                <span className="text-xs text-emerald-400 font-bold">This conversation has been resolved.</span>
                                <button 
                                    onClick={() => handleCreateTicket(`Follow-up: ${activeTicket.subject}`)}
                                    className="text-xs text-gray-500 hover:text-white underline underline-offset-2 ml-2 flex items-center gap-1"
                                >
                                    <RotateCcw size={10}/> Reopen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }


    // ══════════════════════════════════════════════════════════════════
    // RENDER: DASHBOARD (Help Center Home)
    // ══════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-[#050505] text-white font-outfit pb-24 pt-24 px-4 md:px-8 lg:px-16">
            
            {/* Hero */}
            <div className="max-w-5xl mx-auto text-center mb-12 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs mb-5 border border-primary/20">
                        <Zap size={12} /> 24/7 Priority Support
                    </div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight">
                        How can we <span className="text-primary">help</span> you?
                    </h1>
                    <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto">
                        Get instant AI-powered answers or connect with our support team.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto">
                
                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                    {quickActions.map((action, idx) => (
                        <div 
                            key={idx} 
                            onClick={() => handleCreateTicket(action.title)}
                            className={`bg-gradient-to-b ${action.gradient} border ${action.border} rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/[0.02] rounded-full blur-xl"></div>
                            <action.icon size={22} className={`${action.iconColor} mb-3`}/>
                            <h4 className="font-bold text-sm text-white mb-1 group-hover:text-primary transition-colors">{action.title}</h4>
                            <p className="text-[11px] text-gray-500 leading-relaxed">{action.desc}</p>
                        </div>
                    ))}
                </div>

                {activeTicketStatus && (
                    <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold text-center animate-pulse flex items-center justify-center gap-2">
                        <Sparkles size={14}/> {activeTicketStatus}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT: Smart Assist + Recent Booking */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Latest Booking Context Card */}
                        {!user ? (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 text-center">
                                <UserIcon size={32} className="mx-auto mb-3 text-gray-700"/>
                                <p className="text-gray-400 mb-4 text-sm">Log in to access AI-powered support that knows your bookings.</p>
                                <button onClick={() => navigate('/')} className="bg-white text-black font-bold px-6 py-2.5 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                                    Sign In
                                </button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>
                        ) : latestBooking ? (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                                {/* Header */}
                                <div className="p-5 border-b border-white/5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                        <Bot size={16} className="text-primary"/>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-white">Smart Assistant</h3>
                                        <p className="text-[10px] text-gray-500">Detected your most recent booking</p>
                                    </div>
                                </div>

                                {/* Booking Card */}
                                <div className="p-5">
                                    <div className="flex gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-4">
                                        <div className="w-14 h-20 rounded-lg bg-gray-800 overflow-hidden shrink-0 shadow-lg">
                                            {latestBooking.show?.movie?.poster_path && (
                                                <img src={getImageUrl(latestBooking.show.movie.poster_path)} className="w-full h-full object-cover" alt="" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-base text-white leading-tight truncate">{latestBooking.show?.movie?.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={10}/> {latestBooking.show?.theater?.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                <Clock size={10}/> {new Date(latestBooking.show?.showDateTime).toLocaleDateString('en-IN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                    latestBooking.status === 'CANCELLED' 
                                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}>
                                                    {latestBooking.status || 'CONFIRMED'}
                                                </span>
                                                <span className="text-[10px] text-gray-600">₹{latestBooking.amount}</span>
                                                <span className="text-[10px] text-gray-600">{latestBooking.bookedSeats?.length} seat(s)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Help Buttons */}
                                    <p className="text-xs text-gray-500 mb-3 font-medium">Need help with this booking?</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <button 
                                            onClick={() => navigate('/my-bookings')} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-3 px-4 rounded-xl border border-white/5 transition-all text-xs text-left flex items-center gap-2 group"
                                        >
                                            <XCircle size={14} className="text-red-400 shrink-0"/>
                                            <span className="flex-1">Cancel & Get Refund</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors"/>
                                        </button>
                                        <button 
                                            onClick={() => handleCreateTicket('E-Ticket Not Received', latestBooking._id)} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-3 px-4 rounded-xl border border-white/5 transition-all text-xs text-left flex items-center gap-2 group"
                                        >
                                            <Mail size={14} className="text-blue-400 shrink-0"/>
                                            <span className="flex-1">Didn't receive E-Ticket</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors"/>
                                        </button>
                                        <button 
                                            onClick={() => handleCreateTicket('Payment Issue', latestBooking._id)} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-3 px-4 rounded-xl border border-white/5 transition-all text-xs text-left flex items-center gap-2 group"
                                        >
                                            <CreditCard size={14} className="text-emerald-400 shrink-0"/>
                                            <span className="flex-1">Payment charged, no ticket</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors"/>
                                        </button>
                                        <button 
                                            onClick={() => handleCreateTicket('Other Issue', latestBooking._id)} 
                                            className="bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold py-3 px-4 rounded-xl border border-white/5 transition-all text-xs text-left flex items-center gap-2 group"
                                        >
                                            <HelpCircle size={14} className="text-amber-400 shrink-0"/>
                                            <span className="flex-1">Something else</span>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <Bot size={20} className="text-primary"/>
                                    <h3 className="font-bold text-white">Smart Assistant</h3>
                                </div>
                                <p className="text-gray-500 text-sm">No recent bookings found on your account. Use the categories above to describe your issue, or start a live chat.</p>
                            </div>
                        )}

                        {/* All Bookings Quick View */}
                        {allBookings.length > 1 && (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <Film size={11}/> Recent Bookings
                                    </h3>
                                    <button onClick={() => navigate('/my-bookings')} className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1">
                                        View All <ArrowRight size={10}/>
                                    </button>
                                </div>
                                <div className="p-3 space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                                    {allBookings.slice(0, 5).map((booking, idx) => {
                                        const isCancelled = booking.status === 'CANCELLED';
                                        return (
                                            <div 
                                                key={booking._id || idx} 
                                                onClick={() => handleCreateTicket(`Issue with: ${booking.show?.movie?.title || 'Booking'}`, booking._id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border group ${
                                                    isCancelled 
                                                        ? 'bg-red-500/[0.02] border-red-500/10 hover:border-red-500/20' 
                                                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                                                }`}
                                            >
                                                <div className="w-8 h-11 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                                                    {booking.show?.movie?.poster_path && (
                                                        <img src={getImageUrl(booking.show.movie.poster_path)} alt="" className="w-full h-full object-cover"/>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{booking.show?.movie?.title || 'Movie'}</p>
                                                    <p className="text-[10px] text-gray-600">
                                                        {booking.show?.theater?.name} • ₹{booking.amount}
                                                    </p>
                                                </div>
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                                                    isCancelled ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                                                }`}>
                                                    {isCancelled ? 'Cancelled' : 'Active'}
                                                </span>
                                                <ChevronRight size={12} className="text-gray-700 group-hover:text-white transition-colors shrink-0"/>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* FAQ Accordion */}
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                <HelpCircle size={13}/> Frequently Asked
                            </h3>
                            <div className="space-y-2">
                                {faqs.map((faq, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`bg-[#0a0a0a] border rounded-xl overflow-hidden transition-all duration-300 ${openFaq === idx ? 'border-primary/20' : 'border-white/5'}`}
                                    >
                                        <button 
                                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                            className="w-full p-4 text-left flex justify-between items-center"
                                        >
                                            <span className="font-bold text-xs pr-4 text-gray-300">{faq.q}</span>
                                            <ChevronDown size={14} className={`text-gray-600 transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                                        </button>
                                        <div className={`px-4 overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 pb-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <p className="text-gray-500 text-xs leading-relaxed">{faq.a}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Past Tickets + Contact */}
                    <div className="space-y-6">

                        {/* Existing Conversations */}
                        {myTickets.length > 0 && (
                            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <MessageSquare size={11}/> Your Tickets
                                    </h3>
                                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{myTickets.length}</span>
                                </div>
                                <div className="p-2 space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
                                    {myTickets.map(ticket => {
                                        const cfg = getStatusConfig(ticket.status);
                                        return (
                                            <div 
                                                key={ticket._id} 
                                                onClick={() => setActiveTicket(ticket)}
                                                className="p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03] border border-transparent hover:border-white/5 group"
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-bold text-xs text-white truncate pr-2 flex-1">{ticket.subject}</p>
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`}></div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-gray-600 truncate flex-1 mr-2">
                                                        {ticket.messages?.[ticket.messages.length - 1]?.text || ''}
                                                    </p>
                                                    <span className="text-[9px] text-gray-700 shrink-0">{timeAgo(ticket.updatedAt)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {/* Start Live Chat */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                                <LifeBuoy size={14} className="text-primary"/> Need a human?
                            </h3>
                            <div className="space-y-2.5">
                                <button 
                                    onClick={() => handleCreateTicket('Live Chat Request')} 
                                    className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg"
                                >
                                    <MessageSquare size={16}/> Start Live Chat
                                </button>
                                <a 
                                    href="mailto:Quickshow@support.in" 
                                    className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    <Mail size={14} className="text-gray-400"/> Quickshow@support.in
                                </a>
                                <div className="grid grid-cols-2 gap-2">
                                    <a href="tel:7878787565" className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px]">
                                        <Phone size={12} className="text-gray-400"/> 7878787565
                                    </a>
                                    <a href="tel:931090108" className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px]">
                                        <Phone size={12} className="text-gray-400"/> 931090108
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Support Hours */}
                        <div className="bg-gradient-to-b from-primary/5 to-transparent border border-primary/10 rounded-2xl p-5 text-center">
                            <Clock size={16} className="text-primary mx-auto mb-2"/>
                            <p className="text-xs font-bold text-white mb-1">Support Hours</p>
                            <p className="text-[11px] text-gray-500">Mon-Sun: 9 AM — 12 AM IST</p>
                            <p className="text-[11px] text-gray-500">AI Assistant: 24/7</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;