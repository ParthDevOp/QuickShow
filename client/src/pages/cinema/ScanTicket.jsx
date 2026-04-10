import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAppContext } from '../../context/AppContext';
import Title from '../../components/admin/Title';
import { 
    QrCode, CheckCircle, XCircle, User, Clock, Film, 
    Ticket as TicketIcon, Keyboard, RefreshCcw, ShieldCheck, 
    Camera, Hash, CreditCard, Popcorn, UploadCloud, CameraOff
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
    const [focusPoint, setFocusPoint] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [mediaStream, setMediaStream] = useState(null);
    const fileInputRef = useRef(null);

    // Cleanup scanner on component unmount
    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(t => t.stop());
            }
        };
    }, [mediaStream]);

    // Attach stream to video explicitly when it mounts
    useEffect(() => {
        if (isCameraActive && videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [isCameraActive, mediaStream]);

    // --- CUSTOM CAMERA LOGIC (MANUAL SNAPSHOT) ---
    const startCamera = async () => {
        try {
            setScanResult(null);
            setTicketData(null);

            // Fetch devices
            await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            if (videoDevices.length === 0) throw new Error("No cameras found");

            let stream;
            try {
                // Try back camera first with continuous auto-focus requesting
                stream = await navigator.mediaDevices.getUserMedia({ 
                     video: { 
                         facingMode: { exact: "environment" },
                         advanced: [{ focusMode: "continuous" }]
                     } 
                });
            } catch (e) {
                // Fallback to any camera without strict constraints
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            setMediaStream(stream);
            setIsCameraActive(true);
        } catch (err) {
            console.error(err);
            toast.error("Camera access denied.");
            setIsCameraActive(false);
        }
    };

    const handleTapToFocus = async (e) => {
        // Calculate tap position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setFocusPoint({ x, y });

        // Try to trigger hardware autofocus if supported
        if (mediaStream) {
            const track = mediaStream.getVideoTracks()[0];
            try {
                if (track.getCapabilities) {
                    const capabilities = track.getCapabilities();
                    if (capabilities.focusMode && capabilities.focusMode.includes('single-shot')) {
                        await track.applyConstraints({ advanced: [{ focusMode: "single-shot" }] });
                        // Revert back to continuous after snap
                        setTimeout(() => {
                            track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(()=>null);
                        }, 1000);
                    }
                }
            } catch (err) { /* Silent ignore if constraints fail */ }
        }

        // Hide UI focus marker after animation
        setTimeout(() => setFocusPoint(null), 1000);
    };

    const stopCamera = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(t => t.stop());
            setMediaStream(null);
        }
        setIsCameraActive(false);
    };

    const captureAndScan = () => {
         if (!videoRef.current || !canvasRef.current) return;
         const video = videoRef.current;
         const canvas = canvasRef.current;
         
         canvas.width = video.videoWidth;
         canvas.height = video.videoHeight;
         const ctx = canvas.getContext("2d");
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
         
         canvas.toBlob(async (blob) => {
              if (!blob) return;
              
              setLoading(true);
              const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
              const html5QrCode = new Html5Qrcode("qr-reader-hidden");
              try {
                  const decodedText = await html5QrCode.scanFile(file, true);
                  setScanResult(decodedText);
                  verifyTicket(decodedText);
                  stopCamera();
              } catch (e) {
                  toast.error("Target missed! Ensure the QR is clear and inside the frame.");
              } finally {
                  setLoading(false);
              }
         }, 'image/jpeg', 1.0);
    };

    // --- FILE UPLOAD LOGIC (Images) ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Stop camera if running
        if (isCameraActive) stopCamera();
        setLoading(true);

        try {
            const html5QrCode = new Html5Qrcode("qr-reader-hidden");
            const decodedText = await html5QrCode.scanFile(file, true);
            
            setScanResult(decodedText);
            verifyTicket(decodedText);
        } catch (err) {
            console.error(err);
            toast.error("No valid QR code found in this image.");
        } finally {
            setLoading(false);
        }
        
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
        <div className="pb-20 font-outfit text-white animate-fadeIn relative max-w-[1600px] mx-auto">
            {/* Ambient Glows */}
            <div className="fixed top-20 left-10 w-[40%] h-[400px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-10 right-20 w-[30%] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

            {/* Header Sub-Nav Style */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 bg-[#060606]/80 p-8 rounded-3xl border border-white/[0.04] backdrop-blur-2xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck fill="currentColor" size={12} className="text-emerald-500" />
                        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.25em]">Access Control Server</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Digital Scan Terminal</h2>
                    <p className="text-gray-400 text-sm flex items-center gap-2 font-medium bg-white/[0.03] inline-flex px-3.5 py-1.5 rounded-lg border border-white/[0.05] shadow-inner">
                        Verify entry passes via Optical Scanner or Manual Input
                    </p>
                </div>
                
                <div className="hidden md:flex items-center gap-2.5 border border-emerald-500/20 px-4 py-2.5 rounded-xl bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Auth Active</span>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* LEFT: Input Methods */}
                <div className="xl:col-span-5 space-y-6">
                    
                    {/* Primary Scanner Box */}
                    <div className="bg-[#060606]/80 backdrop-blur-xl border border-white/[0.04] rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20"><Camera size={16} className="text-emerald-500"/></div>
                                Optical Target
                            </h3>
                            {isCameraActive && <span className="flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em]"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div> Active</span>}
                        </div>
                        
                        <div 
                            className="rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-square relative flex items-center justify-center border border-white/10 shadow-inner group cursor-crosshair"
                            onClick={handleTapToFocus}
                        >
                            
                            {isCameraActive && (
                                <>
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover filter contrast-125 saturate-150 transform scale-105"></video>
                                    <canvas ref={canvasRef} className="hidden"></canvas>
                                    
                                    {/* Targeting Frame Overlay */}
                                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                        <div className="w-[65%] sm:w-[50%] aspect-square border-2 border-emerald-500/30 bg-emerald-500/5 rounded-2xl relative shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-[1px]">
                                            {/* Corner brackets */}
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-emerald-400 rounded-tl-2xl -translate-x-0.5 -translate-y-0.5 shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-emerald-400 rounded-tr-2xl translate-x-0.5 -translate-y-0.5 shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-emerald-400 rounded-bl-2xl -translate-x-0.5 translate-y-0.5 shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-emerald-400 rounded-br-2xl translate-x-0.5 translate-y-0.5 shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                                            
                                            {/* Scanning effect line */}
                                            <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,1)] animate-bounce" style={{ animationDuration: '3s' }}></div>
                                        </div>
                                    </div>

                                    {/* Capture Button Overlay */}
                                    <div className="absolute bottom-6 w-full flex justify-center z-20 pointer-events-none">
                                         <button onClick={(e) => { e.stopPropagation(); captureAndScan(); }} className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-4 rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_40px_rgba(16,185,129,1)] hover:shadow-[0_0_50px_rgba(16,185,129,1)] transition-all flex items-center gap-2 hover:scale-105 active:scale-95 border-2 border-emerald-200 pointer-events-auto">
                                             <Camera size={18}/> Target & Snap
                                         </button>
                                    </div>

                                    {/* Interactive Touch Focus Animation */}
                                    {focusPoint && (
                                        <div 
                                            className="absolute border border-yellow-400 rounded-sm animate-ping pointer-events-none z-30"
                                            style={{ 
                                                left: focusPoint.x - 30, top: focusPoint.y - 30, 
                                                width: 60, height: 60,
                                                animationDuration: '0.5s'
                                            }}
                                        >
                                            <div className="w-full h-full border border-yellow-400/50 scale-50"></div>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {/* Hidden element for File Scanning */}
                            <div id="qr-reader-hidden" className="hidden"></div>
                            
                            {/* Inactive Overlay */}
                            {!isCameraActive && !scanResult && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#010101]/90 z-10 p-6 text-center backdrop-blur-sm">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                                        <CameraOff size={32} className="text-gray-600"/>
                                    </div>
                                    <p className="text-lg font-black text-gray-300 tracking-tight">Camera Offline</p>
                                    <p className="text-sm font-medium text-gray-500 mt-2 max-w-xs">Initialize optical array and snap a picture of the guest's pass.</p>
                                </div>
                            )}
                        </div>

                        {/* Scanner Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {isCameraActive ? (
                                <button onClick={stopCamera} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex justify-center items-center gap-2.5 shadow-inner">
                                    <CameraOff size={16}/> Terminate
                                </button>
                            ) : (
                                <button onClick={startCamera} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex justify-center items-center gap-2.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-400/50">
                                    <Camera size={16}/> Initialize Camera
                                </button>
                            )}
                            
                            <button onClick={() => fileInputRef.current?.click()} className="bg-[#121212] border border-white/5 hover:border-white/10 hover:bg-white/5 text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex justify-center items-center gap-2.5 shadow-lg">
                                <UploadCloud size={16} className="text-blue-400"/> Upload Frame
                            </button>
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <div className="bg-[#060606]/80 backdrop-blur-xl border border-white/[0.04] rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-blue-500/50 to-transparent"></div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-5 flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20"><Keyboard size={16} className="text-blue-500"/></div>
                            Manual Override
                        </h3>
                        <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                placeholder="Enter Transaction ID..." 
                                value={manualTicketId}
                                onChange={(e) => setManualTicketId(e.target.value)}
                                className="flex-1 bg-[#121212] border border-white/10 text-white px-5 py-4 rounded-xl outline-none focus:border-blue-500/50 font-mono text-sm uppercase placeholder:text-gray-600 placeholder:font-sans transition-all shadow-inner"
                            />
                            <button type="submit" disabled={loading} className="bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.2)] whitespace-nowrap">
                                Execute
                            </button>
                        </form>
                    </div>
                </div>

                {/* RIGHT: Status Monitor */}
                <div className="xl:col-span-7">
                    <div className="bg-[#060606]/80 backdrop-blur-2xl border border-white/[0.04] rounded-3xl h-full min-h-[600px] flex flex-col shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-[50%] h-[1px] bg-gradient-to-l from-transparent via-white/20 to-transparent"></div>
                        
                        {!scanResult && !loading && (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                <div className="w-32 h-32 bg-white/[0.02] rounded-full flex items-center justify-center mb-8 border border-white/[0.05] shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]">
                                    <QrCode size={56} className="text-gray-700"/>
                                </div>
                                <h2 className="text-3xl font-black text-gray-300 tracking-tight mb-2">Systems Ready</h2>
                                <p className="text-gray-500 text-sm font-medium max-w-sm">Capture a secured QR code or initiate a manual override to instantly verify guest access.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex-1 flex flex-col items-center justify-center bg-black/40">
                                <div className="relative w-20 h-20 mb-8">
                                    <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                                </div>
                                <p className="text-emerald-500 text-xs font-black uppercase tracking-[0.25em] animate-pulse">Processing Frame...</p>
                            </div>
                        )}

                        {ticketData && !loading && (
                            <div className="flex-1 flex flex-col h-full animate-fadeIn">
                                
                                {/* Status Header Bar */}
                                <div className={`px-8 py-8 border-b flex items-center gap-6 ${headerColor}`}>
                                    <div className={`p-4 rounded-2xl bg-white/5 border shadow-inner border-current ${textColor}`}>
                                        <StatusIcon size={40} strokeWidth={2.5}/>
                                    </div>
                                    <div>
                                        <h2 className={`text-3xl font-black tracking-tight uppercase ${textColor} drop-shadow-md`}>
                                            {titleText}
                                        </h2>
                                        <p className="text-gray-200 text-sm mt-1.5 font-medium">{ticketData.message}</p>
                                    </div>
                                </div>

                                {/* Comprehensive User Data Grid */}
                                {ticketData.details && (
                                    <div className="p-8 flex flex-col flex-1 overflow-y-auto custom-scrollbar bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)]">
                                        
                                        {/* Booking Details */}
                                        <div className="mb-8 pb-8 border-b border-white/[0.05]">
                                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-5 flex items-center gap-2"><Film size={14}/> Encrypted Payload</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
                                                <InfoItem icon={<Hash size={14}/>} label="Signature" value={`TXN-${(scanResult || manualTicketId).slice(-8).toUpperCase()}`} valueColor="text-gray-300 font-mono tracking-wider" />
                                                <InfoItem icon={<Film size={14}/>} label="Digital Print" value={ticketData.details.movieTitle} valueColor="text-white font-bold" />
                                                <InfoItem icon={<Clock size={14}/>} label="Show Window" value={ticketData.details.showTime ? new Date(ticketData.details.showTime).toLocaleString([], {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : "N/A"} />
                                                <InfoItem icon={<User size={14}/>} label="Identify" value={ticketData.details.guestName || ticketData.details.user?.name || "Unknown Identity"} />
                                            </div>
                                        </div>

                                        {/* Venue & Seats */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
                                            <div className="bg-[#111] border border-white/[0.05] p-5 rounded-2xl shadow-inner relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2"></div>
                                                <InfoItem icon={<TicketIcon size={14} className="text-blue-500"/>} label="Allocation Map" value={ticketData.details.seats?.join(', ') || "N/A"} valueColor="text-white font-mono font-black text-xl lg:text-2xl mt-1 tracking-wider" />
                                            </div>
                                            <div className="bg-[#111] border border-white/[0.05] p-5 rounded-2xl shadow-inner relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl transform translate-x-1/2 -translate-y-1/2"></div>
                                                <InfoItem icon={<CreditCard size={14} className="text-emerald-500"/>} label="Fiscal Route" value={ticketData.details.paymentMethod || "N/A"} valueColor="text-emerald-400 font-bold" />
                                            </div>
                                        </div>

                                        {/* Concessions */}
                                        {ticketData.details.snacks && ticketData.details.snacks.length > 0 && (
                                            <div className="mt-8 pt-8 border-t border-white/[0.05]">
                                                <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                                    <Popcorn size={14}/> F&B Pre-Orders Detected
                                                </p>
                                                <div className="bg-yellow-500/[0.05] rounded-2xl border border-yellow-500/20 p-5 space-y-3">
                                                    {ticketData.details.snacks.map((snack, index) => (
                                                        <div key={index} className="flex justify-between items-center text-sm font-bold text-yellow-100/90 border-b border-yellow-500/10 pb-2 last:border-0 last:pb-0">
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-6 h-6 bg-yellow-500/20 rounded flex items-center justify-center text-yellow-500 text-xs">{snack.quantity || snack.qty}x</span>
                                                                <span>{snack.snackId?.name || snack.name || "Snack Item"}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reset System Button */}
                                <div className="p-6 bg-[#030303] shrink-0 border-t border-white/[0.05] z-10 bottom-0 relative">
                                    <button onClick={resetSystem} className="w-full py-4.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3 shadow-lg">
                                        <RefreshCcw size={16}/> Clear & Standby Next Pass
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ icon, label, value, valueColor = "text-gray-400 font-medium" }) => (
    <div>
        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-1.5 opacity-80">
            {icon} {label}
        </p>
        <p className={`text-base ${valueColor} truncate pt-1`}>{value}</p>
    </div>
);

export default ScanTicket;