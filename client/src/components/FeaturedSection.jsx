import { ArrowRight, Filter, MapPin, XCircle, Film, CalendarClock } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import MovieCard from './MovieCard'

const FeaturedSection = () => {
    const navigate = useNavigate()
    const { axios, manualCity, userLocation, setManualCity, setUserLocation } = useAppContext()
    
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchMode, setSearchMode] = useState("") 
    const [activeTab, setActiveTab] = useState('Now Showing')
    const [filterLang, setFilterLang] = useState('All')

    const languages = ["All", "Hindi", "English", "Tamil", "Telugu", "Malayalam"]

    const fetchMovies = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams();
            
            const cityQuery = manualCity || userLocation.city;
            if (cityQuery && cityQuery !== "Select City") {
                params.append('city', cityQuery);
            }

            if (userLocation?.lat) {
                params.append('lat', userLocation.lat);
                params.append('long', userLocation.long);
            }

            // Make sure your backend sends ALL scheduled movies here, not just past ones!
            const { data } = await axios.get(`/api/show/now-playing?${params.toString()}`)
            
            if (data.success) {
                setMovies(data.movies || []);
                setSearchMode(data.mode); 
            }
        } catch (error) { 
            console.error(error) 
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { 
        fetchMovies() 
    }, [manualCity, userLocation])

    const clearLocation = () => {
        setManualCity("");
        setUserLocation({ city: "Select City", lat: null, long: null });
        localStorage.removeItem('quickshow_location');
    }

    // --- AUTOMATIC DATE SORTING LOGIC ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to midnight for an exact day match

    // First, filter based on the Active Tab (Date Logic)
    const dateFilteredMovies = movies.filter(movie => {
        const releaseDate = new Date(movie.release_date);
        
        if (activeTab === 'Now Showing') {
            return releaseDate <= today; // Movie is already out
        } else if (activeTab === 'Coming Soon') {
            return releaseDate > today; // Movie is in the future
        }
        return true;
    });

    // Then, apply the Language Filter to the sorted list
    const displayedMovies = dateFilteredMovies.filter(movie => {
        if (filterLang === 'All') return true;
        return movie.languages?.some(l => l.toLowerCase() === filterLang.toLowerCase());
    });

    // --- SKELETON LOADER ---
    // Replaces the jarring spinner with a smooth, layout-preserving shimmer effect
    if (loading) {
        return (
            <div className='px-4 md:px-16 lg:px-36 py-16 bg-[#050505] min-h-screen font-outfit'>
                <div className="max-w-7xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                        <div className="space-y-4">
                            <div className="h-10 w-64 bg-gray-800 animate-pulse rounded-lg"></div>
                            <div className="h-6 w-40 bg-gray-800 animate-pulse rounded-lg"></div>
                        </div>
                        <div className="h-12 w-64 bg-gray-800 animate-pulse rounded-2xl"></div>
                    </div>

                    {/* Filter Chips Skeleton */}
                    <div className="flex gap-3 mb-10 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-10 w-24 shrink-0 bg-gray-800 animate-pulse rounded-xl"></div>
                        ))}
                    </div>

                    {/* Movie Grid Skeleton */}
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10'>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                            <div key={item} className="flex flex-col gap-3">
                                <div className="w-full aspect-[2/3] bg-gray-800 animate-pulse rounded-3xl border border-gray-700/50"></div>
                                <div className="h-4 w-3/4 bg-gray-800 animate-pulse rounded mt-2"></div>
                                <div className="h-3 w-1/2 bg-gray-800 animate-pulse rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='px-4 md:px-16 lg:px-36 py-16 bg-[#050505] min-h-screen font-outfit'>
            
            <div className="max-w-7xl mx-auto">
                {/* --- HEADER & TABS --- */}
                <div className='flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10'>
                    
                    {/* Left: Title & Location */}
                    <div>
                        <h2 className='text-3xl md:text-5xl font-black text-white mb-3 tracking-tight flex items-center gap-3'>
                            <Film className="text-primary hidden sm:block" size={36} /> Featured Movies
                        </h2>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                            <p className="text-gray-400 text-sm font-medium mr-2">Watch the latest releases</p>
                            
                            {searchMode && (
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 shadow-sm
                                    ${searchMode === "All Locations" 
                                        ? 'bg-gray-900 text-gray-300 border-gray-800' 
                                        : 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(248,69,101,0.2)]'
                                    }`}
                                >
                                    <MapPin size={14}/> 
                                    {searchMode === "All Locations" ? "All Locations" : `Results for: ${searchMode}`}
                                    
                                    {!searchMode.includes('All Locations') && (
                                        <button onClick={clearLocation} className="hover:text-white transition-colors ml-1" title="Clear Location Filter">
                                            <XCircle size={14}/>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Premium Tabs */}
                    <div className="bg-[#121212] p-1.5 rounded-2xl flex items-center w-fit border border-gray-800 shadow-xl">
                        {['Now Showing', 'Coming Soon'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setFilterLang('All'); }} // Reset language when switching tabs
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                    activeTab === tab 
                                    ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white shadow-md border border-gray-600' 
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="animate-fadeIn">
                    
                    {/* Language Filter Chips */}
                    <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-4 scrollbar-hide mask-fade-edges">
                        <div className="flex items-center gap-2 text-gray-500 text-sm font-bold uppercase tracking-wider mr-2 whitespace-nowrap">
                            <Filter size={16} /> Filters:
                        </div>
                        {languages.map(lang => {
                            const isActive = filterLang === lang;
                            return (
                                <button 
                                    key={lang}
                                    onClick={() => setFilterLang(lang)}
                                    className={`px-5 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap active:scale-95
                                    ${isActive 
                                        ? 'bg-white text-black border-white shadow-[0_5px_15px_rgba(255,255,255,0.2)] -translate-y-0.5' 
                                        : 'bg-[#121212] text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white'}`}
                                >
                                    {lang}
                                </button>
                            )
                        })}
                    </div>

                    {/* Movie Grid */}
                    {displayedMovies.length > 0 ? (
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10'>
                            {displayedMovies.map((movie) => (
                                <div key={movie._id} className="animate-slideUp">
                                    {/* Pass the active tab to MovieCard so we can show "Pre-Book" text if needed */}
                                    <MovieCard movie={movie} isUpcoming={activeTab === 'Coming Soon'} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        
                        /* Dynamic Empty State */
                        <div className="h-[300px] flex flex-col items-center justify-center text-center bg-[#0a0a0a] rounded-3xl border border-dashed border-gray-800">
                            {activeTab === 'Coming Soon' && filterLang === 'All' ? (
                                <>
                                    <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-800">
                                        <CalendarClock size={28} className="text-gray-500" />
                                    </div>
                                    <p className='text-xl font-bold text-gray-300 mb-2'>No Upcoming Movies</p>
                                    <p className="text-gray-500 text-sm mb-6 max-w-sm">We don't have any future releases scheduled for {manualCity || userLocation.city || "your location"} yet.</p>
                                </>
                            ) : (
                                <>
                                    <p className='text-xl font-bold text-gray-300 mb-2'>No movies found</p>
                                    <p className="text-gray-500 text-sm mb-6">Try changing your language filter or location.</p>
                                </>
                            )}
                            
                            <div className='flex gap-4'>
                                <button onClick={()=>setFilterLang('All')} className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors border border-gray-700">
                                    Reset Language
                                </button>
                                <button onClick={clearLocation} className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors border border-primary/20">
                                    Clear Location
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    )
}
  
export default FeaturedSection