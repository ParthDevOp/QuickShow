import React from 'react'
import { assets } from '../assets/assets'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-[#050505] text-gray-400 border-t border-white/10 pt-16 pb-8 font-outfit">
        <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Brand */}
            <div className="space-y-4 md:col-span-1">
                <img className="w-32 h-auto opacity-90" src={assets.logo} alt="logo" />
                <p className="text-sm leading-relaxed text-gray-500">
                    QuickShow is your ultimate destination for seamless movie ticket bookings, live seat selection, and F&B pre-orders.
                </p>
                <div className="flex gap-4 pt-2">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F84565] hover:text-white cursor-pointer transition-all">
                        <Facebook size={16} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F84565] hover:text-white cursor-pointer transition-all">
                        <Instagram size={16} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#F84565] hover:text-white cursor-pointer transition-all">
                        <Twitter size={16} />
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h3 className="text-white font-bold mb-6 text-lg tracking-wide">Discover</h3>
                <ul className="space-y-3 text-sm font-medium">
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Now Showing</li>
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Coming Soon</li>
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Cinemas</li>
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Offers</li>
                </ul>
            </div>

            {/* Support */}
            <div>
                <h3 className="text-white font-bold mb-6 text-lg tracking-wide">Support</h3>
                <ul className="space-y-3 text-sm font-medium">
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Privacy Policy</li>
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Terms & Conditions</li>
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> Refund Policy</li>
                    <li className="hover:text-[#F84565] cursor-pointer transition-colors flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-700"></span> FAQs</li>
                </ul>
            </div>

            {/* Contact */}
            <div>
                <h3 className="text-white font-bold mb-6 text-lg tracking-wide">Get in Touch</h3>
                <div className="space-y-4 text-sm font-medium">
                    <a href="tel:+917878787565" className="flex items-start gap-3 hover:text-[#F84565] transition-colors">
                        <Phone size={18} className="shrink-0 mt-0.5 text-gray-500" /> 
                        <span>+91 7878787565</span>
                    </a>
                    <a href="mailto:pparth8108@gmail.com" className="flex items-start gap-3 hover:text-[#F84565] transition-colors">
                        <Mail size={18} className="shrink-0 mt-0.5 text-gray-500" /> 
                        <span>pparth8108@gmail.com</span>
                    </a>
                    <div className="flex items-start gap-3 text-gray-500">
                        <MapPin size={18} className="shrink-0 mt-0.5" /> 
                        <span className="leading-relaxed">
                            Developed by Parth Shah<br/>
                            Mandvi, Surat<br/>
                            Gujarat, India
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-gray-500 font-medium text-center md:text-left">
                Copyright {new Date().getFullYear()} © QuickShow. Built by Parth Shah. All Rights Reserved.
            </p>
            
            {/* Payment Icons Simulation */}
            <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
               <span className="text-[10px] font-bold uppercase tracking-widest mr-2 text-gray-400">Secure Payments</span>
               <div className="h-7 w-11 bg-white/10 rounded border border-white/5 flex items-center justify-center text-[9px] font-black text-white">VISA</div>
               <div className="h-7 w-11 bg-white/10 rounded border border-white/5 flex items-center justify-center text-[9px] font-black text-white">MC</div>
               <div className="h-7 w-11 bg-white/10 rounded border border-white/5 flex items-center justify-center text-[9px] font-black text-white">UPI</div>
               <div className="h-7 w-11 bg-white/10 rounded border border-white/5 flex items-center justify-center text-[9px] font-black text-white">PAYTM</div>
            </div>
        </div>
    </footer>
  )
}

export default Footer