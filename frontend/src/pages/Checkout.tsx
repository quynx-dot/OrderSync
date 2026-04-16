import { useState,useEffect } from "react";
import { useAppData } from "../context/AppContext";
import { restaurantService, utilsService } from "../main";
import axios from "axios";
import { useNavigate } from "react-router";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import { toast } from "react-hot-toast/headless";
import { BiCreditCard, BiLoader } from "react-icons/bi";

interface Address{
  _id:string,
  formattedAddress:string,
  mobile:number;
}

const CheckoutPage = () => {
  const {cart, subTotal, quantity} =useAppData();
  const [addresses,setAddresses]=useState<Address[]>([]);
  const [selectedAddressId,setSelectedAddressId]=useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);  
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(()=>{
    const fetchAddresses=async()=>{
      if(!cart || cart.length===0) {
        setLoadingAddress(false);
        return;
      }
      try{
        const {data}=await axios.get(`${restaurantService}/api/address/all`,{
          headers:{
            Authorization:`Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAddresses(data || []);
      }catch(error){
        console.log(error);
      }finally{
        setLoadingAddress(false);
      }
    };
    fetchAddresses();
  },[cart]); 
    const navigate=useNavigate(); 
  if(!cart || cart.length===0){
    return <div className="flex min-h-[60vh] item-center justify-center">
      <p className="text-gray-500 text-lg">Your cart is empty.</p> </div>
  }

  const restaurant=cart[0].restaurantId as IRestaurant;
  const deliveryFee=subTotal<250?49:0;
  const platformFee=7;
  const grandTotal=subTotal+deliveryFee+platformFee;
  const createOrder=async(paymentMethod:"razorpay" | "stripe")=>{
    if(!selectedAddressId) return null;
    setCreatingOrder(true);
    try {
      const {data}=await axios.post(`${restaurantService}/api/order/new`,{
        paymentMethod,
        addressId:selectedAddressId,
      },
      {
        headers:{
          Authorization:`Bearer ${localStorage.getItem("token")}`,
        },
      });
      return data;
    } catch (error) {
      toast.error("Failed to create order. Please try again.");
    } finally{
      setCreatingOrder(false);
    }
  };
  const payWithRazorpay = async () => {
  setLoadingRazorpay(true);

  try {
    const order = await createOrder("razorpay");
    if (!order) {
      setLoadingRazorpay(false);
      return;
    }

    const { orderId, amount } = order;

    const { data } = await axios.post(`${utilsService}/api/payment/create`, {
      orderId,
    });

    const { razorpayOrderId, key } = data;

    const options = {
      key,
      amount: amount * 100,
      currency: "INR",
      name: "OrderSync",
      description: "Order Payment",
      order_id: razorpayOrderId,
      handler: async (response: any) => {
        try {
          await axios.post(`${utilsService}/api/payment/verify`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId,
          });

          toast.success("Payment successful!");
          navigate("/paymentsuccess/" + response.razorpay_payment_id);
        } catch (error) {
          toast.error("Payment verification failed.");
        }
      },
      theme: {
        color: "#E23744",
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();

  } catch (error) {
    toast.error("Failed to initiate Razorpay payment.");
  } finally {
    setLoadingRazorpay(false);
  }
};
const payWithStripe=async()=>{
  setLoadingStripe(true);
  try {
    const order=await createOrder("stripe");
    if(!order){
      setLoadingStripe(false);
      return;
    }
    const {data}=await axios.post(`${utilsService}/api/payment/create-stripe-session`,{
      orderId:order.orderId,
    });
    const {sessionId}=data;
    const stripe= (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    await stripe.redirectToCheckout({sessionId});
  }

    catch (error) {
      toast.error("Failed to initiate Stripe payment.");
    } finally{
      setLoadingStripe(false);
    }
}

  return( <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">{restaurant.name}</h2>
        <p className=" tet-sm text-gray-600">{restaurant.autoLocation.formattedAddress}</p>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
        {loadingAddress ?<p className="text-sm text-gray-500">Loading addresses...
        </p>: addresses.length === 0 ?<p className="text-sm text-gray-500">No addresses found. Please add one</p>:addresses.map((add) => (
              <label key={add._id}
                className={`flex gap-3 border p-3 rounded-lg cursor-pointer transition ${
                  selectedAddressId === add._id
                    ? "border-[#e23744] bg-red-50"
                    : "border-gray-300"
                }`}
              >
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === add._id}
                onChange={() => setSelectedAddressId(add._id)}
              />
              <div >
                <p className="font-medium text-sm">{add.formattedAddress}</p>
                <p className="text-xs text-gray-500">{add.mobile}</p>
              </div>
              </label>
            ))
          }
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
         {  
          cart.map((cartItem: ICart)=>{
          const item=cartItem.itemId as IMenuItem;
          return( <div className="flex justify-between text-sm" key={cartItem._id}>
            <span>
              {item.name} x {cartItem.quantity}
            </span>
            <span>
              ₹{item.price * cartItem.quantity} 
            </span>
          </div>
          );
        })
      }
      <hr />
      <div className="flex justify-between text-sm">
        <span>Items ({quantity})</span>
        <span>₹{subTotal}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Delivery Fee</span>
        <span>{deliveryFee===0?"Free":`₹${deliveryFee}`}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Platform Fee</span>
        <span>₹{platformFee}</span>
      </div>
      <div className="flex justify-between text-lg font-semibold">
    </div>
    <div className="flex justify-between text-lg font-semibold">      
    </div>
    {subTotal<250 &&(
      <p className="text-sm text-gray-500">Add ₹{250-subTotal} more to get free delivery</p>        
    )}
    <div className="flex justify-between text-base font-semibold border-t pt-2">
      <span>Grand Total</span>
      <span>₹{grandTotal}</span>
    </div>
  </div>
  <div className="rounded-xl bg-white  p-4 shadow-sm space-y-3">
    <h3 className="font-semibold">Payment Method</h3>
    <button disabled={!selectedAddressId || loadingRazorpay ||creatingOrder }
    onClick={payWithRazorpay}
    className=" flex w-full items-center justify-center gap-2 bg-[#2d7ff9] py-2 px-4 text-sm text-white hover:bg-blue-500 rounded disabled:bg-gray-300 disabled:cursor-not-allowed opacity-50" 
    >
      {loadingRazorpay ?(
        <BiLoader size={18} className="animate-spin"/>
        
      ):(
        <BiCreditCard size={18} />  
      )}
      Pay with Razorpay
    </button>
    <button disabled={!selectedAddressId || loadingRazorpay ||creatingOrder }
    onClick={payWithRazorpay}
    className=" flex w-full items-center justify-center gap-2 bg-black py-2 px-4 text-sm text-white hover:bg-blue-500 rounded disabled:bg-gray-300 disabled:cursor-not-allowed opacity-50" 
    >
      {loadingRazorpay ?(
        <BiLoader size={18} className="animate-spin"/>
        
      ):(
        <BiCreditCard size={18} />  
      )}
      Pay with Stripe
    </button>
  </div>
  </div>
  );
  
};

export default CheckoutPage;
