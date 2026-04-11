import  { useState } from 'react'
import { useAppData } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import type { ICart, IMenuItem, IRestaurant } from '../types';
import { restaurantService } from '../main';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { VscLoading } from 'react-icons/vsc';
import { BiMinus, BiPlus} from 'react-icons/bi';
import { TbTrash } from 'react-icons/tb';



 
const Cart = () => {
  const {cart, subTotal, quantity, fetchCart}=useAppData();
  const navigate=useNavigate();
  const [loadingItemId, setLoadingItemId]=useState<string|null>(null);
  const [clearingCart, setClearingCart]=useState(false);
  if(!cart || cart.length===0){
    return(
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text--lg"> Your Cart is Empty</p>
      </div>
    );
  }
  const restaurant=cart[0].restaurantId as IRestaurant;
  const deliveryFee=subTotal <250 ? 49:0;
  const platformFee=7;
  const grandTotal=subTotal+deliveryFee+platformFee;
  const increaseQty=async(itemId:string)=>{
    try{
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/inc`,
        {itemId},
        {headers:{
          Authorization:`Bearer ${localStorage.getItem('token')}`,
        },
      }
      );
      await fetchCart();

    } catch(error){
      toast.error('Failed to increase quantity');
    } finally{
      setLoadingItemId(null);
    }
  }
  
  const decreaseQty=async(itemId:string)=>{
    try{
      setLoadingItemId(itemId);
      await axios.put(
        `${restaurantService}/api/cart/dec`,
        {itemId},
        {headers:{
          Authorization:`Bearer ${localStorage.getItem('token')}`,
        },
      }
      );
      await fetchCart();

    } catch(error){
      toast.error('Failed to increase quantity');
    } finally{
      setLoadingItemId(null);
    }
  }
  const clearCart=async()=>{
    const confirmClear=window.confirm('Are you sure you want to clear the cart?');
    if(!confirmClear) return;
    try{
      setClearingCart(true);
      
      await axios.delete(
        `${restaurantService}/api/cart/clear`,
        {headers:{
          Authorization:`Bearer ${localStorage.getItem('token')}`,
        },
      }
      );
      await fetchCart();

    } catch(error){
      toast.error('Failed to increase quantity');
    } finally{
      setClearingCart(false);
    }
  };
  const checkout=()=>{
    navigate('/checkout');
  }
  return (<div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{restaurant.name}</h2>
        <p className="text-gray-500 text-sm">{restaurant.autoLocation.formattedAddress}</p>
      </div>
      <div className="space-y-4">
        {cart.map((cartItem:ICart)=>{
          const item=cartItem.itemId as IMenuItem;
          const isLoading=loadingItemId===item._id;
          return( 
          <div key={item._id} className="flex items-center rounded-xl bg-white p-4 shadow-sm"
          >
              <img src={item.image} alt="" className="h-20 w-20 object-cover rounded-md" 
              />
              <div className="flex-1 px-2">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm  text-gry-500">₹{item.price * cartItem.quantity}</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="rounded-full border p-2 hover:bg-gray-100 disabled:opacity-50"
                disabled={isLoading}
                onClick={()=>decreaseQty(item._id)}
                >
                  {isLoading?(
                    <VscLoading size={16} className="animate-spin"/>
                  ):(
                    <BiMinus size={16}/>
                  )}
                </button>
                <button>
                  <span className="font-medium">{cartItem.quantity}</span>
                </button>
                <button className="rounded-full border p-2 hover:bg-gray-100 disabled:opacity-50"
                disabled={isLoading}
                onClick={()=>increaseQty(item._id)}
                >
                  {isLoading?(
                    <VscLoading size={16} className="animate-spin"/>
                  ):(
                    <BiPlus size={16}/>
                  )}
                </button>
              </div>
              <p className="w-20 text-right font-medium">₹{item.price * cartItem.quantity}</p>
          </div>
          );
        })}
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex justify-between font-semibold">
          <span>Total Items:</span>
          <span>{quantity}</span>
        </div>
        <div className="flex justify-between text-sm">
          
          <span>Subtotal:</span>
          <span>₹{subTotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery Fee:</span>
          <span>₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Platform Fee:</span>
          <span>₹{platformFee}</span>
        </div>
        {
          subTotal<250 && (
            <p className="mt-2 text-sm text-gray-500">
              Add Item worth ₹{250-subTotal} more for free delivery
            </p>
          )}
          <div className="flex justify-between text-base font-semibold border-t pt-2">
            <span>Grand Total</span>
            <span>₹{grandTotal}</span>
          </div>
          <button onClick={checkout} className={`mt-3 w-full rounded-lg bg-[#E23744] py-3 text-sm font-semibold text-white hover:bg-red-800 ${!restaurant.isOpen? "opacity-50 cursor-not-allowed":"" } justify-center items-center gap-50`}
          disabled={!restaurant.isOpen}>
           {!restaurant.isOpen ? "Restaurant is Closed": "Proceed to Checkout"}
            
          </button>
          <button onClick={clearCart} className="mt-3 w-full rounded-lg bg-[#222222] py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 justify-center items-center gap-50">
            Clear Cart <TbTrash size={16} className="inline"/>
          </button>
        </div>
      </div>
  );
};

export default Cart;