import React, { useState, useEffect } from 'react';
import Title from '../../components/admin/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
import { 
    Plus, Trash2, Utensils, IndianRupee, Edit2, X, CheckIcon, 
    Image as ImageIcon, Power, AlertCircle 
} from 'lucide-react';
import Loading from '../../components/Loading';

const CinemaSnacks = () => {
    const { axios, getToken } = useAppContext();
    const [snacks, setSnacks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Edit State
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ 
        name: '', price: '', image: '', description: '', category: 'Popcorn', isActive: true 
    });

    const categories = ['Popcorn', 'Beverage', 'Candy', 'Combo', 'Hot Food', 'Other'];

    const fetchSnacks = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/snacks/my-menu', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(data.success) setSnacks(data.snacks);
        } catch (error) { 
            console.error(error);
            toast.error("Failed to load local menu.");
        } finally {
            setLoading(false);
        }
    }, [axios, getToken]);

    useEffect(() => { fetchSnacks(); }, [fetchSnacks]);

    const handleEditClick = (snack) => {
        setFormData({
            name: snack.name,
            price: snack.price,
            image: snack.image,
            description: snack.description || '',
            category: snack.category || 'Popcorn',
            isActive: snack.isActive !== false
        });
        setEditingId(snack._id);
        setIsEditMode(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ name: '', price: '', image: '', description: '', category: 'Popcorn', isActive: true });
        setEditingId(null);
        setIsEditMode(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = await getToken();
            const endpoint = isEditMode ? '/api/snacks/update' : '/api/snacks/create-local';
            const payload = isEditMode ? { id: editingId, ...formData } : formData;

            const { data } = await axios.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if(data.success) {
                toast.success(isEditMode ? "Item Updated!" : "Added to Local Menu!");
                resetForm();
                fetchSnacks();
            } else {
                toast.error(data.message);
            }
        } catch (error) { 
            console.error(error);
            toast.error(isEditMode ? "Update failed" : "Creation failed"); 
        } finally {
            setIsSubmitting(false);
        }
    };

    // Quick toggle for "Out of Stock" during busy shifts
    const handleToggleStock = async (snackId, currentStatus) => {
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/snacks/toggle-stock', { id: snackId, isActive: !currentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if(data.success) {
                toast.success(currentStatus ? "Marked Out of Stock" : "Restocked!");
                setSnacks(prev => prev.map(s => s._id === snackId ? { ...s, isActive: !currentStatus } : s));
            }
        } catch (error) {
            console.error(error);
            toast.error("Stock update failed");
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Permanently delete this item from your menu?")) return;
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/snacks/delete', { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(data.success) { 
                toast.success("Item Deleted!"); 
                if (editingId === id) resetForm();
                fetchSnacks(); 
            }
        } catch (error) {
            console.error(error);
            toast.error("Delete failed");
        }
    };

    if (loading) return <Loading />;

    return (
        <div className='pb-20 relative font-outfit text-white animate-fadeIn max-w-[1600px] mx-auto'>
            {/* Ambient Background Glows */}
            <div className="fixed top-20 right-10 w-[40%] h-[400px] bg-orange-600/10 blur-[150px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-10 w-[30%] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

            {/* Header Sub-Nav Style */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 bg-[#060606]/80 p-8 rounded-3xl border border-white/[0.04] backdrop-blur-2xl shadow-2xl">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Utensils fill="currentColor" size={12} className="text-orange-500" />
                        <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.25em]">Concessions Manager</p>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">Local Inventory</h2>
                    <p className="text-gray-400 text-sm flex items-center gap-2 font-medium bg-white/[0.03] inline-flex px-3.5 py-1.5 rounded-lg border border-white/[0.05] shadow-inner">
                        Manage the F&B menu directly for your local venue
                    </p>
                </div>
                {isEditMode && (
                    <button onClick={resetForm} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 shadow-inner">
                        <X size={14} strokeWidth={3}/> Terminate Edit
                    </button>
                )}
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT: ADD / EDIT FORM --- */}
                <div className="lg:col-span-4 xl:col-span-5 relative">
                    <div className={`bg-[#060606]/80 backdrop-blur-xl p-8 rounded-3xl border transition-all duration-300 shadow-2xl sticky top-6 overflow-hidden ${isEditMode ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-white/[0.04]'}`}>
                        <div className={`absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-transparent ${isEditMode ? 'via-blue-500/50' : 'via-orange-500/50'} to-transparent`}></div>
                        
                        <div className="flex items-center gap-4 mb-8 border-b border-white/[0.05] pb-5">
                            <div className={`p-4 rounded-2xl border shadow-inner ${isEditMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                {isEditMode ? <Edit2 size={24}/> : <Utensils size={24}/>}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">{isEditMode ? 'Modify Item' : 'New Provision'}</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mt-1">Local Catalog Sync</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Image Preview Box */}
                            <div className="w-full aspect-video bg-[#0a0a0a] rounded-2xl border border-white/[0.05] flex items-center justify-center overflow-hidden relative shadow-inner">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'}} />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-600">
                                        <ImageIcon size={36} className="mb-3 opacity-40"/>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Visual Preview</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-2 ml-1">Nomenclature</label>
                                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-4 text-sm text-white outline-none transition-all shadow-inner placeholder:text-gray-600" placeholder="e.g. Cinematic Popcorn"/>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-2 ml-1">Classification</label>
                                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-4 text-sm text-white outline-none transition-all appearance-none cursor-pointer shadow-inner">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-2 ml-1">Valuation</label>
                                    <div className="relative">
                                        <IndianRupee size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"/>
                                        <input type="number" required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-4 pl-10 text-sm text-white outline-none transition-all shadow-inner font-mono placeholder:text-gray-600" placeholder="0.00"/>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-2 ml-1">Secure Image URL</label>
                                <input required value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-4 text-sm text-white outline-none transition-all shadow-inner placeholder:text-gray-600 font-mono" placeholder="https://..."/>
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block mb-2 ml-1">Technical Specs</label>
                                <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-[#121212] border border-white/10 focus:border-orange-500/50 rounded-xl p-4 text-sm text-white outline-none transition-all shadow-inner resize-none h-24 custom-scrollbar placeholder:text-gray-600" placeholder="Optional details regarding constraints, allergens, or sizing..."/>
                            </div>
                            
                            <button disabled={isSubmitting} type="submit" className={`w-full text-white font-black uppercase tracking-[0.15em] text-[11px] py-4.5 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-2 mt-8 border ${isEditMode ? 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 border-blue-400/30' : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 border-orange-400/30'}`}>
                                {isSubmitting ? "Processing..." : isEditMode ? <><CheckIcon size={16} strokeWidth={3}/> Update Database</> : <><Plus size={16} strokeWidth={3}/> Initialize Deployment</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT: LOCAL MENU LIST --- */}
                <div className="lg:col-span-8 xl:col-span-7">
                    <div className="bg-[#060606]/80 backdrop-blur-2xl border border-white/[0.04] rounded-3xl p-8 shadow-2xl min-h-[600px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[50%] h-[1px] bg-gradient-to-l from-transparent via-white/20 to-transparent"></div>
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.05]">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Active Feed</h3>
                                <p className="text-xs text-gray-500 mt-2 font-medium">Currently deployed inventory available for guest procurement.</p>
                            </div>
                            <span className="bg-black/50 text-gray-400 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/5 shadow-inner">
                                Entries: {snacks.length}
                            </span>
                        </div>

                        {snacks.length === 0 ? (
                            <div className="bg-white/[0.02] border border-white/[0.05] border-dashed rounded-3xl p-24 text-center text-gray-500 flex flex-col items-center">
                                <div className="p-6 bg-white/[0.02] rounded-full mb-6 border border-white/[0.05]">
                                    <Utensils size={48} className="opacity-40 text-orange-500"/>
                                </div>
                                <p className="text-xl font-black text-white tracking-tight drop-shadow-md">Inventory Empty</p>
                                <p className="text-sm mt-3 max-w-sm mx-auto">Initialize your first provision object to establish local theater revenue streams.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-max">
                                {snacks.map(snack => (
                                    <div key={snack._id} className={`flex gap-5 p-5 rounded-3xl relative group transition-all duration-300 overflow-hidden shadow-2xl ${editingId === snack._id ? 'bg-[#030303] border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] scale-[1.02] z-10' : !snack.isActive ? 'bg-[#060606]/40 border border-red-500/10 opacity-70 grayscale-[30%] hover:grayscale-0' : 'bg-[#060606]/60 border border-white/[0.05] hover:border-white/10 hover:bg-[#0a0a0a]/80'}`}>
                                        
                                        <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-black shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10 relative">
                                            <img src={snack.image} alt={snack.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"/>
                                            {!snack.isActive && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)] transform -rotate-12">Halted</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between py-1 pr-10">
                                            <div>
                                                <h4 className="font-bold text-gray-100 text-lg leading-tight mb-2 line-clamp-2 pr-2">{snack.name}</h4>
                                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] bg-black px-2 py-1 rounded-md border border-white/[0.05] shrink-0 shadow-inner">{snack.category || 'Popcorn'}</span>
                                            </div>
                                            
                                            <div className="flex items-end justify-between mt-4">
                                                <p className="text-orange-400 font-bold flex items-center bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 text-sm font-mono shadow-inner">
                                                    <IndianRupee size={12} className="mr-1 opacity-70"/> {parseFloat(snack.price).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons - Quick Access */}
                                        <div className="absolute top-5 right-5 flex flex-col gap-2.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                                            <button 
                                                onClick={() => handleToggleStock(snack._id, snack.isActive)} 
                                                className={`p-2.5 rounded-xl transition-all shadow-lg border backdrop-blur-md ${snack.isActive ? 'bg-[#111]/80 hover:bg-black text-gray-400 hover:text-red-500 border-white/10 hover:border-red-500/50' : 'bg-red-500/20 text-red-400 hover:bg-emerald-500/20 hover:text-emerald-400 border-red-500/30 hover:border-emerald-500/30'}`} 
                                                title={snack.isActive ? "Halt Distribution" : "Resume Distribution"}
                                            >
                                                {snack.isActive ? <Power size={14} strokeWidth={2.5}/> : <AlertCircle size={14} strokeWidth={2.5}/>}
                                            </button>
                                            <button onClick={() => handleEditClick(snack)} className="bg-[#111]/80 hover:bg-black text-gray-400 hover:text-blue-400 p-2.5 rounded-xl transition-all shadow-lg border border-white/10 hover:border-blue-500/50 backdrop-blur-md" title="Modify Config">
                                                <Edit2 size={14} strokeWidth={2.5}/>
                                            </button>
                                            <button onClick={() => handleDelete(snack._id)} className="bg-[#111]/80 hover:bg-red-500 text-gray-400 hover:text-white p-2.5 rounded-xl transition-all shadow-lg border border-white/10 hover:border-red-500/50 backdrop-blur-md" title="Execute Purge">
                                                <Trash2 size={14} strokeWidth={2.5}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CinemaSnacks;