import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { assets } from '../assets/assets'
import { Menu, Search, Ticket, X, MapPin, ChevronDown, ShieldCheck, Wallet, Clapperboard, Headset, MonitorPlay, Zap } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [activeLink, setActiveLink] = useState('/')
  const searchRef = useRef(null)
  const location = useLocation()

  const { user } = useUser()
  const { openSignIn } = useClerk()
  const navigate = useNavigate()
  const { dbUser, userLocation, setShowLocationModal, isAdmin } = useAppContext()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setActiveLink(location.pathname)
  }, [location])

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/theaters', label: 'Theaters', icon: <Clapperboard size={13} /> },
    { to: '/support', label: 'Support', icon: <Headset size={13} /> },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Exo+2:wght@300;400;500;600&display=swap');

        .qs-nav {
          font-family: 'Exo 2', sans-serif;
        }

        /* Scan line overlay */
        .qs-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.012) 2px,
            rgba(255,255,255,0.012) 4px
          );
          pointer-events: none;
          z-index: 0;
        }

        /* Animated bottom border */
        .qs-nav-border {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(220,38,38,0.3) 20%,
            rgba(220,38,38,0.9) 50%,
            rgba(220,38,38,0.3) 80%,
            transparent 100%
          );
          animation: borderSweep 4s ease-in-out infinite;
        }

        @keyframes borderSweep {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        /* Nav link hover effect */
        .qs-link {
          position: relative;
          letter-spacing: 0.06em;
          font-weight: 500;
          font-size: 0.8rem;
          text-transform: uppercase;
          color: rgba(200,200,220,0.8);
          transition: color 0.2s;
          padding: 6px 2px;
        }

        .qs-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #dc2626, #f97316);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 6px #dc2626;
        }

        .qs-link:hover, .qs-link.active {
          color: #fff;
        }

        .qs-link:hover::after, .qs-link.active::after {
          width: 100%;
        }

        /* City pill */
        .qs-city {
          position: relative;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 4px;
          padding: 5px 12px;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          color: rgba(220,220,240,0.85);
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
        }

        .qs-city:hover {
          background: rgba(220,38,38,0.12);
          border-color: rgba(220,38,38,0.5);
          color: #fff;
        }

        .qs-city .ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #dc2626;
          box-shadow: 0 0 6px #dc2626;
          animation: ping 2s ease-in-out infinite;
        }

        @keyframes ping {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* Icon buttons */
        .qs-icon-btn {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transition: all 0.2s;
          color: rgba(200,200,220,0.7);
        }

        .qs-icon-btn:hover {
          background: rgba(220,38,38,0.1);
          border-color: rgba(220,38,38,0.3);
          color: #fff;
          box-shadow: 0 0 12px rgba(220,38,38,0.15);
        }

        /* Corner brackets */
        .bracket {
          position: relative;
        }
        .bracket::before, .bracket::after {
          content: '';
          position: absolute;
          width: 6px;
          height: 6px;
          border-color: rgba(220,38,38,0.4);
          border-style: solid;
          transition: all 0.2s;
        }
        .bracket::before {
          top: -2px; left: -2px;
          border-width: 1px 0 0 1px;
        }
        .bracket::after {
          bottom: -2px; right: -2px;
          border-width: 0 1px 1px 0;
        }
        .bracket:hover::before, .bracket:hover::after {
          border-color: rgba(220,38,38,0.9);
          width: 10px;
          height: 10px;
        }

        /* Sign in button */
        .qs-signin {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 7px 20px;
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          border: 1px solid rgba(220,38,38,0.5);
          border-radius: 3px;
          color: #fff;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s;
        }

        .qs-signin::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.4s;
        }

        .qs-signin:hover::before {
          left: 100%;
        }

        .qs-signin:hover {
          box-shadow: 0 0 20px rgba(220,38,38,0.4);
          border-color: rgba(220,38,38,0.8);
        }

        /* Admin badge */
        .qs-admin-badge {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 14px;
          background: rgba(220,38,38,0.1);
          border: 1px solid rgba(220,38,38,0.35);
          border-radius: 3px;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
          position: relative;
        }
        .qs-admin-badge:hover {
          background: rgba(220,38,38,0.18);
          color: #fff;
          box-shadow: 0 0 16px rgba(220,38,38,0.25);
        }

        .qs-cinema-badge {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 0.72rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 14px;
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.35);
          border-radius: 3px;
          color: #fb923c;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.2s;
        }
        .qs-cinema-badge:hover {
          background: rgba(249,115,22,0.18);
          color: #fff;
          box-shadow: 0 0 16px rgba(249,115,22,0.25);
        }

        /* Search expand */
        .qs-search-bar {
          overflow: hidden;
          transition: width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.25s;
          width: 0;
          opacity: 0;
        }
        .qs-search-bar.open {
          width: 200px;
          opacity: 1;
        }
        .qs-search-bar input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(220,38,38,0.3);
          border-radius: 3px;
          padding: 6px 12px;
          font-family: 'Exo 2', sans-serif;
          font-size: 0.8rem;
          color: #fff;
          outline: none;
          letter-spacing: 0.04em;
        }
        .qs-search-bar input::placeholder {
          color: rgba(200,200,220,0.35);
        }

        /* Mobile menu */
        .qs-mobile {
          background: rgba(5,5,10,0.98);
          backdrop-filter: blur(24px);
        }

        .qs-mobile-link {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 600;
          font-size: 1.6rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(200,200,220,0.7);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          width: 100%;
          justify-content: center;
        }
        .qs-mobile-link:hover {
          color: #fff;
          text-shadow: 0 0 20px rgba(220,38,38,0.5);
        }

        /* Logo glow on hover */
        .qs-logo:hover img {
          filter: drop-shadow(0 0 8px rgba(220,38,38,0.4));
        }

        /* HUD corner decorations */
        .hud-corner {
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: rgba(220,38,38,0.25);
          border-style: solid;
        }
        .hud-tl { top: 6px; left: 6px; border-width: 1px 0 0 1px; }
        .hud-tr { top: 6px; right: 6px; border-width: 1px 1px 0 0; }
        .hud-bl { bottom: 6px; left: 6px; border-width: 0 0 1px 1px; }
        .hud-br { bottom: 6px; right: 6px; border-width: 0 1px 1px 0; }

        /* User greeting */
        .qs-greeting {
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(200,200,220,0.5);
        }
        .qs-greeting span {
          color: rgba(220,38,38,0.9);
        }
      `}</style>

      <nav className={`qs-nav fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'py-2 bg-gray-950/92 backdrop-blur-xl shadow-[0_4px_40px_rgba(0,0,0,0.6)]'
          : 'py-4 bg-gradient-to-b from-black/70 to-transparent'
      }`} style={{ position: 'fixed' }}>

        {/* HUD corner decorations (only when scrolled) */}
        {scrolled && (
          <>
            <div className="hud-corner hud-tl" />
            <div className="hud-corner hud-tr" />
            <div className="hud-corner hud-bl" />
            <div className="hud-corner hud-br" />
          </>
        )}

        <div className="qs-nav-border" />

        <div className="relative z-10 flex items-center justify-between px-6 md:px-14 lg:px-32">

          {/* LEFT: Logo + City */}
          <div className="flex items-center gap-6">
            <Link to='/' className='qs-logo flex-shrink-0 transition-all duration-300'>
              <img src={assets.logo} alt="QuickShow" className='w-28 md:w-36 h-auto' />
            </Link>

            <div
              onClick={() => setShowLocationModal(true)}
              className="qs-city hidden lg:flex items-center gap-2"
            >
              <div className="ping" />
              <MapPin size={12} className="text-red-500" />
              <span>{userLocation.city}</span>
              <ChevronDown size={12} className="opacity-60" />
            </div>
          </div>

          {/* CENTER: Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`qs-link flex items-center gap-1.5 ${activeLink === to ? 'active' : ''}`}
              >
                {icon && <span className="opacity-60">{icon}</span>}
                {label}
              </Link>
            ))}

            {isAdmin && (
              <Link to='/admin' className="qs-admin-badge">
                <ShieldCheck size={13} />
                Admin
              </Link>
            )}

            {dbUser?.role === 'cinema' && (
              <Link to='/cinema' className="qs-cinema-badge">
                <MonitorPlay size={13} />
                Box Office
              </Link>
            )}
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-3">

            {/* Expandable Search */}
            <div className="hidden sm:flex items-center gap-2">
              <div className={`qs-search-bar ${searchOpen ? 'open' : ''}`}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search movies..."
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
                />
              </div>
              <div
                className="qs-icon-btn bracket"
                onClick={() => setSearchOpen(v => !v)}
                title="Search"
              >
                {searchOpen ? <X size={15} /> : <Search size={15} />}
              </div>
            </div>

            {user && (
              <div
                onClick={() => navigate('/wallet')}
                className="qs-icon-btn bracket hidden sm:flex"
                title="My Wallet"
              >
                <Wallet size={15} />
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block qs-greeting">
                  <Zap size={10} className="inline mr-1 text-red-500" />
                  Hey, <span>{user.firstName}</span>
                </div>
                <UserButton afterSignOutUrl="/">
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="My Bookings"
                      labelIcon={<Ticket size={14} />}
                      onClick={() => navigate('/my-bookings')}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <button onClick={openSignIn} className="qs-signin">
                Sign In
              </button>
            )}

            <Menu
              className='md:hidden w-6 h-6 text-gray-300 cursor-pointer hover:text-white transition'
              onClick={() => setIsOpen(true)}
            />
          </div>
        </div>
      </nav>

      {/* ── Mobile Overlay ── */}
      <div className={`qs-mobile fixed inset-0 z-[60] transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 md:hidden flex flex-col items-center justify-center gap-6 px-8`}>

        {/* HUD corners on mobile */}
        <div className="hud-corner hud-tl" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />
        <div className="hud-corner hud-tr" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />
        <div className="hud-corner hud-bl" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />
        <div className="hud-corner hud-br" style={{ borderColor: 'rgba(220,38,38,0.3)' }} />

        <button
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center border border-white/10 rounded-sm text-gray-400 hover:text-white hover:border-red-500/40 transition"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>

        {/* Logo in mobile menu */}
        <img src={assets.logo} alt="QuickShow" className='w-36 mb-4 opacity-80' />

        {navLinks.map(({ to, label, icon }) => (
          <Link
            key={to}
            onClick={() => setIsOpen(false)}
            to={to}
            className="qs-mobile-link"
          >
            {icon} {label}
          </Link>
        ))}

        {user && (
          <Link onClick={() => setIsOpen(false)} to='/wallet' className="qs-mobile-link">
            <Wallet size={20} /> Wallet
          </Link>
        )}

        <div
          onClick={() => { setIsOpen(false); setShowLocationModal(true) }}
          className="qs-mobile-link cursor-pointer"
        >
          <MapPin size={20} className="text-red-500" /> {userLocation.city}
        </div>

        {isAdmin && (
          <Link onClick={() => setIsOpen(false)} to='/admin' className="qs-mobile-link" style={{ color: '#ef4444' }}>
            <ShieldCheck size={20} /> Admin Dashboard
          </Link>
        )}

        {dbUser?.role === 'cinema' && (
          <Link onClick={() => setIsOpen(false)} to='/cinema' className="qs-mobile-link" style={{ color: '#fb923c' }}>
            <MonitorPlay size={20} /> Box Office
          </Link>
        )}

        {!user && (
          <button
            onClick={() => { setIsOpen(false); openSignIn() }}
            className="qs-signin mt-6 w-full text-center"
          >
            Sign In / Register
          </button>
        )}
      </div>
    </>
  )
}

export default Navbar