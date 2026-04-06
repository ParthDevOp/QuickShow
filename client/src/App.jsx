import React, { useEffect } from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { SignIn, useClerk } from '@clerk/clerk-react'
import { useAppContext } from './context/AppContext'

// --- PUBLIC COMPONENTS ---
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Loading from './components/Loading'
import LocationSelector from './components/LocationSelector' 

// --- PUBLIC PAGES ---
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import Checkout from './pages/Checkout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import Wallet from './pages/Wallet' 
import Theaters from './pages/Theaters' 
import TheaterDetails from './pages/TheaterDetails' 
import Support from './pages/Support' 

// --- SUPER ADMIN PAGES ---
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddMovie from './pages/admin/AddMovie' 
import AddTheater from './pages/admin/AddTheater' 
import AddShows from './pages/admin/AddShows'
import ManageSnacks from './pages/admin/ManageSnacks'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import UsersList from './pages/admin/Users'
import AdminOffers from './pages/admin/AdminOffers' 
import SupportAdmin from './pages/admin/SupportAdmin'
import BoxOffice from './pages/admin/BoxOffice' // Shared component, now exclusively used by Cinema Portal
import AdminRequests from './pages/admin/AdminRequests' 

// --- CINEMA PORTAL PAGES ---
import CinemaLayout from './pages/cinema/CinemaLayout'
import CinemaDashboard from './pages/cinema/CinemaDashboard'
import ScanTicket from './pages/cinema/ScanTicket'
import DailyManifest from './pages/cinema/DailyManifest' 
import CinemaBookings from './pages/cinema/CinemaBookings'
import CinemaSnacks from './pages/cinema/CinemaSnacks'
import ScheduleRequests from './pages/cinema/ScheduleRequests'

const App = () => {
  const location = useLocation()
  
  // Hide public Navbar/Footer on BOTH Admin and Cinema routes
  const isDashboardRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/cinema')
  
  // CRITICAL FIX: Pulled isCheckingAdmin to prevent race conditions on refresh
  const { user, axios, getToken, isAdmin, isCheckingAdmin } = useAppContext() 
  const { signOut } = useClerk() 

  // --- AUTOMATIC USER SYNC & BAN CHECK ---
  useEffect(() => {
    let isMounted = true; // Cleanup flag for async operations

    const syncUserData = async () => {
        if (!user) return; // Exit early if no user is logged in

        try {
            const token = await getToken();
            const { data } = await axios.post('/api/user/sync', 
                {
                    name: user.fullName,
                    email: user.primaryEmailAddress?.emailAddress,
                    image: user.imageUrl
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!isMounted) return; // Prevent actions if component unmounted

            // THE BOUNCER: Check if the database says they are banned
            if (data?.success && data?.user?.isBanned) {
                await signOut(); // Instantly destroy their Clerk session
                toast.error("Access Denied: Your account has been suspended.");
            } else {
                console.log("User Synced to Database");
            }
            
        } catch (error) {
            if (isMounted) {
                console.error("Sync Failed:", error);
            }
        }
    };

    syncUserData();

    // Cleanup function
    return () => {
        isMounted = false;
    };
  }, [user, axios, getToken, signOut]);

  // --- AUTH RENDER HELPERS ---
  const renderAdminAuth = () => {
    if (!user) {
      return (
        <div className='min-h-screen flex justify-center items-center bg-gray-950'>
          <SignIn 
            routing="hash" 
            fallbackRedirectUrl={'/admin'} 
            appearance={{ 
              elements: { 
                formButtonPrimary: 'bg-red-600 hover:bg-red-700', 
                card: 'bg-gray-900 border border-gray-800 text-white' 
              } 
            }}
          />
        </div>
      );
    }

    // CRITICAL FIX: Wait for the database role check to complete before making a routing decision.
    // This stops the admin from being kicked out when they hit refresh (F5).
    if (isCheckingAdmin) {
        return <Loading />;
    }

    return isAdmin ? <Layout /> : <Navigate to="/" replace />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-outfit">
      <Toaster position="bottom-right" reverseOrder={false} />
      
      <LocationSelector />

      {/* Show Navbar on all routes EXCEPT Admin & Cinema */}
      {!isDashboardRoute && <Navbar />}
      
      <div className="flex-grow">
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path='/' element={<Home />} />
          <Route path='/movies' element={<Movies />} />
          <Route path='/movies/:id' element={<MovieDetails />} />
          <Route path='/theaters' element={<Theaters />} /> 
          <Route path='/theater/:id' element={<TheaterDetails />} />
          <Route path='/book-seats/:showId' element={<SeatLayout />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/my-bookings' element={<MyBookings />} />
          <Route path='/favorite' element={<Favorite />} />
          <Route path='/wallet' element={<Wallet />} />
          <Route path='/support' element={<Support />} /> 
          <Route path='/loading/:nextUrl' element={<Loading />} />

          {/* --- CINEMA STAFF PORTAL --- */}
          <Route path='/cinema/*' element={<CinemaLayout />}>
            <Route index element={<CinemaDashboard />} />
            <Route path="pos" element={<BoxOffice />} />
            <Route path="scan" element={<ScanTicket />} /> 
            <Route path="manifest" element={<DailyManifest />} /> 
            <Route path="bookings" element={<CinemaBookings />} />
            <Route path="snacks" element={<CinemaSnacks />} /> 
            <Route path="requests" element={<ScheduleRequests />} /> 
          </Route>

          {/* --- ADMIN ROUTES (SECURED) --- */}
          <Route path='/admin/*' element={renderAdminAuth()}>
            <Route index element={<Dashboard />} />
            <Route path="add-movie" element={<AddMovie />} /> 
            <Route path="add-theater" element={<AddTheater />} /> 
            <Route path="add-shows" element={<AddShows />} />
            <Route path="snacks" element={<ManageSnacks />} />
            <Route path="list-shows" element={<ListShows />} />
            <Route path="list-bookings" element={<ListBookings />} />
            <Route path="users" element={<UsersList />} />
            <Route path="offers" element={<AdminOffers />} />
            <Route path="support" element={<SupportAdmin />} />
            <Route path="requests" element={<AdminRequests />} />
            {/* BoxOffice Route REMOVED from Admin panel for strict local cash management enforcement */}
          </Route>
        </Routes>
      </div>

      {/* Show Footer on all routes EXCEPT Admin & Cinema */}
      {!isDashboardRoute && <Footer />}
    </div>
  )
}

export default App