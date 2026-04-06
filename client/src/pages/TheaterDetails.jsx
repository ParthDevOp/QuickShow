import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Film, Star, ArrowLeft, Calendar, Navigation, PlayCircle, CalendarClock, X, CheckCircle, Info, Smartphone, Coffee } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import ReactPlayer from 'react-player/youtube'

const TheaterDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { axios, userLocation, manualCity, setShowLocationModal } = useAppContext()
    
    const [theater, setTheater] = useState(null)
    const [movies, setMovies] = useState([]) 
    const [loading, setLoading] = useState(true)
    
    // New Feature States
    const [activeTab, setActiveTab] = useState('Now Playing')
    const [activeTrailer, setActiveTrailer] = useState(null) 

    // Standard high-res image helper
    const getHighResImage = (url) => {
        if (!url) return '';
        if (url.includes('image.tmdb.org')) return url.replace(/\/w\d+\//, '/original/');
        return url;
    }

    // --- GOOGLE MAPS PHOTO INTEGRATION ---
    const getGoogleMapsPhoto = (theaterObj) => {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 
        if (!apiKey || apiKey === "YOUR_API_KEY") {
            return `https://images.unsplash.com/photo-1517604401870-d372199ede4a?auto=format&fit=crop&w=1600&q=80`;
        }
        const locationQuery = encodeURIComponent(`${theaterObj.name}, ${theaterObj.address}, ${theaterObj.city}`);
        return `https://maps.googleapis.com/maps/api/streetview?size=1600x600&location=${locationQuery}&fov=90&heading=235&pitch=10&key=${apiKey}`;
    }

    // --- GET DIRECTIONS LOGIC ---
    const handleGetDirections = () => {
        if (!theater) return;
        const query = encodeURIComponent(`${theater.name}, ${theater.address}, ${theater.city}`);
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
    };

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true)
            try {
                const res = await axios.get(`/api/theaters/${id}`)
                if (res.data.success) {
                    setTheater(res.data.theater)
                } else {
                    toast.error("Failed to load theater details.");
                    navigate('/theaters');
                    return;
                }

                const showRes = await axios.get(`/api/theaters/movies/${id}`)
                if (showRes.data.success) {
                    const fetchedMovies = showRes.data.movies;
                    if (Array.isArray(fetchedMovies)) {
                        const validMovies = fetchedMovies.filter(m => m !== null && m !== undefined);
                        setMovies(validMovies);
                    } else {
                        setMovies([]);
                    }
                }
            } catch (error) { 
                console.error("Error fetching theater data:", error) 
                toast.error("Something went wrong.");
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [id, axios, navigate])

    // --- AUTOMATIC DATE SORTING LOGIC ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    const displayedMovies = movies.filter(movie => {
        if (!movie.release_date) return activeTab === 'Now Playing'; // Fallback
        const releaseDate = new Date(movie.release_date);
        
        if (activeTab === 'Now Playing') {
            return releaseDate <= today; 
        } else {
            return releaseDate > today; 
        }
    });

    if (loading) return <TheaterSkeleton />;

    if (!theater) return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
            <h2 className="text-2xl font-bold mb-4">Theater Not Found</h2>
            <button onClick={() => navigate('/theaters')} className="text-primary hover:underline">
                Return to Theaters
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] font-outfit pb-20 animate-fadeIn">
            
            {/* 1. CINEMATIC HEADER (Using Google Maps Street View) */}
            <div className="h-[55vh] relative overflow-hidden group">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-[10000ms] ease-linear"
                    style={{ backgroundImage: `url(${getGoogleMapsPhoto(theater)})` }}
                ></div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 to-transparent"></div>
                
                <button 
                    onClick={() => navigate('/theaters')}
                    className="absolute top-28 left-6 md:left-16 flex items-center gap-2 text-white bg-black/40 hover:bg-white hover:text-black px-5 py-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all z-10 font-bold text-sm shadow-lg"
                >
                    <ArrowLeft size={16}/> Back to Theaters
                </button>

                <div className="absolute bottom-12 px-6 md:px-16 lg:px-36 w-full animate-slideUp">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-black uppercase tracking-widest backdrop-blur-sm flex items-center gap-1.5">
                            <CheckCircle size={12}/> Verified Partner
                        </div>
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm flex items-center gap-1.5">
                            <Smartphone size={12}/> M-Ticket Enabled
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tighter drop-shadow-2xl">
                        {theater.name}
                    </h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-gray-300">
                        <span className="flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl border border-white/10 font-medium shadow-inner backdrop-blur-md max-w-xl line-clamp-2">
                            <MapPin size={18} className="text-primary shrink-0"/> {theater.address}, {theater.city} {theater.pincode && `- ${theater.pincode}`}
                        </span>
                        
                        <button 
                            onClick={handleGetDirections}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-95 w-fit"
                        >
                            <Navigation size={16} /> Get Directions
                        </button>
                    </div>

                    {theater.facilities && theater.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-6">
                            {theater.facilities.map((f, i) => (
                                <span key={i} className="text-[10px] font-bold uppercase tracking-widest bg-white/5 text-gray-300 px-3 py-2 rounded-lg border border-gray-700 backdrop-blur-sm flex items-center gap-1.5">
                                    {f.toLowerCase().includes('food') || f.toLowerCase().includes('beverage') ? <Coffee size={12} className="text-orange-400"/> : null}
                                    {f}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2. DYNAMIC MOVIES HUB */}
            <div className="px-6 md:px-16 lg:px-36 py-16">
                
                {/* Header & Tabs */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 border-b border-gray-800 pb-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-black text-white flex items-center gap-4 mb-2">
                            <Film className="text-primary" size={32}/> Theater Roster
                        </h2>
                        <p className="text-gray-500 text-sm font-medium">Browse movies currently scheduled for this specific venue.</p>
                    </div>

                    {/* Premium Interactive Tabs */}
                    <div className="bg-[#121212] p-1.5 rounded-2xl flex items-center w-fit border border-gray-800 shadow-xl">
                        {['Now Playing', 'Coming Soon'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                                    activeTab === tab 
                                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-md border border-gray-600' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {tab === 'Coming Soon' ? <CalendarClock size={16}/> : <Film size={16}/>}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Movie Grid */}
                {displayedMovies.length === 0 ? (
                    <div className="text-center py-24 bg-[#0a0a0a] rounded-[2rem] border border-gray-800 border-dashed animate-fadeIn">
                        {activeTab === 'Coming Soon' ? (
                            <CalendarClock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        ) : (
                            <Film className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        )}
                        <p className="text-gray-300 font-bold text-xl">No {activeTab.toLowerCase()} movies found.</p>
                        <p className="text-gray-600 text-sm mt-2 max-w-md mx-auto">This theater doesn't have any shows scheduled for this category right now. Check back later!</p>
                        <button onClick={() => navigate('/')} className="mt-6 bg-white/5 hover:bg-white/10 border border-gray-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">
                            Explore Other Theaters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8 animate-fadeIn">
                        {displayedMovies.map(movie => (
                            <div key={movie._id} className="group relative flex flex-col transition-all duration-500 hover:-translate-y-2">
                                
                                <div className="relative aspect-[2/3] rounded-3xl overflow-hidden bg-[#121212] border border-gray-800 shadow-xl group-hover:shadow-[0_10px_30px_rgba(248,69,101,0.2)] group-hover:border-primary/50 transition-all">
                                    <img 
                                        src={getHighResImage(movie.poster_path)} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                        alt={movie.title || "Movie Poster"} 
                                        loading="lazy"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400x600?text=No+Image' }}
                                    />
                                    
                                    {/* Badges */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 text-right items-end">
                                        {movie.vote_average ? (
                                            <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10 shadow-lg">
                                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-[10px] font-black text-white">
                                                    {Number(movie.vote_average).toFixed(1)}
                                                </span>
                                            </div>
                                        ) : null}
                                        
                                        {/* Trailer Quick Action Button */}
                                        {movie.trailer_url && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveTrailer(movie.trailer_url); }}
                                                className="bg-white/10 hover:bg-primary backdrop-blur-md px-2 py-2 rounded-full border border-white/20 shadow-lg transition-colors group/play"
                                                title="Watch Trailer"
                                            >
                                                <PlayCircle size={16} className="text-white group-hover/play:scale-110 transition-transform" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
                                        <button 
                                            onClick={() => navigate(`/movies/${movie._id}`)}
                                            className={`w-full py-3 text-white text-xs font-black rounded-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg
                                                ${activeTab === 'Coming Soon' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-500' : 'bg-primary hover:bg-rose-600'}`}
                                        >
                                            {activeTab === 'Coming Soon' ? 'Pre-Book Now' : 'View Showtimes'}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Info Footer */}
                                <h3 className="text-white font-bold text-sm mt-4 truncate group-hover:text-primary transition-colors">{movie.title || "Unknown Title"}</h3>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                        {movie.languages && movie.languages.length > 0 ? movie.languages[0] : 'Hindi'}
                                    </p>
                                    <p className="text-gray-600 text-[10px] font-bold">
                                        {new Date(movie.release_date).getFullYear()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. CINEMATIC TRAILER MODAL */}
            {activeTrailer && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-fadeIn">
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <button 
                            onClick={() => setActiveTrailer(null)} 
                            className="absolute top-6 right-6 z-10 bg-black/60 hover:bg-rose-600 text-white p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg active:scale-90"
                        >
                            <X size={24} strokeWidth={2.5}/>
                        </button>
                        <ReactPlayer url={activeTrailer} width="100%" height="100%" playing={true} controls={true} />
                    </div>
                </div>
            )}
        </div>
    )
}

// --- SKELETON LOADER ---
const TheaterSkeleton = () => (
    <div className="min-h-screen bg-[#050505] font-outfit pb-20">
        <div className="h-[55vh] w-full bg-gray-900 animate-pulse relative">
            <div className="absolute bottom-12 px-6 md:px-16 lg:px-36 w-full space-y-4">
                <div className="h-6 w-32 bg-gray-800 rounded-full"></div>
                <div className="h-16 w-3/4 max-w-2xl bg-gray-800 rounded-2xl"></div>
                <div className="h-12 w-full max-w-xl bg-gray-800 rounded-xl"></div>
            </div>
        </div>
        <div className="px-6 md:px-16 lg:px-36 py-16 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-12">
                <div className="space-y-3">
                    <div className="h-10 w-48 bg-gray-800 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-800 rounded animate-pulse"></div>
                </div>
                <div className="h-12 w-64 bg-gray-800 rounded-2xl animate-pulse"></div>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10'>
                {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="flex flex-col gap-3">
                        <div className="w-full aspect-[2/3] bg-gray-800 animate-pulse rounded-3xl"></div>
                        <div className="h-4 w-3/4 bg-gray-800 animate-pulse rounded mt-2"></div>
                        <div className="h-3 w-1/2 bg-gray-800 animate-pulse rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default TheaterDetails