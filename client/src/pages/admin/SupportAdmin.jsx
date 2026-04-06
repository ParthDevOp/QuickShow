import React, { useState, useEffect, useRef } from 'react';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Search, Filter, MessageSquare, Clock, CheckCircle2, User, 
    Send, XCircle, AlertCircle, ShieldCheck, Inbox 
} from 'lucide-react';

const SupportAdmin = () => {
    const { axios, getToken, user } = useAppContext();
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // UI State
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, Open, In Progress, Resolved
    const [searchQuery, setSearchQuery] = useState('');
    const [isReplying, setIsReplying] = useState(false);

    const chatEndRef = useRef(null);

    // 1. Fetch All Tickets
    const fetchTickets = async () => {
        try {
            const { data } = await axios.get('/api/admin/tickets', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                setTickets(data.tickets);
                // If a ticket is currently selected, update its data live
                if (selectedTicket) {
                    const updatedSelected = data.tickets.find(t => t._id === selectedTicket._id);
                    if (updatedSelected) setSelectedTicket(updatedSelected);
                }
            }
        } catch (error) {
            toast.error("Failed to load support tickets.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { if (user) fetchTickets(); }, [user]);

    // Auto-scroll chat to bottom when messages update
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedTicket?.messages]);

    // 2. Handle Reply & Status Change
    const handleReply = async (e, forceStatus = null) => {
        e?.preventDefault();
        
        // If we aren't just changing status, ensure there's text
        if (!forceStatus && !replyText.trim()) return;

        setIsReplying(true);
        try {
            const payload = {
                ticketId: selectedTicket._id,
                text: replyText.trim() || (forceStatus === 'Resolved' ? "Ticket closed by Admin." : "Status updated by Admin."),
                status: forceStatus || undefined // Only send status if we are forcing a change
            };

            const { data } = await axios.post('/api/admin/tickets/reply', payload, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (data.success) {
                toast.success(forceStatus === 'Resolved' ? "Ticket Closed!" : "Reply Sent!");
                setReplyText('');
                fetchTickets(); // Refresh data to get the new message
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to send reply.");
        } finally {
            setIsReplying(false);
        }
    };

    // --- FILTERS ---
    const filteredTickets = tickets.filter(t => {
        const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
        const matchesSearch = t.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t._id.includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    // --- UI HELPERS ---
    const getStatusColor = (status) => {
        if (status === 'Resolved') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        if (status === 'In Progress') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20'; // Open
    };

    const getStatusIcon = (status) => {
        if (status === 'Resolved') return <CheckCircle2 size={12}/>;
        if (status === 'In Progress') return <Clock size={12}/>;
        return <AlertCircle size={12}/>;
    };

    return !isLoading ? (
        <div className="pb-20 min-h-[calc(100vh-100px)] font-outfit text-white flex flex-col">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <div>
                    <Title text1="Support" text2="Desk" />
                    <p className="text-gray-400 text-sm mt-1">Manage user inquiries, resolve issues, and provide assistance.</p>
                </div>
            </div>

            {/* Main Layout: Inbox (Left) + Chat (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-[700px]">
                
                {/* --- LEFT: TICKET INBOX --- */}
                <div className="lg:col-span-4 bg-[#121212] border border-gray-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    
                    {/* Inbox Controls */}
                    <div className="p-5 border-b border-gray-800 bg-[#1a1a1a]">
                        <div className="relative w-full group mb-4">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors"/>
                            <input 
                                type="text" 
                                placeholder="Search by ID or Subject..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#121212] border border-gray-800 text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-primary/50 transition-all text-sm"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                            {['ALL', 'Open', 'In Progress', 'Resolved'].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border ${filterStatus === status ? 'bg-primary text-white border-primary' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {filteredTickets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                                <Inbox size={40} className="mb-3 opacity-20"/>
                                <p className="text-sm font-medium">No tickets found.</p>
                                <p className="text-xs mt-1">Inbox zero achieved!</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div 
                                    key={ticket._id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedTicket?._id === ticket._id ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#1a1a1a] border-gray-800 hover:border-gray-600 hover:bg-gray-800/50'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                                            {getStatusIcon(ticket.status)} {ticket.status}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString('en-IN', {month:'short', day:'numeric'})}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white line-clamp-1 mb-1">{ticket.subject}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-1">
                                        {ticket.messages?.[ticket.messages.length - 1]?.text || "No messages yet."}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- RIGHT: CHAT / ACTION WINDOW --- */}
                <div className="lg:col-span-8 bg-[#121212] border border-gray-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
                    {!selectedTicket ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 bg-[#0a0a0a]">
                            <MessageSquare size={60} className="mb-4 opacity-10"/>
                            <h3 className="text-xl font-bold text-gray-400">Select a Ticket</h3>
                            <p className="text-sm mt-2">Choose a ticket from the inbox to view details and reply.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-6 bg-[#1a1a1a] border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                                        <User size={20}/>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white leading-tight">{selectedTicket.subject}</h2>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">Ticket ID: {selectedTicket._id}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    {selectedTicket.status !== 'Resolved' && (
                                        <button 
                                            onClick={(e) => handleReply(e, 'Resolved')}
                                            disabled={isReplying}
                                            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                                        >
                                            <ShieldCheck size={14}/> Mark Resolved
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chat Messages Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0b0b0b]">
                                {selectedTicket.messages?.map((msg, idx) => {
                                    const isAgent = msg.sender === 'Agent';
                                    return (
                                        <div key={idx} className={`flex w-full ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl p-4 ${
                                                isAgent 
                                                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-[0_5px_15px_rgba(37,99,235,0.2)]' 
                                                    : 'bg-gray-800 text-gray-200 rounded-tl-sm shadow-md'
                                            }`}>
                                                <div className="flex items-center justify-between mb-2 gap-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${isAgent ? 'text-blue-200' : 'text-gray-400'}`}>
                                                        {isAgent ? 'Support Team' : 'Customer'}
                                                    </span>
                                                    {msg.createdAt && (
                                                        <span className={`text-[9px] ${isAgent ? 'text-blue-300' : 'text-gray-500'}`}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                                {/* Invisible div to anchor the auto-scroll */}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input Footer */}
                            {selectedTicket.status !== 'Resolved' ? (
                                <div className="p-4 bg-[#1a1a1a] border-t border-gray-800">
                                    <form onSubmit={handleReply} className="flex items-end gap-3 relative">
                                        <textarea 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Type your reply to the customer..."
                                            className="w-full bg-[#121212] border border-gray-700 rounded-2xl p-4 text-sm text-white resize-none h-20 outline-none focus:border-blue-500 transition-colors custom-scrollbar"
                                            onKeyDown={(e) => {
                                                // Quick submit with Cmd/Ctrl + Enter
                                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleReply(e);
                                            }}
                                        />
                                        <button 
                                            type="submit"
                                            disabled={isReplying || !replyText.trim()}
                                            className="h-12 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg disabled:shadow-none"
                                        >
                                            {isReplying ? "Sending..." : <><Send size={16}/> Reply</>}
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-gray-500 text-center mt-2 font-medium">Pro tip: Press <kbd className="bg-gray-800 px-1 rounded">Cmd</kbd> + <kbd className="bg-gray-800 px-1 rounded">Enter</kbd> to send</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-emerald-500/5 border-t border-emerald-500/20 flex flex-col items-center justify-center text-center">
                                    <CheckCircle2 size={24} className="text-emerald-500 mb-2"/>
                                    <h4 className="text-emerald-400 font-bold">This ticket has been resolved.</h4>
                                    <p className="text-xs text-gray-500 mt-1">The chat is closed. If the user replies, the ticket will automatically reopen.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    ) : <Loading />;
};

export default SupportAdmin;