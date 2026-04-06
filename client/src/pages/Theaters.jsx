import React, { useEffect, useState } from 'react'
import { MapPin, Navigation, Info, Loader2, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

const Theaters = () => {
    const navigate = useNavigate()
    const { axios, manualCity, userLocation } = useAppContext()
    const [theaters, setTheaters] = useState([])
    const [loading, setLoading] = useState(true)

    const currentCity = manualCity || userLocation.city || "Select City";

    useEffect(() => {
        const fetchTheaters = async () => {
            if(currentCity === "Select City") { setLoading(false); return; }
            setLoading(true)
            try {
                const { data } = await axios.get(`/api/theaters/list?city=${currentCity}`)
                if (data.success) setTheaters(data.theaters)
            } catch (error) {
                console.error("Fetch error:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTheaters()
    }, [currentCity, axios])

    // --- GOOGLE MAPS PHOTO INTEGRATION ---
    const getGoogleMapsPhoto = (theater) => {
        // 1. Put your real Google Maps API Key in your .env file as VITE_GOOGLE_MAPS_API_KEY
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 

        // If you haven't added the key yet, safely fallback to the cinematic placeholder
        if (!apiKey || apiKey === "YOUR_API_KEY") {
            return `https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80&sig=${theater._id}`;
        }

        // 2. Encode the theater's exact location for Google Maps
        const locationQuery = encodeURIComponent(`${theater.name}, ${theater.address}, ${theater.city}`);
        
        // 3. Fetch the real Street View / Exterior photo
        return `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${locationQuery}&fov=90&heading=235&pitch=10&key=${apiKey}`;
    }

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
        </div>
    )

    return (
        <div className="min-h-screen bg-[#050505] px-6 md:px-16 lg:px-36 py-28 font-outfit">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">Theaters in {currentCity}</h1>
                    <p className="text-gray-400 font-medium">Find your favorite cinema and browse scheduled shows.</p>
                </div>

                {theaters.length === 0 ? (
                    <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-[2rem] bg-[#0a0a0a]">
                        <Building2 size={48} className="text-gray-700 mb-4" />
                        <p className="text-gray-500 font-bold">No theaters found in {currentCity}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {theaters.map((theater) => (
                            <div 
                                key={theater._id}
                                onClick={() => navigate(`/theater/${theater._id}`)}
                                className="group bg-[#0f0f0f] rounded-[2rem] overflow-hidden border border-gray-800 hover:border-primary transition-all duration-500 cursor-pointer hover:-translate-y-2 shadow-2xl"
                            >
                                {/* THEATER IMAGE HEADER */}
                                <div className="h-56 bg-gray-900 relative overflow-hidden">
                                    <img 
                                        src={getGoogleMapsPhoto(theater)} 
                                        className="w-full h-full object-cover opacity-60 group-hover:opacity-90 transition-all duration-700 group-hover:scale-110"
                                        alt={theater.name}
                                        loading="lazy"
                                        onError={(e) => { 
                                            // Ultimate fallback if Google Maps fails to find the specific address
                                            e.target.src = `https://images.unsplash.com/photo-1517604401870-d372199ede4a?auto=format&fit=crop&w=800&q=80`; 
                                        }}
                                    />
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white shadow-lg">
                                            <Navigation size={16} className="group-hover:text-blue-400 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>
                                </div>

                                <div className="p-8 pt-4">
                                    <h3 className="text-2xl font-black text-white mb-3 group-hover:text-primary transition-colors leading-tight">{theater.name}</h3>
                                    <div className="flex items-start gap-2 text-gray-400 text-sm mb-6">
                                        <MapPin size={16} className="text-primary shrink-0 mt-0.5" />
                                        <p className="line-clamp-2 font-medium">{theater.address}</p>
                                    </div>
                                    
                                    <button className="w-full py-4 bg-white/5 border border-white/10 group-hover:bg-primary group-hover:text-white group-hover:border-primary text-gray-300 rounded-2xl text-sm font-black transition-all duration-300 flex items-center justify-center gap-2">
                                        <Info size={18}/> View Today's Shows
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Theaters