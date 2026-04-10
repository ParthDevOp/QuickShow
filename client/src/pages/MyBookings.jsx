import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import Loading from '../components/Loading'
import { Calendar, Clock, MapPin, Ticket, CheckCircle2, AlertCircle, Download, Printer, FileText, AlertTriangle, X, ScanLine, ChevronDown, ChevronUp, Popcorn, Tag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import QRCode from 'qrcode' 

const MyBookings = () => {
    const { axios, getToken, user } = useAppContext()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const [bookingToCancel, setBookingToCancel] = useState(null)
    const [isCancelling, setIsCancelling] = useState(false)

    const fetchBookings = async () => {
        try {
            const { data } = await axios.get('/api/bookings/my-bookings', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) setBookings(data.bookings)
        } catch (error) { toast.error("Failed to load bookings") } 
        finally { setLoading(false) }
    }

    // Fix background scrolling when modal is open
    useEffect(() => {
        if (bookingToCancel) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [bookingToCancel]);

    useEffect(() => {
        if (user) fetchBookings()
    }, [user])

    const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    
    try {
        const token = await getToken();
        
        // 🐛 DEBUG 1: Ensure we actually have an ID to send
        console.log("Attempting to cancel booking ID:", bookingToCancel._id);

        const { data } = await axios.post('/api/bookings/cancel', 
            { bookingId: bookingToCancel._id }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
            toast.success(data.message || "Ticket successfully cancelled.", { icon: '💸', duration: 6000 });
            setBookingToCancel(null);
            fetchBookings(); 
        } else {
            toast.error(data.message || "Cancellation declined by server."); 
        }
    } catch (error) {
        // 🐛 DEBUG 2: Log the full error to your browser console
        console.error("Cancellation Error Details:", error.response?.data || error.message);
        
        // Intelligently show the backend's error message if one exists, otherwise use fallback
        const errorMessage = error.response?.data?.message || "Failed to cancel booking. Please try again.";
        toast.error(errorMessage);
    } finally {
        setIsCancelling(false);
    }
};
    let refundEstimate = 0, earnedPoints = 0, pointsToDeduct = 0;
    if (bookingToCancel) {
        refundEstimate = Math.round(bookingToCancel.amount * 0.60);
        earnedPoints = Math.floor(bookingToCancel.amount * 0.05);
        pointsToDeduct = Math.floor(earnedPoints * 0.60);
    }

    if (loading) return <Loading />

    return (
        <div className='min-h-screen bg-[#050505] px-4 md:px-12 lg:px-20 py-10 font-outfit text-white pt-28 animate-fadeIn'>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className='text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500'>My Tickets</h1>
                    <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                        <FileText size={14}/> History & Tax Invoices
                    </p>
                </div>
                <button onClick={() => window.print()} className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all">
                    <Printer size={16}/> Print Page
                </button>
            </div>

            <div className="space-y-6 relative">
                {bookings.length === 0 ? (
                   <div className="text-center py-24 bg-[#0f0f0f] rounded-3xl border border-gray-800/50">
                       <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <Ticket className="w-10 h-10 text-gray-500"/>
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2">No bookings yet</h3>
                       <p className="text-gray-500 mb-6">Your movie history will appear here.</p>
                       <button onClick={()=>navigate('/')} className="bg-primary hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                           Book a Movie
                       </button>
                   </div>
                ) : (
                   bookings.map((booking) => (
                       <TicketCard 
                           key={booking._id} 
                           booking={booking} 
                           user={user} 
                           onCancelClick={() => setBookingToCancel(booking)} 
                       />
                   ))
                )}
            </div>

            {/* Cancel Modal (Unchanged) */}
            {bookingToCancel && (
                <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn print:hidden">
                    <div className="bg-[#121212] border border-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-red-500/5">
                            <div className="flex items-center gap-3 text-red-500">
                                <AlertTriangle size={24} />
                                <h3 className="text-xl font-black">Cancel Ticket</h3>
                            </div>
                            <button onClick={() => setBookingToCancel(null)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <p className="text-gray-300 font-medium">Are you sure you want to cancel your booking for <strong>{bookingToCancel.show?.movie?.title || "this movie"}</strong>?</p>
                            
                            <div className="bg-[#1a1a1a] border border-gray-700 p-5 rounded-2xl">
                                <h4 className="font-bold text-white mb-3 text-sm">Cancellation Terms & Conditions</h4>
                                <ul className="list-disc pl-5 text-sm text-gray-400 space-y-2">
                                    <li>You will receive a <strong>60% refund (₹{refundEstimate})</strong> to your original payment method within 3-5 business days.</li>
                                    <li>The remaining 40% (₹{bookingToCancel.amount - refundEstimate}) is retained as a non-refundable cancellation fee.</li>
                                    <li><strong>{pointsToDeduct} Loyalty Coins</strong> (60% of what you earned from this booking) will be deducted from your wallet.</li>
                                    <li>This action is permanent and your seats will be released immediately.</li>
                                </ul>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setBookingToCancel(null)} disabled={isCancelling} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all disabled:opacity-50">
                                    Keep Ticket
                                </button>
                                <button onClick={handleConfirmCancel} disabled={isCancelling} className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                                    {isCancelling ? 'Processing...' : 'Agree & Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
            `}</style>
        </div>
    )
}

// Subcomponent
const TicketCard = ({ booking, user, onCancelClick }) => {
    // 🚨 Extracting detailed billing arrays and fields
    const { _id, amount, isPaid, show, bookedSeats, seats, createdAt, status, snacks = [], discountAmount = 0, convenienceFee = 0, ticketsTotal = 0, isCheckedIn } = booking;
    const isCancelled = status === 'CANCELLED' || status === 'Cancelled';
    
    const [qrCodeData, setQrCodeData] = useState('');
    const [showBillDetails, setShowBillDetails] = useState(false);

    useEffect(() => {
        if (!isCancelled && _id) {
            const secureData = booking.qrToken || _id; 
            QRCode.toDataURL(secureData, { errorCorrectionLevel: 'L', margin: 2, width: 300 })
                .then(url => setQrCodeData(url))
                .catch(err => console.error("QR Generation Error:", err));
        }
    }, [_id, isCancelled, booking.qrToken]); 

    if (!isCancelled && (!show || !show.movie || !show.theater)) {
        return (
            <div className="flex bg-[#121212] border border-red-900/30 rounded-2xl p-6 items-center gap-4 opacity-70">
                <div className="p-3 bg-red-900/20 rounded-full text-red-500"><AlertTriangle size={24}/></div>
                <div>
                    <h3 className="text-lg font-bold text-gray-300">Show Data Unavailable</h3>
                    <p className="text-sm text-gray-500">This show has been removed or passed. Booking ID: #{_id.slice(-6).toUpperCase()}</p>
                </div>
            </div>
        )
    }

    const movieTitle = show?.movie?.title || "Unknown Movie";
    const theaterName = show?.theater?.name || "Unknown Theater";
    const theaterCity = show?.theater?.city || "";
    const posterPath = show?.movie?.poster_path || "https://via.placeholder.com/400x600?text=No+Image";
    
    const bookingId = _id.slice(-8).toUpperCase();
    const showDate = show?.showDateTime ? new Date(show.showDateTime).toDateString() : "Date Unavailable";
    const showTime = show?.showDateTime ? new Date(show.showDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Time Unavailable";
    const bookingDate = new Date(createdAt).toLocaleDateString();
    
    const actualSeats = bookedSeats || seats || [];
    
    // Fallback Math in case DB doesn't store exact sub-totals, but saves total amounts
    const snacksSum = snacks.reduce((acc, s) => acc + (s.price * s.quantity), 0);
    const calculatedTicketsTotal = ticketsTotal > 0 ? ticketsTotal : (amount - snacksSum - convenienceFee + discountAmount);

    const downloadReceipt = async () => {
        if (isCancelled) return toast.error("Cannot download a cancelled ticket.");
        try {
            const doc = new jsPDF();
            const secureData = booking.qrToken || _id; 
            const pdfQrUrl = await QRCode.toDataURL(secureData, { errorCorrectionLevel: 'L', margin: 2, width: 300 });

            // Header Section
            doc.setFillColor(20, 20, 20); doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(248, 69, 101); doc.setFontSize(26); doc.setFont("helvetica", "bold");
            doc.text("QuickShow", 15, 25);
            doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont("helvetica", "normal");
            doc.text("Electronic Ticket & Tax Invoice", 150, 25);

            // Customer Info
            doc.setTextColor(0, 0, 0); let y = 55;
            doc.setFontSize(10); doc.setTextColor(100);
            doc.text("Billed To:", 15, y); doc.text("Invoice Details:", 130, y);
            
            y += 7;
            doc.setFontSize(11); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text(user?.fullName || "Guest User", 15, y);
            doc.text(`Invoice #: INV-${bookingId}`, 130, y);
            
            y += 6;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            doc.text(user?.primaryEmailAddress?.emailAddress || "N/A", 15, y);
            doc.text(`Date: ${bookingDate}`, 130, y);

            // Movie Block
            y += 20;
            doc.setDrawColor(230); doc.setFillColor(250, 250, 250); doc.roundedRect(15, y, 180, 50, 3, 3, 'FD');
            doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
            doc.text(movieTitle, 25, y+15);
            doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(80);
            doc.text(`${theaterName}, ${theaterCity}`, 25, y+25);
            doc.text(`${showDate} | ${showTime}`, 25, y+32);
            
            doc.setFillColor(248, 69, 101); doc.roundedRect(140, y+10, 45, 12, 2, 2, 'F');
            doc.setTextColor(255); doc.setFontSize(10); doc.setFont("helvetica", "bold");
            doc.text(`Seats: ${actualSeats.join(', ')}`, 162, y+18, {align: 'center'});

            // Bill Items Table Header
            y += 65; doc.setFontSize(10); doc.setTextColor(0); doc.setFont("helvetica", "bold");
            doc.text("Description", 15, y); doc.text("Amount", 180, y, {align: 'right'});
            doc.setDrawColor(200); doc.line(15, y+2, 195, y+2);
            doc.setFont("helvetica", "normal");
            
            // 1. Tickets
            y += 10;
            doc.text(`Tickets (${actualSeats.length}x Seats: ${actualSeats.join(', ')})`, 15, y);
            doc.text(`Rs. ${calculatedTicketsTotal}.00`, 180, y, {align: 'right'});

            // 2. Snacks
            if (snacks && snacks.length > 0) {
                snacks.forEach(snack => {
                    y += 8;
                    doc.text(`${snack.quantity}x ${snack.name}`, 15, y);
                    doc.text(`Rs. ${snack.price * snack.quantity}.00`, 180, y, {align: 'right'});
                });
            }

            // 3. Convenience Fee
            if (convenienceFee > 0) {
                y += 8;
                doc.text(`Convenience & Venue Fee`, 15, y);
                doc.text(`Rs. ${convenienceFee}.00`, 180, y, {align: 'right'});
            }

            // 4. Coupons/Discounts
            if (discountAmount > 0) {
                y += 8;
                doc.setTextColor(46, 204, 113); // Green color
                doc.text(`Loyalty Reward / Coupon Applied`, 15, y);
                doc.text(`- Rs. ${discountAmount}.00`, 180, y, {align: 'right'});
                doc.setTextColor(0); // Reset color
            }

            // Total Amount
            doc.setDrawColor(200); doc.line(15, y+5, 195, y+5);
            y += 15;
            doc.setFontSize(12); doc.setFont("helvetica", "bold");
            doc.text("Total Amount Paid", 15, y);
            doc.setTextColor(248, 69, 101);
            doc.text(`Rs. ${amount}.00`, 180, y, {align: 'right'});

            // QR Code Footer
            y += 20; doc.addImage(pdfQrUrl, 'PNG', 85, y, 40, 40);
            y += 45; doc.setTextColor(150); doc.setFontSize(9); doc.setFont("helvetica", "normal");
            doc.text("Scan this QR code at the cinema entrance.", 105, y, {align: 'center'});
            doc.text(`Booking ID: ${_id}`, 105, y+5, {align: 'center'});

            doc.save(`Ticket_${bookingId}.pdf`);
            toast.success("Detailed Invoice Downloaded");
        } catch (error) { console.error(error); toast.error("Could not generate receipt"); }
    }

    return (
        <div className={`flex flex-col lg:flex-row bg-[#121212] border ${isCancelled ? 'border-red-900/50 opacity-80' : 'border-gray-800'} rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 group`}>
            
            {/* Left: Poster */}
            <div className="w-full lg:w-56 h-56 lg:h-auto relative overflow-hidden shrink-0">
                <img src={posterPath} alt="" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isCancelled && 'grayscale'}`}/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
                {isCancelled && <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center backdrop-blur-[2px]"><span className="text-white font-black tracking-widest rotate-[-45deg] text-2xl border-4 border-white/50 p-2 rounded-xl">VOID</span></div>}
            </div>
            
            {/* Middle: Info & Bill Breakdown */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between border-r border-gray-800 border-dashed relative">
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#050505] rounded-full hidden lg:block"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-[#050505] rounded-full hidden lg:block"></div>

                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h2 className={`text-2xl font-bold leading-tight ${isCancelled ? 'text-gray-400 line-through' : 'text-white'}`}>{movieTitle}</h2>
                        <span className="text-[10px] font-mono text-gray-500 border border-gray-800 px-2 py-0.5 rounded bg-black/50">#{bookingId}</span>
                    </div>
                    <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <MapPin size={16} className={isCancelled ? 'text-gray-600' : 'text-primary'}/> {theaterName}{theaterCity ? `, ${theaterCity}` : ''}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                            <Calendar size={16} className={isCancelled ? 'text-gray-600' : 'text-primary'}/> {showDate}
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <Clock size={16} className={isCancelled ? 'text-gray-600' : 'text-primary'}/> {showTime}
                        </div>
                    </div>
                </div>

                {/* 🚨 Detailed Bill UI Breakdown */}
                <div className="mt-6 pt-6 border-t border-gray-800/50">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Seats ({actualSeats.length})</p>
                            <p className={`text-xl font-bold tracking-widest ${isCancelled ? 'text-gray-500 line-through' : 'text-white'}`}>{actualSeats.join(', ')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Paid Amount</p>
                            <p className={`text-xl font-bold ${isCancelled ? 'text-gray-500' : 'text-primary'}`}>₹{amount}</p>
                        </div>
                    </div>

                    {/* View Details Dropdown */}
                    <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
                        <button 
                            onClick={() => setShowBillDetails(!showBillDetails)} 
                            className="w-full px-4 py-3 text-xs font-bold text-gray-400 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                            <span className="flex items-center gap-2"><FileText size={14} className="text-gray-500"/> Invoice Breakdown</span>
                            {showBillDetails ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        </button>
                        
                        {showBillDetails && (
                            <div className="px-4 pb-4 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-300 pt-2 border-t border-gray-800">
                                    <span>Tickets</span>
                                    <span className="font-mono">₹{calculatedTicketsTotal}</span>
                                </div>
                                
                                {snacks.map((snack, index) => (
                                    <div key={index} className="flex justify-between text-gray-400">
                                        <span className="flex items-center gap-2 text-xs"><Popcorn size={12}/> {snack.quantity}x {snack.name}</span>
                                        <span className="font-mono text-xs">₹{snack.price * snack.quantity}</span>
                                    </div>
                                ))}

                                {convenienceFee > 0 && (
                                    <div className="flex justify-between text-gray-400 text-xs">
                                        <span>Convenience Fee</span>
                                        <span className="font-mono">₹{convenienceFee}</span>
                                    </div>
                                )}

                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-400 text-xs font-bold bg-emerald-500/5 p-1.5 rounded-md mt-1">
                                        <span className="flex items-center gap-1"><Tag size={12}/> Coupon Applied</span>
                                        <span className="font-mono">-₹{discountAmount}</span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between font-bold text-white pt-2 mt-2 border-t border-gray-800/50">
                                    <span>Total</span>
                                    <span className="font-mono text-primary">₹{amount}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Actions & QR */}
            <div className="w-full lg:w-72 bg-[#1a1a1a] p-6 lg:p-8 flex flex-col items-center justify-between gap-4 relative">
                <div className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border ${
                    isCancelled ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    isCheckedIn ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    isPaid ? 'bg-green-500/5 text-green-500 border-green-500/20' : 'bg-orange-500/5 text-orange-500 border-orange-500/20'
                }`}>
                    {isCancelled ? <><AlertCircle size={14}/> CANCELLED</> :
                     isCheckedIn ? <><CheckCircle2 size={14}/> ENTRY LOGGED - SCANNED</> :
                     isPaid ? <><CheckCircle2 size={14}/> CONFIRMED</> : <><AlertCircle size={14}/> PAY AT COUNTER</>}
                </div>

                {!isCancelled ? (
                    <>
                        <div className="bg-white p-2 rounded-2xl mt-2 border-4 border-gray-800 shadow-xl relative group">
                            {qrCodeData ? (
                                <img src={qrCodeData} alt="Scan to enter" className="w-28 h-28 object-contain mix-blend-multiply opacity-95"/>
                            ) : (
                                <div className="w-28 h-28 flex items-center justify-center bg-gray-100">
                                    <ScanLine size={32} className="text-gray-300 animate-pulse" />
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gate Pass</p>
                        
                        <div className="w-full space-y-2 mt-2">
                            <button onClick={downloadReceipt} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all group">
                                <Download size={14} className="group-hover:translate-y-0.5 transition-transform"/> Download Tax Invoice
                            </button>
                            
                            {!isCheckedIn && (
                                <button onClick={onCancelClick} className="w-full py-2.5 bg-red-500/10 hover:bg-red-600 hover:text-white border border-red-500/20 rounded-xl text-xs font-bold text-red-500 transition-all">
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 py-4">
                        <AlertTriangle size={32} className="text-red-500 mb-2"/>
                        <p className="text-xs font-bold text-gray-400">TICKET VOIDED</p>
                        <p className="text-[10px] text-gray-500 mt-1">Refund initiated to original payment method.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyBookings;