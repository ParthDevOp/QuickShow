import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
    MessageSquare, Ticket, CreditCard, Film, ChevronDown, 
    Bot, Phone, Mail, Clock, AlertCircle, ArrowRight, 
    CheckCircle2, Headset, MapPin, Send, ArrowLeft, User as UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

const Support = () => {
    const { user, axios, getToken } = useAppContext();
    const navigate = useNavigate();
    
    // Dashboard States
    const [latestBooking, setLatestBooking] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [openFaq, setOpenFaq] = useState(null);
    const [activeTicketStatus, setActiveTicketStatus] = useState(null); 
    const [myTickets, setMyTickets] = useState([]);

    // Chat Window States
    const [activeTicket, setActiveTicket] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef(null);

    // Helper to ensure TMDB images load correctly
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/300x450?text=No+Poster';
        if (path.startsWith('http')) return path;
        return `https://image.tmdb.org/t/p/w500${path}`;
    };

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (activeTicket) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages]);

    // Fetch initial data (Latest Booking & Past Tickets)
    useEffect(() => {
        const fetchSupportData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            try {
                const token = await getToken();
                
                // Fetch latest booking
                const bookingRes = await axios.get('/api/bookings/my-bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (bookingRes.data.success && bookingRes.data.bookings.length > 0) {
                    setLatestBooking(bookingRes.data.bookings[0]);
                }

                // Fetch past support tickets
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
    const handleCreateTicket = async (issueType) => {
        if (!user) return toast.error("Please log in to contact support.");
        
        setActiveTicketStatus(`Creating secure ticket for: ${issueType}...`);
        
        try {
            const token = await getToken();
            const payload = {
                subject: issueType,
                relatedBooking: latestBooking ? latestBooking._id : null
            };

            const { data } = await axios.post('/api/support/create', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                toast.success("Support ticket created! The AI has responded.", { icon: '🤖' });
                // Update local tickets list
                setMyTickets([data.ticket, ...myTickets]);
                // SWITCH TO CHAT VIEW
                setActiveTicket(data.ticket);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to create ticket. Please try again.");
        } finally {
            setActiveTicketStatus(null);
        }
    };

    // --- SEND MESSAGE IN CHAT HANDLER ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !activeTicket) return;

        setIsSending(true);
        const token = await getToken();

        // Optimistically update UI
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
                // Update with server verified data
                setActiveTicket(data.ticket);
                
                // Update the ticket in the sidebar list
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

    // --- FAQ DATA (UPDATED WITH 60% POLICY) ---
    const faqs = [
        { 
            q: "How do I cancel my ticket and get a refund?", 
            a: "You can cancel your ticket up to 4 hours before the showtime via the 'My Bookings' page. As per our strict policy, you will receive a 60% refund to your original payment method, and 60% of the loyalty coins earned from that booking will be reversed. The remaining 40% is retained as a cancellation fee." 
        },
        { 
            q: "Why didn't I receive my M-Ticket (Email/SMS)?", 
            a: "Sometimes emails go to the spam folder. However, you don't need an email! Your ticket is permanently saved in the 'My Bookings' section of the app. Just show the QR code from there at the cinema." 
        },
        { 
            q: "How do Loyalty Coins work?", 
            a: "You earn coins (5% of your total) on every successful booking. You can use these coins on the Checkout page to get discounts on future movie tickets or F&B combos." 
        },
        { 
            q: "What is 'High Demand Surge' pricing?", 
            a: "For highly anticipated blockbuster releases on opening weekends, a small surge fee (usually 10%) is applied dynamically based on seat scarcity. This is shown transparently before checkout." 
        },
        { 
            q: "Can I change my seats after booking?", 
            a: "Currently, seat modifications are not supported once a booking is confirmed. You will need to cancel your existing booking (if eligible) and book new seats." 
        }
    ];

    const supportCategories = [
        { title: "Payment & Refunds", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { title: "Ticket & Booking Issues", icon: Ticket, color: "text-blue-400", bg: "bg-blue-500/10" },
        { title: "Theater Experience", icon: Film, color: "text-purple-400", bg: "bg-purple-500/10" },
        { title: "Account & Offers", icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10" }
    ];


    // ==========================================
    // RENDER 1: CHAT WINDOW UI
    // ==========================================
    if (activeTicket) {
        return (
            <div className="min-h-screen bg-[#050505] text-white font-outfit pb-10 pt-28 px-4 md:px-16 lg:px-36 flex justify-center">
                <div className="w-full max-w-4xl bg-[#121212] rounded-3xl border border-gray-800 shadow-2xl flex flex-col h-[75vh]">
                    
                    {/* Chat Header */}
                    <div className="p-4 md:p-6 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a] rounded-t-3xl">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setActiveTicket(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 className="font-black text-lg md:text-xl truncate max-w-[200px] md:max-w-md">{activeTicket.subject}</h2>
                                <p className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Support Active
                                </p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:block">
                            Ticket #{activeTicket._id.slice(-6).toUpperCase()}
                        </div>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar">
                        {activeTicket.messages.map((msg, idx) => {
                            const isUser = msg.sender === 'User';
                            return (
                                <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                        
                                        {/* Avatar */}
                                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isUser ? 'bg-gray-800 text-gray-400' : 'bg-primary/20 border border-primary/30 text-primary'}`}>
                                            {isUser ? <UserIcon size={16}/> : <Bot size={16}/>}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`p-4 rounded-2xl ${isUser ? 'bg-primary text-white rounded-tr-sm shadow-primary/20' : 'bg-[#1a1a1a] border border-gray-800 text-gray-200 rounded-tl-sm'}`}>
                                            <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                            <span className={`text-[10px] mt-2 block font-medium ${isUser ? 'text-red-200 text-right' : 'text-gray-500'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Area */}
                    <div className="p-4 bg-[#1a1a1a] border-t border-gray-800 rounded-b-3xl">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <input 
                                type="text" 
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Type your message here..."
                                className="flex-1 bg-[#121212] border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                            />
                            <button 
                                type="submit"
                                disabled={isSending || !chatInput.trim()}
                                className="bg-primary hover:bg-rose-600 disabled:opacity-50 disabled:hover:bg-primary text-white p-3 rounded-xl transition-colors shadow-lg"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER 2: DASHBOARD UI (When activeTicket is null)
    // ==========================================
    return (
        <div className="min-h-screen bg-[#050505] text-white font-outfit pb-24 pt-28 px-6 md:px-16 lg:px-36">
            
            <div className="max-w-4xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 border border-primary/20">
                    <Headset size={16} /> 24/7 Priority Support
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
                    How can we help you today?
                </h1>
                <p className="text-gray-400 text-lg">
                    Interact with our Smart AI Assistant or choose a category below to get instant resolutions.
                </p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: SMART ASSISTANT */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* AI Smart Assist Block */}
                    <div className="bg-[#121212] rounded-3xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                        
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
                                <Bot className="text-primary w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white">Smart Resolution</h2>
                                <p className="text-gray-400 text-sm">Powered by QuickShow AI</p>
                            </div>
                        </div>

                        {!user ? (
                            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 text-center relative z-10">
                                <p className="text-gray-400 mb-4">Please log in so I can check your recent bookings and account status.</p>
                                <button onClick={() => navigate('/')} className="bg-white text-black font-bold px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors">Go to Login</button>
                            </div>
                        ) : isLoading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
                        ) : latestBooking ? (
                            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-primary/30 shadow-[0_0_30px_rgba(248,69,101,0.1)] relative z-10">
                                <p className="font-bold text-white mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="text-primary" size={18}/> 
                                    Do you need help with your most recent booking?
                                </p>
                                
                                <div className="flex gap-4 bg-[#121212] p-4 rounded-xl border border-gray-800 mb-6">
                                    <img src={getImageUrl(latestBooking.show.movie.poster_path)} className="w-16 h-24 object-cover rounded-lg shadow-md" alt="Poster" />
                                    <div className="flex-1">
                                        <h3 className="font-black text-lg text-white leading-tight">{latestBooking.show.movie.title}</h3>
                                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1"><MapPin size={12}/> {latestBooking.show.theater.name}</p>
                                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(latestBooking.show.showDateTime).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* NOW REDIRECTS TO MY BOOKINGS */}
                                    <button onClick={() => navigate('/my-bookings')} className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl border border-white/10 transition-colors text-sm text-left">
                                        Cancel & Refund this ticket
                                    </button>
                                    <button onClick={() => handleCreateTicket('Resend E-Ticket')} className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl border border-white/10 transition-colors text-sm text-left">
                                        I didn't receive my E-Ticket
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 relative z-10">
                                <p className="text-gray-400">I couldn't find any recent bookings on your account. How else can I assist you today?</p>
                            </div>
                        )}
                        
                        {activeTicketStatus && (
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-bold text-center animate-pulse">
                                {activeTicketStatus}
                            </div>
                        )}
                    </div>

                    {/* Problem Categories */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-6">What's the problem?</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {supportCategories.map((cat, idx) => (
                                <div key={idx} onClick={() => handleCreateTicket(cat.title)} className="bg-[#121212] border border-gray-800 p-5 rounded-2xl hover:border-gray-600 transition-all cursor-pointer group flex items-center gap-4">
                                    <div className={`${cat.bg} ${cat.color} p-3 rounded-xl`}><cat.icon size={20} /></div>
                                    <div className="flex-1"><h4 className="font-bold text-white group-hover:text-primary transition-colors">{cat.title}</h4></div>
                                    <ArrowRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: PAST TICKETS & DIRECT CONTACT */}
                <div className="space-y-8">

                    {/* Past Tickets Sidebar */}
                    {myTickets.length > 0 && (
                        <div className="bg-[#121212] rounded-3xl border border-gray-800 p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><MessageSquare size={18}/> Your Recent Chats</h3>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {myTickets.map(ticket => (
                                    <div 
                                        key={ticket._id} 
                                        onClick={() => setActiveTicket(ticket)}
                                        className="bg-[#1a1a1a] hover:bg-white/5 border border-gray-800 p-4 rounded-xl cursor-pointer transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-sm text-white truncate pr-2">{ticket.subject}</p>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ticket.status === 'Closed' ? 'bg-gray-800 text-gray-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Direct Contact Card */}
                    <div className="bg-gradient-to-br from-gray-900 to-[#121212] rounded-3xl border border-gray-800 p-8 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-6">Need human help?</h3>
                        <div className="space-y-4">
                            <button onClick={() => handleCreateTicket('Live Chat Request')} className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                <MessageSquare size={18}/> Start Live Chat
                            </button>
                            <a href="mailto:Quickshow@support.in" className="w-full bg-[#1a1a1a] hover:bg-white/5 border border-gray-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                                <Mail size={18} className="text-gray-400"/> Quickshow@support.in
                            </a>
                            <div className="grid grid-cols-2 gap-3">
                                <a href="tel:7878787565" className="w-full bg-[#1a1a1a] hover:bg-white/5 border border-gray-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"><Phone size={16} className="text-gray-400 shrink-0"/> 7878787565</a>
                                <a href="tel:931090108" className="w-full bg-[#1a1a1a] hover:bg-white/5 border border-gray-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"><Phone size={16} className="text-gray-400 shrink-0"/> 931090108</a>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Accordion */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
                        <div className="space-y-3">
                            {faqs.map((faq, idx) => (
                                <div 
                                    key={idx} 
                                    className={`bg-[#121212] border rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === idx ? 'border-primary/50' : 'border-gray-800'}`}
                                >
                                    <button 
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        className="w-full p-5 text-left flex justify-between items-center"
                                    >
                                        <span className="font-bold text-sm pr-4">{faq.q}</span>
                                        <ChevronDown size={18} className={`text-gray-500 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                                    </button>
                                    <div 
                                        className={`px-5 overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                        <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Support;