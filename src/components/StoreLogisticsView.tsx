import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Edit, 
  Layers, 
  ShoppingCart, 
  FileText,
  ChevronDown,
  ChevronUp,
  Package,
  Boxes,
  Receipt
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PetProduct, ProductCategory, Order, User } from '../types';
import { api } from '../services/api';

interface StoreLogisticsViewProps {
  products: PetProduct[];
  categories: ProductCategory[];
  orders: Order[];
  users: User[];
  onRefresh: () => void;
}

export const StoreLogisticsView: React.FC<StoreLogisticsViewProps> = ({
  products,
  categories,
  orders,
  users,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'categories'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PetProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Expanded orders in order history
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  // Product form
  const [productForm, setProductForm] = useState({
    product_name: '',
    price: '',
    stock_quantity: '',
    category_id: categories[0]?.category_id || 1,
  });

  // Category form
  const [newCategoryName, setNewCategoryName] = useState('');

  // Cart / Checkout form state
  const [checkoutUser, setCheckoutUser] = useState<number>(users[0]?.user_id || 1);
  const [cartItems, setCartItems] = useState<Array<{ product_id: number; quantity: number }>>([
    { product_id: products[0]?.product_id || 1, quantity: 1 }
  ]);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || String(p.category_id) === selectedCategory;
    const matchesStock = stockStatusFilter === 'ALL' || p.stock_status === stockStatusFilter;
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Handle Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.product_id, {
          product_name: productForm.product_name,
          price: parseFloat(productForm.price),
          stock_quantity: parseInt(productForm.stock_quantity),
          category_id: Number(productForm.category_id),
        });
        setFeedback({ type: 'success', message: `Product ${productForm.product_name} updated successfully!` });
      } else {
        await api.createProduct({
          product_name: productForm.product_name,
          price: parseFloat(productForm.price),
          stock_quantity: parseInt(productForm.stock_quantity),
          category_id: Number(productForm.category_id),
        });
        setFeedback({ type: 'success', message: `Product ${productForm.product_name} added to inventory!` });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({
        product_name: '',
        price: '',
        stock_quantity: '',
        category_id: categories[0]?.category_id || 1,
      });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Delete product ${name} from inventory catalog?`)) return;
    try {
      await api.deleteProduct(id);
      setFeedback({ type: 'success', message: `Product ${name} removed.` });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await api.createCategory(newCategoryName.trim());
      setFeedback({ type: 'success', message: `Category '${newCategoryName}' added successfully!` });
      setShowCategoryModal(false);
      setNewCategoryName('');
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Cart operations
  const handleAddCartRow = () => {
    const availableProd = products.find(p => p.stock_quantity > 0) || products[0];
    if (availableProd) {
      setCartItems([...cartItems, { product_id: availableProd.product_id, quantity: 1 }]);
    }
  };

  const handleRemoveCartRow = (index: number) => {
    if (cartItems.length > 1) {
      setCartItems(cartItems.filter((_, i) => i !== index));
    }
  };

  const handleUpdateCartRow = (index: number, field: 'product_id' | 'quantity', value: number) => {
    const next = [...cartItems];
    next[index] = { ...next[index], [field]: value };
    setCartItems(next);
  };

  // Calculate cart total
  const calculatedTotal = cartItems.reduce((sum, item) => {
    const prod = products.find(p => p.product_id === item.product_id);
    return sum + (prod ? prod.price * item.quantity : 0);
  }, 0);

  // Handle Order Checkout
  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await api.checkoutOrder({
        user_id: Number(checkoutUser),
        items: cartItems.map(it => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) }))
      });

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      setFeedback({ type: 'success', message: `${res.message} Total: ৳${Number(res.total_amount).toLocaleString()}` });
      setShowCheckoutModal(false);
      setCartItems([{ product_id: products[0]?.product_id || 1, quantity: 1 }]);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOrderExpand = (orderId: number) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const openEditProduct = (prod: PetProduct) => {
    setEditingProduct(prod);
    setProductForm({
      product_name: prod.product_name,
      price: String(prod.price),
      stock_quantity: String(prod.stock_quantity),
      category_id: prod.category_id || categories[0]?.category_id || 1,
    });
    setShowProductModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Feedback message */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-700 text-rose-200'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-stone-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-100">Pet Store & Supply Logistics</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-medium">
                Inventory • POS Orders • Multi-Item Orders
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Manage shelter supplies, execute atomic multi-item POS customer orders, and maintain automated safety restock triggers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  product_name: '',
                  price: '',
                  stock_quantity: '',
                  category_id: categories[0]?.category_id || 1,
                });
                setShowProductModal(true);
              }}
              id="add-product-btn"
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Add Product
            </button>
            <button
              onClick={() => setShowCheckoutModal(true)}
              id="pos-checkout-btn"
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              POS Order / Checkout
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-stone-800 mt-6 space-x-6 text-sm">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'inventory'
                ? 'text-amber-400 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'orders'
                ? 'text-amber-400 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Order History & Items ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-3 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'categories'
                ? 'text-amber-400 border-b-2 border-amber-500'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Boxes className="w-4 h-4" />
            Product Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* INVENTORY CATALOG TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-stone-900 border border-stone-800 p-3 rounded-2xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={String(c.category_id)}>
                    {c.category_name}
                  </option>
                ))}
              </select>

              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="In Stock">In Stock Only</option>
                <option value="Low Stock">Low Stock (≤ 5 units)</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-950 text-stone-400 uppercase tracking-wider text-[10px] font-bold border-b border-stone-800">
                  <tr>
                    <th className="px-4 py-3">SKU / ID</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Stock Units</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.stock_quantity <= 5 && prod.stock_quantity > 0;
                    const isOut = prod.stock_quantity === 0;

                    return (
                      <tr key={prod.product_id} className="hover:bg-stone-850/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-stone-500 font-bold">#{prod.product_id}</td>
                        <td className="px-4 py-3 font-bold text-stone-100">{prod.product_name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px] font-medium border border-stone-700">
                            {prod.category_name || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">
                          ৳{Number(prod.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono text-stone-200">
                          {prod.stock_quantity}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                              isOut
                                ? 'bg-rose-950 text-rose-300 border-rose-800'
                                : isLow
                                ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            {isLow && <AlertTriangle className="w-3 h-3" />}
                            {prod.stock_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditProduct(prod)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.product_id, prod.product_name)}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-950 hover:text-rose-400 text-stone-400 text-xs transition-colors cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ORDER HISTORY & ITEMS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-stone-850 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-100">Customer Orders & Multi-Item Breakdown</h3>
                <p className="text-xs text-stone-400">Linked across Orders and Order_Items relational tables.</p>
              </div>
              <span className="text-xs text-stone-400 font-mono">Total Orders: {orders.length}</span>
            </div>

            <div className="divide-y divide-stone-800/80">
              {orders.map((order) => {
                const isExpanded = expandedOrders[order.order_id];
                return (
                  <div key={order.order_id} className="p-4 hover:bg-stone-850/40 transition-colors">
                    {/* Order summary row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 flex items-center justify-center font-bold">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-stone-100 text-sm">Order #{order.order_id}</span>
                            <span className="text-xs text-stone-400">• {order.order_date}</span>
                          </div>
                          <div className="text-xs text-stone-300 font-medium">
                            Customer: <span className="text-emerald-400">{order.customer_name}</span> ({order.customer_email || order.customer_phone || 'User'})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-stone-500 uppercase block font-semibold">Total Amount</span>
                          <span className="text-base font-extrabold font-mono text-emerald-400">
                            ৳{Number(order.total_amount).toFixed(2)}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleOrderExpand(order.order_id)}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
                        >
                          {order.items?.length || 0} Items
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Order Items Table */}
                    {isExpanded && order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-stone-800/80 bg-stone-950 rounded-xl p-3">
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                          Order_Items Relation Records (Order #{order.order_id})
                        </span>
                        <table className="w-full text-left text-xs text-stone-300">
                          <thead>
                            <tr className="text-stone-500 text-[10px] uppercase border-b border-stone-800">
                              <th className="pb-1.5">Product Name</th>
                              <th className="pb-1.5">Category</th>
                              <th className="pb-1.5">Quantity</th>
                              <th className="pb-1.5">Unit Price</th>
                              <th className="pb-1.5 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-900">
                            {order.items.map((item, idx) => (
                              <tr key={`${order.order_id}-${item.product_id}-${idx}`}>
                                <td className="py-2 font-semibold text-stone-200">{item.product_name}</td>
                                <td className="py-2 text-stone-400 text-[11px]">{item.category_name}</td>
                                <td className="py-2 font-mono">{item.quantity}</td>
                                <td className="py-2 font-mono">৳{Number(item.price).toFixed(2)}</td>
                                <td className="py-2 font-mono font-bold text-right text-emerald-400">
                                  ৳{(Number(item.price) * item.quantity).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add New Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.category_id} className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-stone-100 text-sm">{c.category_name}</h4>
                  </div>
                  <span className="text-xs font-mono text-stone-500">ID: {c.category_id}</span>
                </div>
                <div className="text-xs text-stone-400">
                  {c.product_count !== undefined ? `${c.product_count} Products assigned` : 'Active category'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                {editingProduct ? 'Update Product' : 'Add Inventory Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  placeholder="e.g. Royal Canin Maxi Adult 4kg"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Price (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 750.00"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Product Category</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm({ ...productForm, category_id: Number(e.target.value) })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Save to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS ORDER CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                Point of Sale / Create Customer Order
              </h3>
              <button onClick={() => setShowCheckoutModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleProcessOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Select Customer / User *</label>
                <select
                  value={checkoutUser}
                  onChange={(e) => setCheckoutUser(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name} ({u.email}) - {u.user_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multi-Item Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-stone-300 font-bold">Order Items & Quantities</label>
                  <button
                    type="button"
                    onClick={handleAddCartRow}
                    className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="space-y-2.5 bg-stone-950 p-3 rounded-xl border border-stone-800">
                  {cartItems.map((item, index) => {
                    const selectedProd = products.find(p => p.product_id === item.product_id);
                    const isExceeding = selectedProd && item.quantity > selectedProd.stock_quantity;

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleUpdateCartRow(index, 'product_id', Number(e.target.value))}
                          className="flex-1 bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-200 focus:outline-none focus:border-amber-500"
                        >
                          {products.map((p) => (
                            <option key={p.product_id} value={p.product_id} disabled={p.stock_quantity <= 0}>
                              {p.product_name} (৳{Number(p.price).toFixed(2)} - Stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>

                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            max={selectedProd?.stock_quantity || 99}
                            value={item.quantity}
                            onChange={(e) => handleUpdateCartRow(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-200 text-center font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        {cartItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCartRow(index)}
                            className="p-1.5 rounded-lg bg-stone-900 hover:bg-rose-950 text-stone-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-500 block uppercase font-bold">Total Payable</span>
                  <span className="text-xs text-stone-400">Includes all {cartItems.length} line item(s)</span>
                </div>
                <span className="text-xl font-extrabold font-mono text-emerald-400">
                  ৳{calculatedTotal.toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || calculatedTotal <= 0}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Processing Transaction...' : 'Complete Order & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="font-extrabold text-base text-stone-100">Add Product Category</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Grooming & Hygiene"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-800 text-stone-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-stone-950 font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
