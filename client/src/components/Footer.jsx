import React from 'react'
import { assets } from '../assets/assets'
import { Facebook, Instagram, Twitter, Mail, Phone, CreditCard } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800 pt-16 pb-8">
        <div className="px-6 md:px-16 lg:px-36 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Brand */}
            <div className="space-y-4">
                <img className="w-32 h-auto opacity-90" src={assets.logo} alt="logo" />
                <p className="text-sm leading-relaxed">
                    QuickShow is India's leading destination for movie tickets, trailers, and reviews. Experience the magic of cinema with seamless booking.
                </p>
                <div className="flex gap-4">
                    <Facebook size={20} className="hover:text-primary cursor-pointer transition"/>
                    <Instagram size={20} className="hover:text-primary cursor-pointer transition"/>
                    <Twitter size={20} className="hover:text-primary cursor-pointer transition"/>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h3 className="text-white font-bold mb-4">Discover</h3>
                <ul className="space-y-2 text-sm">
                    <li className="hover:text-white cursor-pointer transition">Now Showing</li>
                    <li className="hover:text-white cursor-pointer transition">Coming Soon</li>
                    <li className="hover:text-white cursor-pointer transition">Cinemas</li>
                    <li className="hover:text-white cursor-pointer transition">Offers</li>
                </ul>
            </div>

            {/* Support */}
            <div>
                <h3 className="text-white font-bold mb-4">Support</h3>
                <ul className="space-y-2 text-sm">
                    <li className="hover:text-white cursor-pointer transition">Privacy Policy</li>
                    <li className="hover:text-white cursor-pointer transition">Terms & Conditions</li>
                    <li className="hover:text-white cursor-pointer transition">Refund Policy</li>
                    <li className="hover:text-white cursor-pointer transition">FAQs</li>
                </ul>
            </div>

            {/* Contact */}
            <div>
                <h3 className="text-white font-bold mb-4">Contact</h3>
                <div className="space-y-3 text-sm">
                    <p className="flex items-center gap-2"><Phone size={16}/> +91 7878787565</p>
                    <p className="flex items-center gap-2"><Mail size={16}/> support@quickshow.in</p>
                    <p className="text-xs text-gray-500 mt-4">12th Floor, Tech Park, Mumbai, India - 400001</p>
                </div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-6 md:px-16 lg:px-36 border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-center md:text-left">
                Copyright {new Date().getFullYear()} © QuickShow. All Rights Reserved.
            </p>
            
            {/* Payment Icons Simulation */}
            <div className="flex items-center gap-3 opacity-70">
               <span className="text-xs font-semibold uppercase tracking-wider mr-2">We Accept</span>
               <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] font-bold text-blue-800">VISA</div>
               <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] font-bold text-red-600">MC</div>
               <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] font-bold text-indigo-800">UPI</div>
               <div className="h-6 w-10 bg-white rounded flex items-center justify-center text-[8px] font-bold text-blue-500">Paytm</div>
            </div>
        </div>
    </footer>
  )
}

export default Footer