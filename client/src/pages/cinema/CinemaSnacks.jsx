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

    const fetchSnacks = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            // We fetch the specific theater's menu.
            const { data } = await axios.get('/api/snacks/my-menu', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if(data.success) setSnacks(data.snacks);
        } catch (error) { 
            toast.error("Failed to load local menu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSnacks(); }, []);

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
        } catch (error) { toast.error("Delete failed"); }
    };

    if (loading) return <Loading />;

    return (
        <div className='pb-20 max-w-7xl mx-auto text-white font-outfit animate-fadeIn'>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Title text1="Local" text2="Inventory" />
                    <p className="text-gray-500 text-sm mt-1 font-medium">Manage the F&B menu strictly for your cinema location.</p>
                </div>
                {isEditMode && (
                    <button onClick={resetForm} className="text-xs bg-red-500/10 text-red-500 px-4 py-2 rounded-lg border border-red-500/20 flex items-center gap-2 hover:bg-red-500 hover:text-white transition font-bold shadow-lg">
                        <X size={14}/> Cancel Edit
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- LEFT: ADD / EDIT FORM --- */}
                <div className="lg:col-span-4">
                    <div className={`bg-[#0c0c0c] p-6 rounded-3xl border transition-all duration-300 shadow-2xl sticky top-6 ${isEditMode ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-white/5'}`}>
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <div className={`p-3 rounded-xl border ${isEditMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                {isEditMode ? <Edit2 size={24}/> : <Utensils size={24}/>}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white tracking-tight">{isEditMode ? 'Edit Item' : 'New Menu Item'}</h3>
                                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold mt-0.5">Local Catalog</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Preview Box */}
                            <div className="w-full aspect-video bg-[#151515] rounded-xl border border-white/5 flex items-center justify-center overflow-hidden mb-4 relative shadow-inner">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'}} />
                                ) : (
                                    <div className="flex flex-col items-center text-gray-600"><ImageIcon size={32} className="mb-2 opacity-50"/><span className="text-[10px] font-bold uppercase tracking-wider">Image URL Preview</span></div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Item Name</label>
                                <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-[#151515] border border-white/10 focus:border-orange-500 rounded-xl p-3 text-sm text-white outline-none transition-colors shadow-inner" placeholder="e.g. Cheese Popcorn"/>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Category</label>
                                    <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full bg-[#151515] border border-white/10 focus:border-orange-500 rounded-xl p-3 text-sm text-white outline-none transition-colors appearance-none cursor-pointer">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Price</label>
                                    <div className="relative">
                                        <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                                        <input type="number" required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full bg-[#151515] border border-white/10 focus:border-orange-500 rounded-xl p-3 pl-8 text-sm text-white outline-none transition-colors shadow-inner font-mono" placeholder="250"/>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Image URL</label>
                                <input required value={formData.image} onChange={e=>setFormData({...formData, image: e.target.value})} className="w-full bg-[#151515] border border-white/10 focus:border-orange-500 rounded-xl p-3 text-sm text-white outline-none transition-colors shadow-inner" placeholder="https://..."/>
                            </div>
                            
                            <div>
                                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Description (Optional)</label>
                                <textarea value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full bg-[#151515] border border-white/10 focus:border-orange-500 rounded-xl p-3 text-sm text-white outline-none transition-colors shadow-inner resize-none h-20 custom-scrollbar" placeholder="A large tub of freshly popped..."/>
                            </div>
                            
                            <button disabled={isSubmitting} type="submit" className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 ${isEditMode ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-[0_0_20px_rgba(234,88,12,0.3)]'}`}>
                                {isSubmitting ? "Saving..." : isEditMode ? <><CheckIcon size={18} strokeWidth={3}/> Update Item</> : <><Plus size={18} strokeWidth={3}/> Publish to Local Menu</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* --- RIGHT: LOCAL MENU LIST --- */}
                <div className="lg:col-span-8">
                    <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 shadow-2xl min-h-[500px]">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Active Menu Display</h3>
                                <p className="text-xs text-gray-500 mt-1">This is what guests see on the app for your cinema.</p>
                            </div>
                            <span className="bg-white/5 text-gray-300 px-4 py-1.5 rounded-full text-xs font-bold border border-white/10">Total Items: {snacks.length}</span>
                        </div>

                        {snacks.length === 0 ? (
                            <div className="bg-[#151515] border border-white/5 border-dashed rounded-3xl p-16 text-center text-gray-500 flex flex-col items-center">
                                <Utensils size={48} className="mb-4 opacity-20"/>
                                <p className="text-lg font-bold text-gray-400">Menu is empty.</p>
                                <p className="text-sm mt-1">Add your first snack using the form to start generating F&B revenue.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-max">
                                {snacks.map(snack => (
                                    <div key={snack._id} className={`flex gap-4 p-4 rounded-2xl relative group transition-all duration-300 ${editingId === snack._id ? 'bg-blue-500/10 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : !snack.isActive ? 'bg-[#0f0f0f] border border-red-500/20 opacity-70 grayscale-[50%]' : 'bg-[#151515] border border-white/5 hover:border-white/20 hover:bg-[#1a1a1a]'}`}>
                                        
                                        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-black shadow-md border border-white/5 relative">
                                            <img src={snack.image} alt={snack.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                                            {!snack.isActive && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 shadow-lg">Sold Out</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between py-0.5 pr-8">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-white leading-tight mb-1 line-clamp-1 pr-2">{snack.name}</h4>
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-black px-1.5 py-0.5 rounded border border-gray-800 shrink-0">{snack.category || 'Popcorn'}</span>
                                            </div>
                                            
                                            <div className="flex items-end justify-between mt-3">
                                                <p className="text-orange-400 font-bold flex items-center bg-orange-500/10 w-fit px-2 py-1 rounded border border-orange-500/20 text-sm font-mono shadow-inner">
                                                    <IndianRupee size={12} className="mr-0.5"/> {snack.price}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons - Quick Access */}
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleToggleStock(snack._id, snack.isActive)} 
                                                className={`p-2 rounded-lg transition-colors shadow-lg border ${snack.isActive ? 'bg-black hover:bg-red-500/20 text-gray-400 hover:text-red-400 border-white/10 hover:border-red-500/30' : 'bg-red-500/20 text-red-400 hover:bg-emerald-500/20 hover:text-emerald-400 border-red-500/30 hover:border-emerald-500/30'}`} 
                                                title={snack.isActive ? "Mark Out of Stock" : "Restock Item"}
                                            >
                                                {snack.isActive ? <Power size={14}/> : <AlertCircle size={14}/>}
                                            </button>
                                            <button onClick={() => handleEditClick(snack)} className="bg-black hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 p-2 rounded-lg transition-colors shadow-lg border border-white/10 hover:border-blue-500/30" title="Edit Details">
                                                <Edit2 size={14}/>
                                            </button>
                                            <button onClick={() => handleDelete(snack._id)} className="bg-black hover:bg-red-500 text-gray-400 hover:text-white p-2 rounded-lg transition-colors shadow-lg border border-white/10 hover:border-red-500/50" title="Permanently Delete">
                                                <Trash2 size={14}/>
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