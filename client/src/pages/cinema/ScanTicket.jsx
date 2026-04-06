import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import { 
    QrCode, CheckCircle, XCircle, User, Clock, Film, 
    Ticket as TicketIcon, Keyboard, RefreshCcw, ShieldCheck, 
    Camera, Hash, CreditCard, Popcorn, Mail, Phone, CalendarDays, UploadCloud, CameraOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const ScanTicket = () => {
    const { axios, getToken } = useAppContext();
    const [scanResult, setScanResult] = useState(null);
    const [ticketData, setTicketData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [manualTicketId, setManualTicketId] = useState('');
    
    // Custom Scanner States
    const [isCameraActive, setIsCameraActive] = useState(false);
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Cleanup scanner on component unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    // --- CUSTOM CAMERA LOGIC ---
    const startCamera = async () => {
        try {
            setScanResult(null);
            setTicketData(null);
            
            const html5QrCode = new Html5Qrcode("qr-reader");
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                (decodedText) => {
                    // Success Callback
                    html5QrCode.stop().then(() => {
                        setIsCameraActive(false);
                        setScanResult(decodedText);
                        verifyTicket(decodedText);
                    });
                },
                () => { /* Silent ignore for scanning errors */ }
            );
            setIsCameraActive(true);
        } catch (err) {
            toast.error("Camera access denied or device unavailable.");
            setIsCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop();
            setIsCameraActive(false);
        }
    };

    // --- FILE UPLOAD LOGIC (Images) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Stop camera if running
        if (isCameraActive) await stopCamera();

        try {
            const html5QrCode = new Html5Qrcode("qr-reader");
            const decodedText = await html5QrCode.scanFile(file, true);
            
            setScanResult(decodedText);
            verifyTicket(decodedText);
        } catch (err) {
            toast.error("No valid QR code found in this image.");
        }
        
        // Reset file input so same file can be selected again if needed
        e.target.value = '';
    };

    // --- VERIFICATION API ---
    const verifyTicket = async (ticketId) => {
        setLoading(true);
        setTicketData(null);
        try {
            const token = await getToken();
            const { data } = await axios.post("/api/box-office/scan", 
                { bookingId: ticketId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Time Enforcement Logic
            if (data.success && data.details?.showTime) {
                const showTime = new Date(data.details.showTime);
                const showEndTime = new Date(showTime.getTime() + (3 * 60 * 60 * 1000));

                if (new Date() > showEndTime) {
                    setTicketData({
                        success: false,
                        isExpired: true,
                        message: "The showtime for this ticket has already passed.",
                        details: data.details 
                    });
                    setLoading(false);
                    return;
                }
            }

            setTicketData(data);
        } catch (error) {
            setTicketData({ 
                success: false, 
                message: error.response?.data?.message || "System offline or invalid barcode." 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualTicketId.trim()) return toast.error("Enter an ID");
        if (isCameraActive) stopCamera();
        
        setScanResult(manualTicketId);
        verifyTicket(manualTicketId.trim());
    };

    const resetSystem = () => {
        setScanResult(null);
        setTicketData(null);
        setManualTicketId('');
        startCamera(); // Auto-restart camera for next guest
    };

    // --- DYNAMIC HEADER STYLING ---
    let headerColor = 'bg-red-950/20 border-red-500/30';
    let textColor = 'text-red-500';
    let StatusIcon = XCircle;
    let titleText = "Access Denied";

    if (ticketData?.success) {
        headerColor = 'bg-emerald-950/20 border-emerald-500/30';
        textColor = 'text-emerald-500';
        StatusIcon = CheckCircle;
        titleText = "Access Granted";
    } else if (ticketData?.isExpired || ticketData?.message?.toLowerCase().includes('past')) {
        headerColor = 'bg-gray-900/80 border-gray-500/50';
        textColor = 'text-gray-400';
        StatusIcon = Clock;
        titleText = "Ticket Expired";
    }

    return (
        <div className="pb-20 font-outfit text-white animate-fadeIn">
            
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Title text1="Access" text2="Control" />
                    <p className="text-gray-500 text-sm mt-1">Verify passes via Camera, Image Upload, or Manual ID.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 border border-emerald-500/20 px-3 py-1.5 rounded-lg bg-emerald-500/5">
                    <ShieldCheck size={14} className="text-emerald-500"/>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Auth Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: Input Methods */}
                <div className="lg:col-span-4 xl:col-span-5 space-y-4">
                    
                    {/* Primary Scanner Box */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                <Camera size={16} className="text-primary"/> Optical Scanner
                            </h3>
                            {isCameraActive && <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Active</span>}
                        </div>
                        
                        <div className="rounded-xl overflow-hidden bg-black aspect-square relative flex items-center justify-center border border-gray-800">
                            {/* The DOM element HTML5Qrcode attaches to */}
                            <div id="qr-reader" className="w-full h-full"></div>
                            
                            {/* Inactive Overlay */}
                            {!isCameraActive && !scanResult && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505] z-10 p-6 text-center">
                                    <CameraOff size={40} className="text-gray-700 mb-4"/>
                                    <p className="text-sm font-bold text-gray-400">Camera Offline</p>
                                    <p className="text-xs text-gray-600 mt-2">Start the camera or upload an image to verify a ticket.</p>
                                </div>
                            )}
                        </div>

                        {/* Scanner Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {isCameraActive ? (
                                <button onClick={stopCamera} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2">
                                    <CameraOff size={16}/> Stop Camera
                                </button>
                            ) : (
                                <button onClick={startCamera} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2">
                                    <Camera size={16}/> Start Camera
                                </button>
                            )}
                            
                            <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2">
                                <UploadCloud size={16}/> Upload Image
                            </button>
                            {/* Hidden file input */}
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 shadow-2xl">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                            <Keyboard size={16} className="text-gray-500"/> Manual Override
                        </h3>
                        <form onSubmit={handleManualSubmit} className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Enter Booking ID..." 
                                value={manualTicketId}
                                onChange={(e) => setManualTicketId(e.target.value)}
                                className="flex-1 bg-[#121212] border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-primary font-mono text-sm uppercase placeholder:text-gray-600 placeholder:font-sans transition-all"
                            />
                            <button type="submit" disabled={loading} className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-lg">
                                Verify
                            </button>
                        </form>
                    </div>
                </div>

                {/* RIGHT: Status Monitor */}
                <div className="lg:col-span-8 xl:col-span-7">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl h-full min-h-[500px] flex flex-col shadow-2xl overflow-hidden relative">
                        
                        {!scanResult && !loading && (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-40">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <QrCode size={40} className="text-gray-400"/>
                                </div>
                                <h2 className="text-xl font-bold text-gray-300 tracking-tight">System Ready</h2>
                                <p className="text-gray-500 text-sm mt-2 max-w-xs">Scan a QR code or enter an ID to instantly verify access.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="relative w-16 h-16 mb-6">
                                    <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
                                </div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Querying Database...</p>
                            </div>
                        )}

                        {ticketData && !loading && (
                            <div className="flex-1 flex flex-col">
                                
                                {/* Status Header Bar */}
                                <div className={`px-6 py-6 border-b flex items-center gap-5 ${headerColor}`}>
                                    <div className={`p-3 rounded-full bg-white/5 ${textColor}`}>
                                        <StatusIcon size={32} strokeWidth={2.5}/>
                                    </div>
                                    <div>
                                        <h2 className={`text-2xl font-black tracking-tight uppercase ${textColor}`}>
                                            {titleText}
                                        </h2>
                                        <p className="text-gray-300 text-sm mt-1 font-medium">{ticketData.message}</p>
                                    </div>
                                </div>

                                {/* Comprehensive User Data Grid */}
                                {ticketData.details && (
                                    <div className="p-6 flex flex-col flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white/[0.01] to-transparent">
                                        
                                        {/* Booking Details */}
                                        <div className="mb-6 pb-6 border-b border-white/5">
                                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Booking Details</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                                                <InfoItem icon={<Hash size={14}/>} label="Ticket ID" value={`TXN-${(scanResult || manualTicketId).slice(-8).toUpperCase()}`} valueColor="text-gray-300 font-mono" />
                                                <InfoItem icon={<Film size={14}/>} label="Feature Film" value={ticketData.details.movieTitle} valueColor="text-white font-bold" />
                                                <InfoItem icon={<Clock size={14}/>} label="Show Schedule" value={ticketData.details.showTime ? new Date(ticketData.details.showTime).toLocaleString([], {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : "N/A"} />
                                                <InfoItem icon={<User size={14}/>} label="Guest Name" value={ticketData.details.guestName || ticketData.details.user?.name || "Unknown"} />
                                            </div>
                                        </div>

                                        {/* Venue & Seats */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-2">
                                            <div className="bg-[#121212] border border-white/5 p-4 rounded-xl">
                                                <InfoItem icon={<TicketIcon size={14} className="text-primary"/>} label="Assigned Seats" value={ticketData.details.seats?.join(', ') || "N/A"} valueColor="text-white font-mono font-bold text-lg" />
                                            </div>
                                            <div className="bg-[#121212] border border-white/5 p-4 rounded-xl">
                                                <InfoItem icon={<CreditCard size={14}/>} label="Payment Info" value={ticketData.details.paymentMethod || "N/A"} />
                                            </div>
                                        </div>

                                        {/* Concessions */}
                                        {ticketData.details.snacks && ticketData.details.snacks.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-white/5">
                                                <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                    <Popcorn size={14}/> F&B Add-ons included
                                                </p>
                                                <div className="bg-yellow-500/5 rounded-xl border border-yellow-500/20 p-4 space-y-2">
                                                    {ticketData.details.snacks.map((snack, index) => (
                                                        <div key={index} className="flex justify-between items-center text-sm font-bold text-yellow-100">
                                                            <span>{snack.quantity || snack.qty}x {snack.snackId?.name || snack.name || "Snack Item"}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reset System Button */}
                                <div className="p-6 bg-[#050505] shrink-0 border-t border-white/5">
                                    <button onClick={resetSystem} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2">
                                        <RefreshCcw size={16}/> Clear & Verify Next Guest
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom CSS overrides to clean up html5-qrcode's injected video element */}
            <style>{`
                #qr-reader { border: none !important; border-radius: 0.75rem; overflow: hidden; }
                #qr-reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
            `}</style>
        </div>
    );
};

const InfoItem = ({ icon, label, value, valueColor = "text-gray-300" }) => (
    <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
            {icon} {label}
        </p>
        <p className={`text-sm ${valueColor} truncate`}>{value}</p>
    </div>
);

export default ScanTicket;