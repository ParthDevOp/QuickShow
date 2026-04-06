import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { Calendar, MapPin, Clock, Info, Languages, MonitorPlay, PlayCircle, Filter, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactPlayer from 'react-player/youtube'

const Movie = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    
    const { axios, userLocation, manualCity, setShowLocationModal } = useAppContext()
    
    const [movie, setMovie] = useState(null)
    const [theaters, setTheaters] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchMode, setSearchMode] = useState("") 
    
    // UI States
    const [showTrailer, setShowTrailer] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [filterTheaterId, setFilterTheaterId] = useState("ALL")
    
    // Generate Next 7 Days
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d
    })

    // --- SMART IMAGE UPSCALER ---
    const getHighResImage = (url) => {
        if (!url) return '';
        if (url.includes('image.tmdb.org')) return url.replace(/\/w\d+\//, '/original/');
        return url;
    }

    // 1. Fetch Movie Info
    useEffect(() => {
        const fetchMovie = async () => {
            try {
                const { data } = await axios.get(`/api/show/${id}`)
                if (data.success) {
                    setMovie(data.movie)
                } else {
                    toast.error("Movie not found");
                    navigate('/')
                }
            } catch (err) { 
                console.error(err) 
                navigate('/')
            }
        }
        fetchMovie()
    }, [id, axios, navigate])

    // 2. Fetch Showtimes
    useEffect(() => {
        const fetchShows = async () => {
            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const params = new URLSearchParams({
                    date: dateStr,
                    city: manualCity || userLocation?.city || "",
                });

                if (userLocation?.lat) {
                    params.append('lat', userLocation.lat);
                    params.append('long', userLocation.long);
                }

                const { data } = await axios.get(`/api/show/showtimes/${id}?${params.toString()}`)
                
                if (data.success) {
                    setTheaters(data.theaters)
                    setSearchMode(data.mode) 
                    setFilterTheaterId("ALL") // Reset filter when date changes
                }
                
            } catch (err) { 
                console.error(err) 
            } finally { 
                setLoading(false) 
            }
        }
        
        if (movie) {
            setLoading(true); 
            fetchShows();
        }
    }, [movie, selectedDate, userLocation, manualCity, axios, id])

    // --- LOGIC FIX: Filter Out Past Shows ---
    const now = new Date();
    const activeTheaters = theaters.map(item => {
        // Only keep showtimes that are strictly in the future
        const validShows = item.shows.filter(showSlot => {
            return new Date(showSlot.time) > now;
        });
        return { ...item, shows: validShows };
    }).filter(item => item.shows.length > 0); // Remove theater if all shows passed

    // --- THEATER FILTERING LOGIC ---
    const uniqueTheaters = activeTheaters.map(t => t.theater);
    const displayedTheaters = filterTheaterId === "ALL" 
        ? activeTheaters 
        : activeTheaters.filter(t => t.theater._id === filterTheaterId);

    const currentActiveCity = manualCity || userLocation?.city || "Select Location";

    // Show Full Skeleton on initial load
    if (loading && !movie) return <MovieSkeleton />

    return (
        <div className='min-h-screen bg-[#050505] pb-20 font-outfit animate-fadeIn'>
            
            {/* --- PREMIUM SPLIT MOVIE BANNER --- */}
            <div className="relative w-full h-[500px] lg:h-[600px] overflow-hidden bg-[#050505]">
                
                {/* Ambient Blurred Background */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 transition-transform duration-[7000ms] ease-linear"
                    style={{ backgroundImage: `url(${getHighResImage(movie?.backdrop_path || movie?.poster_path)})` }}
                ></div>
                
                {/* Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/20"></div>

                <div className='relative z-20 h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-16 gap-8 pt-20 md:pt-0'>
                    
                    {/* Left Content */}
                    <div className="w-full md:w-3/5 lg:w-1/2 animate-slideUp">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-2xl tracking-tight leading-[1.1]">
                            {movie?.title}
                        </h1>
                        
                        <div className="flex flex-wrap gap-3 mb-6">
                            {movie?.languages && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20 uppercase tracking-wider">
                                    <Languages size={14}/> {Array.isArray(movie.languages) ? movie.languages.join(', ') : movie.languages}
                                </span>
                            )}
                            {movie?.formats && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/20 uppercase tracking-wider">
                                    <MonitorPlay size={14}/> {Array.isArray(movie.formats) ? movie.formats.join(', ') : movie.formats}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary rounded-lg text-xs font-bold text-white shadow-[0_0_15px_rgba(248,69,101,0.4)]">
                                <Clock size={14}/> {movie?.runtime} Min
                            </span>
                        </div>

                        <p className="text-gray-300 text-sm md:text-base max-w-xl leading-relaxed line-clamp-3 md:line-clamp-4 mb-8">
                            {movie?.overview}
                        </p>

                        {movie?.trailer_url && (
                            <button onClick={() => setShowTrailer(true)} className="flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)] w-fit">
                                <PlayCircle className="w-5 h-5 fill-black text-black" /> Watch Trailer
                            </button>
                        )}
                    </div>

                    {/* Right Vertical Poster */}
                    <div className="hidden md:block w-2/5 lg:w-1/3 perspective-1000 animate-fadeIn">
                        <div className="relative w-full max-w-[280px] mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 transform rotate-y-[-10deg] hover:rotate-y-0 transition-transform duration-500">
                            <img 
                                src={getHighResImage(movie?.poster_path)} 
                                alt={movie?.title} 
                                className="w-full h-auto object-cover"
                                style={{ imageRendering: 'high-quality' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-16 mt-8">
                
                {/* --- DATE SELECTOR --- */}
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Calendar className="text-primary"/> Select Date
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mask-fade-edges">
                    {dates.map((date, index) => {
                        const isSelected = selectedDate.toDateString() === date.toDateString();
                        return (
                            <button 
                                key={index} 
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center min-w-[70px] p-3 rounded-2xl border transition-all duration-300 transform active:scale-95 shrink-0
                                ${isSelected 
                                    ? 'bg-gradient-to-br from-primary to-rose-600 border-rose-500 text-white shadow-[0_5px_15px_rgba(248,69,101,0.3)] -translate-y-1' 
                                    : 'bg-[#121212] border-gray-800 text-gray-400 hover:border-gray-600 hover:bg-[#1a1a1a]'}`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-2xl font-black mt-1">{date.getDate()}</span>
                                <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-rose-200' : 'text-gray-600'}`}>
                                    {date.toLocaleDateString('en-US', { month: 'short' })}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* --- THEATERS & SHOWS LIST --- */}
                <div className="mt-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 border-b border-gray-800 pb-6">
                        <div>
                            <h2 className="text-white font-bold text-3xl mb-2">Theaters Nearby</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin size={16} className="text-primary"/>
                                <span>Showing results for <span className="font-bold text-white">{currentActiveCity}</span></span>
                                <button onClick={()=>setShowLocationModal(true)} className="text-primary hover:text-rose-400 font-bold ml-2 transition-colors">Change</button>
                            </div>
                        </div>

                        {/* THEATER FILTER DROPDOWN */}
                        {uniqueTheaters.length > 0 && (
                            <div className="relative group min-w-[240px]">
                                <div className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-700 px-4 py-3 rounded-xl cursor-pointer hover:border-gray-500 transition-colors shadow-inner">
                                    <Filter size={16} className="text-gray-400 group-hover:text-white transition-colors"/>
                                    <select 
                                        value={filterTheaterId} 
                                        onChange={(e)=>setFilterTheaterId(e.target.value)}
                                        className="bg-transparent text-sm font-bold text-white outline-none w-full appearance-none cursor-pointer focus:ring-0"
                                    >
                                        <option value="ALL" className="bg-[#121212] text-white">All Theaters in {currentActiveCity}</option>
                                        {uniqueTheaters.map(t => (
                                            <option key={t._id} value={t._id} className="bg-[#121212] text-white">{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="text-white absolute right-4 pointer-events-none"/>
                                </div>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-5 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-40 bg-[#121212] border border-gray-800 rounded-3xl"></div>
                            ))}
                        </div>
                    ) : displayedTheaters.length > 0 ? (
                        <div className="space-y-5">
                            {displayedTheaters.map((item) => (
                                <div key={item.theater._id} className="bg-[#121212] border border-gray-800/80 rounded-3xl p-6 md:p-8 hover:border-gray-700 hover:shadow-2xl transition-all duration-300">
                                    
                                    {/* Theater Header */}
                                    <div className="flex flex-col md:flex-row justify-between mb-6 border-b border-gray-800 pb-6">
                                        <div>
                                            <h3 className="text-white font-black text-xl flex items-center gap-2">
                                                {item.theater.name} 
                                                <span className="text-[10px] bg-white/10 px-2 py-1 rounded-md text-gray-300 font-bold uppercase tracking-wider border border-gray-700">
                                                    {item.theater.city}
                                                </span>
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-2">{item.theater.address}</p>
                                        </div>
                                    </div>

                                    {/* Showtimes Grid */}
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
                                        {item.shows.map((showSlot, sIdx) => {
                                            const time = new Date(showSlot.time);
                                            
                                            // Payload expected by Checkout & SeatLayout
                                            const fullShowData = {
                                                _id: showSlot.showId || showSlot._id,
                                                movie: movie, 
                                                theater: item.theater, 
                                                showDateTime: showSlot.time || showSlot.showDateTime,
                                                ticketPrice: showSlot.price || showSlot.ticketPrice, 
                                                language: movie.languages?.[0] || "Hindi",
                                                format: showSlot.format
                                            };

                                            return (
                                                <button 
                                                    key={sIdx} 
                                                    onClick={() => navigate(`/book-seats/${fullShowData._id}`, { state: { show: fullShowData } })} 
                                                    className="group relative flex flex-col items-center justify-center py-3.5 rounded-xl border border-gray-700 bg-[#1a1a1a] hover:bg-primary/10 hover:border-primary transition-all duration-300 active:scale-95 shadow-inner hover:shadow-[0_0_15px_rgba(248,69,101,0.2)]"
                                                >
                                                    <span className="text-primary font-black text-base sm:text-lg group-hover:text-rose-400 transition-colors">
                                                        {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 mt-1 tracking-wider group-hover:text-gray-300 transition-colors">
                                                        {showSlot.format}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#121212] border border-gray-800 rounded-3xl p-16 text-center shadow-xl animate-fadeIn">
                            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Info size={32} className="text-gray-500"/>
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">No shows available</h3>
                            <p className="text-gray-400 max-w-md mx-auto">
                                We couldn't find any future screenings for this date in <span className="text-white font-bold">{currentActiveCity}</span>. Try selecting another date.
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* Trailer Modal */}
            {showTrailer && movie?.trailer_url && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-fadeIn">
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <button onClick={() => setShowTrailer(false)} className="absolute top-6 right-6 z-10 bg-black/60 hover:bg-rose-600 text-white p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg active:scale-90">
                            <X size={24} strokeWidth={2.5}/>
                        </button>
                        <ReactPlayer url={movie.trailer_url} width="100%" height="100%" playing={true} controls={true} />
                    </div>
                </div>
            )}
        </div>
    )
}

// --- SKELETON LOADER COMPONENT ---
const MovieSkeleton = () => (
    <div className="min-h-screen bg-[#050505] font-outfit pb-20">
        <div className="h-[500px] lg:h-[600px] w-full bg-[#0a0a0a] animate-pulse relative border-b border-gray-800">
            <div className="absolute bottom-12 left-6 md:left-16 max-w-2xl w-full space-y-4">
                <div className="h-16 w-3/4 bg-gray-800 rounded-2xl"></div>
                <div className="flex gap-3">
                    <div className="h-8 w-20 bg-gray-800 rounded-lg"></div>
                    <div className="h-8 w-24 bg-gray-800 rounded-lg"></div>
                    <div className="h-8 w-24 bg-gray-800 rounded-lg"></div>
                </div>
                <div className="h-24 w-full bg-gray-800 rounded-xl mt-4"></div>
            </div>
            <div className="hidden md:block absolute bottom-12 right-16 w-1/3 h-96 bg-gray-800 rounded-3xl transform rotate-y-[-10deg]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-16 mt-8">
            <div className="h-6 w-40 bg-gray-800 rounded mb-4 animate-pulse"></div>
            <div className="flex gap-3 mb-10 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-[84px] min-w-[70px] bg-gray-800 rounded-2xl animate-pulse shrink-0"></div>)}
            </div>
            <div className="space-y-5">
                {[1, 2].map(i => (
                    <div key={i} className="h-44 bg-[#121212] border border-gray-800 rounded-3xl animate-pulse"></div>
                ))}
            </div>
        </div>
    </div>
);

export default Movie