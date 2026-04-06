import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { Calendar, Clock, MapPin, PlayCircle, Star, Info, X, Filter, ChevronDown, Smartphone, Coffee, Ticket, Tag, CupSoda, Percent } from 'lucide-react'
import ReactPlayer from 'react-player/youtube'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'

const MovieDetails = () => {

  const { id } = useParams() 
  const navigate = useNavigate()
  const { axios, userLocation, manualCity, setShowLocationModal } = useAppContext()

  const [movie, setMovie] = useState(null)
  const [theaters, setTheaters] = useState([]) 
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTrailer, setShowTrailer] = useState(false)
  const [searchMode, setSearchMode] = useState("")
  
  const [filterTheaterId, setFilterTheaterId] = useState("ALL")

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

  // 1. Fetch Movie Info & Live Offers
  useEffect(() => {
    const fetchInitialData = async () => {
        if(!id || id === 'undefined') { setLoading(false); return; }
        try {
            const movieRes = await axios.get(`/api/show/${id}`)
            if(movieRes.data.success && movieRes.data.movie) {
                setMovie(movieRes.data.movie)
            } else { 
                toast.error(movieRes.data.message || "Movie not found"); 
                navigate('/'); 
            }

            const offersRes = await axios.get('/api/offers/active')
            if(offersRes.data.success) {
                setOffers(offersRes.data.offers)
            }

        } catch (error) { 
            console.error(error); 
            toast.error("Error loading data"); 
        } finally { 
            setLoading(false) 
        }
    }
    fetchInitialData()
  }, [id, axios, navigate])

  // 2. Fetch Showtimes
  useEffect(() => {
    if(!movie) return;
    const fetchShows = async () => {
        try {
            const formattedDate = selectedDate.toISOString().split('T')[0] 
            const currentCity = manualCity || userLocation.city || ""
            
            const params = new URLSearchParams({
                date: formattedDate,
                city: currentCity
            });
            
            if (userLocation.lat) {
                params.append('lat', userLocation.lat);
                params.append('long', userLocation.long);
            }

            const { data } = await axios.get(`/api/show/showtimes/${id}?${params.toString()}`)
            
            if(data.success) {
                setTheaters(data.theaters)
                setSearchMode(data.mode) 
                setFilterTheaterId("ALL") 
            }
        } catch (error) { console.error(error) }
    }
    fetchShows()
  }, [movie, selectedDate, manualCity, userLocation, axios, id])

  if(loading) return <Loading/>
  if(!movie) return null;

  // --- LOGIC: Filter Out Past Shows ---
  const activeTheaters = theaters.map(item => {
      const validShows = item.shows.filter(show => {
          const showTime = new Date(show.time);
          const now = new Date();
          return showTime > now; 
      });
      return { ...item, shows: validShows };
  }).filter(item => item.shows.length > 0); 

  const displayedTheaters = filterTheaterId === "ALL" 
    ? activeTheaters 
    : activeTheaters.filter(t => t.theater._id === filterTheaterId);

  const getOfferIcon = (type) => {
      if (type === 'PERCENTAGE') return <Percent size={14} className="text-emerald-400"/>;
      if (type === 'F&B') return <CupSoda size={14} className="text-orange-400"/>;
      return <Tag size={14} className="text-blue-400"/>;
  };

  const currentActiveCity = manualCity || userLocation.city || "Select Location";

  return (
    <div className='bg-[#050505] min-h-screen text-gray-100 pb-20 font-outfit'>
      
      {/* --- HD PREMIUM HERO SECTION --- */}
      <div className="relative w-full h-[500px] lg:h-[600px] overflow-hidden bg-[#050505]">
          <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl scale-110 transition-transform duration-[7000ms] ease-linear"
              style={{ backgroundImage: `url(${getHighResImage(movie.backdrop_path || movie.poster_path)})` }}
          ></div>
          
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-[#050505]/20"></div>

          <div className='relative z-20 h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-16 gap-8 pt-20 md:pt-0'>
              
              <div className="w-full md:w-3/5 lg:w-1/2 animate-slideUp">
                  <div className="flex gap-3 mb-4">
                      <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">Now Showing</span>
                      <span className="px-3 py-1 bg-white/10 text-gray-300 border border-white/10 rounded-full text-[10px] font-bold backdrop-blur-md flex items-center gap-1">
                          <Star size={12} className="text-yellow-400 fill-yellow-400"/> {movie.vote_average?.toFixed(1) || "8.5"}
                      </span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 drop-shadow-2xl tracking-tight leading-[1.1]">
                      {movie.title}
                  </h1>
                  
                  <div className="flex flex-wrap gap-3 mb-6">
                      <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm text-xs font-semibold text-gray-300">
                          {movie.languages?.join(", ") || "Hindi"}
                      </span>
                      <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm text-xs font-semibold text-gray-300">
                          {movie.formats?.join(", ") || "2D"}
                      </span>
                      <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm text-xs font-semibold text-gray-300 flex items-center gap-2">
                          <Clock size={14}/> {movie.runtime} Mins
                      </span>
                      <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm text-xs font-semibold text-gray-300">
                          {movie.genres?.map(g => g.name || g).join(', ')}
                      </span>
                  </div>

                  <p className="text-gray-300 text-sm md:text-base max-w-xl leading-relaxed line-clamp-3 mb-8">
                      {movie.overview}
                  </p>

                  {movie.trailer_url && (
                      <button onClick={() => setShowTrailer(true)} className="flex items-center gap-3 px-8 py-3.5 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                          <PlayCircle className="w-5 h-5 fill-black text-black" /> Watch Trailer
                      </button>
                  )}
              </div>

              <div className="hidden md:block w-2/5 lg:w-1/3 perspective-1000 animate-fadeIn">
                  <div className="relative w-full max-w-[280px] mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 transform rotate-y-[-10deg] hover:rotate-y-0 transition-transform duration-500">
                      <img src={getHighResImage(movie.poster_path)} alt={movie.title} className="w-full h-auto object-cover" style={{ imageRendering: 'high-quality' }} />
                  </div>
              </div>
          </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="max-w-7xl mx-auto px-4 md:px-16 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-10">
          
          {/* Left Column: Dates & Shows */}
          <div className="lg:col-span-3 space-y-8">
              
              {/* 1. Date Selector */}
              <div>
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary"/> Select Date</h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                      {dates.map((date, index) => {
                          const isSelected = date.toDateString() === selectedDate.toDateString();
                          return (
                              <button 
                                key={index} 
                                onClick={() => setSelectedDate(date)} 
                                className={`flex flex-col items-center justify-center min-w-[72px] h-[84px] rounded-2xl border transition-all duration-300 group
                                ${isSelected 
                                    ? 'bg-gradient-to-br from-primary to-rose-600 border-rose-500 text-white shadow-[0_5px_15px_rgba(248,69,101,0.3)] scale-105' 
                                    : 'bg-[#121212] border-gray-800 text-gray-400 hover:border-gray-600 hover:bg-[#1a1a1a]'}`}
                              >
                                  <span className="text-[10px] uppercase font-bold tracking-wider mb-1">{date.toLocaleDateString('en-US', {weekday: 'short'})}</span>
                                  <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-gray-300'}`}>{date.getDate()}</span>
                              </button>
                          )
                      })}
                  </div>
              </div>

              {/* 2. Theater Control Bar (Location + Dropdown) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-2xl border border-gray-800 shadow-lg">
                  
                  <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl text-primary border border-primary/20"><MapPin size={20}/></div>
                      <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Location Active</p>
                          <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-white">
                                  {currentActiveCity}
                              </span>
                              <button onClick={()=>setShowLocationModal(true)} className="text-[10px] text-primary hover:text-rose-400 font-bold uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-md ml-2 transition-colors">Change</button>
                          </div>
                      </div>
                  </div>

                  {/* DROP DOWN FIX HERE */}
                  {activeTheaters.length > 0 && (
                      <div className="relative group min-w-[240px]">
                          <div className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-600 px-4 py-3 rounded-xl cursor-pointer hover:border-gray-400 transition-colors">
                              <Filter size={16} className="text-white"/>
                              <select 
                                value={filterTheaterId} 
                                onChange={(e)=>setFilterTheaterId(e.target.value)}
                                className="bg-transparent text-sm font-bold text-white outline-none w-full appearance-none cursor-pointer focus:ring-0"
                              >
                                  {/* Added explicit background color to options so they don't turn invisible! */}
                                  <option value="ALL" className="bg-[#1a1a1a] text-white py-2">
                                      All Theaters in {currentActiveCity}
                                  </option>
                                  {activeTheaters.map(t => (
                                      <option key={t.theater._id} value={t.theater._id} className="bg-[#1a1a1a] text-white py-2">
                                          {t.theater.name}
                                      </option>
                                  ))}
                              </select>
                              <ChevronDown size={16} className="text-white absolute right-4 pointer-events-none"/>
                          </div>
                      </div>
                  )}
              </div>

              {/* 3. Theater & Show List */}
              <div className="space-y-6">
                  {displayedTheaters.length === 0 ? (
                      <div className="bg-[#0a0a0a] border border-gray-800 border-dashed rounded-3xl p-16 text-center">
                          <Info className="w-12 h-12 mx-auto mb-4 text-gray-600"/> 
                          <h3 className="text-xl font-bold text-gray-300">No Shows Available</h3>
                          <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                              There are currently no scheduled shows for <span className="text-white font-bold">{currentActiveCity}</span> on this date.
                          </p>
                          <button onClick={()=>setShowLocationModal(true)} className="mt-6 px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-white hover:bg-white/10 transition-colors">
                              Try Another Location
                          </button>
                      </div>
                  ) : (
                      displayedTheaters.map((item, idx) => (
                          <div key={idx} className="bg-[#0f0f0f] border border-gray-800/80 rounded-3xl p-6 md:p-8 hover:border-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl animate-fadeIn">
                              
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 border-b border-gray-800 pb-6">
                                  <div>
                                      <h4 className="font-black text-white text-xl flex items-center gap-2">
                                          {item.theater.name}
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                                          <MapPin size={14}/> {item.theater.address}
                                      </p>
                                  </div>
                                  <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-green-500">
                                      <div className="flex items-center gap-1.5 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20"><Smartphone size={12}/> M-Ticket</div>
                                      <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20"><Coffee size={12}/> F&B Available</div>
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                                  {item.shows.map((showSlot, sIdx) => {
                                      const time = new Date(showSlot.time);
                                      const showDataToPass = {
                                          _id: showSlot.showId,
                                          movie: { title: movie.title, poster_path: movie.poster_path },
                                          theater: { name: item.theater.name },
                                          showDateTime: showSlot.time,
                                          ticketPrice: showSlot.price, 
                                          language: movie.languages?.[0] || "Hindi",
                                          format: showSlot.format
                                      };

                                      return (
                                          <button 
                                            key={sIdx} 
                                            onClick={() => navigate(`/book-seats/${showSlot.showId}`, { state: { show: showDataToPass } })} 
                                            className="group relative flex flex-col items-center justify-center py-3.5 rounded-xl border border-gray-700 bg-[#141414] hover:bg-primary/10 hover:border-primary transition-all duration-300 active:scale-95"
                                          >
                                              <span className="text-base font-black text-green-400 group-hover:text-primary transition-colors">
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
                      ))
                  )}
              </div>
          </div>

          {/* Right Column: Live Offers from DB */}
          <div className="hidden lg:block space-y-6">
              <div className="bg-[#0a0a0a] p-6 rounded-3xl border border-gray-800 shadow-2xl sticky top-24">
                  <h4 className="font-black text-white mb-6 flex items-center gap-2 text-lg">
                      <Ticket size={20} className="text-primary"/> Loyalty Offers
                  </h4>
                  
                  {offers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No special offers available right now.</p>
                      </div>
                  ) : (
                      <ul className="space-y-4">
                          {offers.map(offer => (
                              <li key={offer._id} className="flex gap-4 items-start p-4 rounded-2xl bg-[#121212] border border-gray-800 hover:border-gray-600 transition-all group">
                                  <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 border border-gray-700 group-hover:bg-gray-800 transition-colors">
                                      {getOfferIcon(offer.type)}
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{offer.title}</p>
                                      <div className="flex items-center gap-2 mt-1.5">
                                          <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider">{offer.type}</span>
                                          <span className="text-[10px] text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded">
                                              {offer.cost} Coins
                                          </span>
                                      </div>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  )}
                  
                  <div className="mt-6 pt-6 border-t border-gray-800">
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                          Login and book tickets to earn QuickShow Coins. Redeem them here for exclusive discounts and free food!
                      </p>
                  </div>
              </div>
          </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && movie.trailer_url && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-fadeIn">
              <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <button onClick={() => setShowTrailer(false)} className="absolute top-6 right-6 z-10 bg-black/60 hover:bg-rose-600 text-white p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all shadow-lg active:scale-90">
                      <X size={24}/>
                  </button>
                  <ReactPlayer url={movie.trailer_url} width="100%" height="100%" playing={true} controls={true} />
              </div>
          </div>
      )}
    </div>
  )
}

export default MovieDetails