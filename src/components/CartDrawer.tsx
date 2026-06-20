'use client';

import React from 'react';
import { useCartStore } from '@/store/cartStore';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, totalAmount, clearCart } = useCartStore();

  if (!isOpen) return null;

  const handleCheckout = async () => {
    const total = totalAmount();
    if (total <= 0) return;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        alert(data.error || 'Payment initialization failed. Please try again.');
        return;
      }

      // Handle mock orders in development (no Razorpay keys configured)
      if (data._mock) {
        alert(`[Dev Mode] Mock order created: ${data.id}\nAmount: ₹${total}`);
        clearCart();
        toggleCart();
        return;
      }

      // Ensure Razorpay SDK is loaded
      if (typeof (window as any).Razorpay === 'undefined') {
        alert('Payment gateway is still loading. Please try again in a moment.');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'TEST_KEY',
        amount: data.amount,
        currency: data.currency,
        name: 'Restless Action Drink',
        description: 'Purchase Order',
        order_id: data.id,
        handler: function (res: any) {
          alert(`Payment successful! Payment ID: ${res.razorpay_payment_id}`);
          clearCart();
          toggleCart();
        },
        theme: { color: '#E50914' },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('[Checkout Error]', error);
      alert('Something went wrong. Please check your connection and try again.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={toggleCart} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-dark border-l border-white/10 z-[101] flex flex-col shadow-2xl transform transition-transform duration-300">
        
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-red" />
            Your Supply
          </h2>
          <button onClick={toggleCart} className="text-white/50 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
              <ShoppingBag className="w-16 h-16 opacity-50" />
              <p className="font-bold uppercase tracking-widest text-sm">Cart is Empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 border border-white/5 bg-white/5 p-4 relative group">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute -top-2 -right-2 bg-brand-red text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className={`w-20 h-20 ${item.color} flex-shrink-0 flex items-center justify-center font-black uppercase text-xs transform -skew-x-6 text-white text-center px-1`}>
                  {item.name} Can
                </div>
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold uppercase tracking-widest text-white text-sm">{item.name}</h3>
                    <p className="text-white/50 font-medium mt-1">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border border-white/20">
                      <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="p-1 hover:bg-white/10 text-white"><Minus className="w-4 h-4" /></button>
                      <span className="px-3 text-sm font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-white/10 text-white"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black">
            <div className="flex justify-between items-center mb-6 text-white">
              <span className="font-bold uppercase tracking-widest text-white/50">Total</span>
              <span className="text-3xl font-black">₹{totalAmount()}</span>
            </div>
            <button onClick={handleCheckout} className="w-full py-4 bg-brand-red text-white font-black uppercase tracking-widest hover:opacity-90 transition-opacity transform -skew-x-6">
              <span className="transform skew-x-6 inline-block">Checkout</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
