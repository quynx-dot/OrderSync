import { useState, useEffect } from "react";
import { useAppData } from "../context/AppContext";
import { restaurantService, utilsService } from "../main";
import axios from "axios";
import { useNavigate } from "react-router";
import type { ICart, IMenuItem, IRestaurant } from "../types";
import toast from "react-hot-toast";
import { BiCreditCard, BiLoader } from "react-icons/bi";
import { loadStripe } from "@stripe/stripe-js";


interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const CheckoutPage = () => {
  const { cart, subTotal, quantity  } = useAppData();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }
      try {
        const { data } = await axios.get(`${restaurantService}/api/address/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAddresses(data || []);
      } catch (error) {
        console.log(error);
        toast.error("Failed to load addresses");
      } finally {
        setLoadingAddress(false);
      }
    };
    fetchAddresses();
  }, [cart]);

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-lg">Your cart is empty.</p>
      </div>
    );
  }

  const restaurant = cart[0].restaurantId as IRestaurant;
  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const grandTotal = subTotal + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address");
      return null;
    }
    setCreatingOrder(true);
    try {
      const { data } = await axios.post(
        `${restaurantService}/api/order/new`,
        { paymentMethod, addressId: selectedAddressId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return data;
    } catch (error: any) {
      console.error("createOrder error:", error);
      toast.error(error.response?.data?.message || "Failed to create order.");
      return null;
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setLoadingRazorpay(true);
      const order = await createOrder("razorpay");
      if (!order) {
        setLoadingRazorpay(false);
        return;
      }

      const { orderId, amount } = order;
      console.log("Order created:", { orderId, amount });

      const { data } = await axios.post(
        `${utilsService}/api/payment/create`,
        { orderId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Razorpay order:", data);
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
            console.error("Verify error:", error);
            toast.error("Payment verification failed.");
          }
        },
        theme: { color: "#E23744" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("payWithRazorpay error:", error);
      toast.error(error.response?.data?.message || "Failed to initiate payment.");
    } finally {
      setLoadingRazorpay(false);
    }
  };
const stripePromise=loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  const payWithStripe = async () => {
    setLoadingStripe(true);
    try {
      const order = await createOrder("stripe");

      if (!order) {
        setLoadingStripe(false);
        return;
      }
       const {orderId } = order;
      try{
        const stripe = await stripePromise;
        const { data } = await axios.post(
          `${utilsService}/api/payment/stripe/create`,
          { orderId },
        );
        if(data.url)  {
          window.location.href = data.url;
        } else {
          toast.error("Failed to create Stripe session.");
        } 
      } catch (error) {
        console.error("Stripe error:", error);
        toast.error("Failed to initiate Stripe payment.");
      }

      const { data } = await axios.post(
        `${utilsService}/api/payment/create-stripe-session`,
        { orderId: order.orderId }
      );
      const { sessionId } = data;
      const stripe = (window as any).Stripe(
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
      );
      await stripe.redirectToCheckout({ sessionId });
    } catch (error: any) {
      console.error("payWithStripe error:", error);
      toast.error("Failed to initiate Stripe payment.");
    } finally {
      setLoadingStripe(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">{restaurant.name}</h2>
        <p className="text-sm text-gray-600">
          {restaurant.autoLocation.formattedAddress}
        </p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
        {loadingAddress ? (
          <p className="text-sm text-gray-500">Loading addresses...</p>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-500">
            No addresses found. Please add one.
          </p>
        ) : (
          addresses.map((add) => (
            <label
              key={add._id}
              className={`flex gap-3 border p-3 rounded-lg cursor-pointer transition mb-2 ${
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
              <div>
                <p className="font-medium text-sm">{add.formattedAddress}</p>
                <p className="text-xs text-gray-500">{add.mobile}</p>
              </div>
            </label>
          ))
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="text-lg font-semibold">Order Summary</h3>
        {cart.map((cartItem: ICart) => {
          const item = cartItem.itemId as IMenuItem;
          return (
            <div className="flex justify-between text-sm" key={cartItem._id}>
              <span>
                {item.name} x {cartItem.quantity}
              </span>
              <span>₹{item.price * cartItem.quantity}</span>
            </div>
          );
        })}
        <hr />
        <div className="flex justify-between text-sm">
          <span>Items ({quantity})</span>
          <span>₹{subTotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Platform Fee</span>
          <span>₹{platformFee}</span>
        </div>
        {subTotal < 250 && (
          <p className="text-sm text-gray-500">
            Add ₹{250 - subTotal} more to get free delivery
          </p>
        )}
        <div className="flex justify-between text-base font-semibold border-t pt-2">
          <span>Grand Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3">
        <h3 className="font-semibold">Payment Method</h3>
        <button
          disabled={!selectedAddressId || loadingRazorpay || creatingOrder}
          onClick={payWithRazorpay}
          className="flex w-full items-center justify-center gap-2 bg-[#2d7ff9] py-3 px-4 text-sm text-white hover:bg-blue-600 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loadingRazorpay ? (
            <BiLoader size={18} className="animate-spin" />
          ) : (
            <BiCreditCard size={18} />
          )}
          Pay with Razorpay
        </button>
        <button
          disabled={!selectedAddressId || loadingStripe || creatingOrder}
          onClick={payWithStripe}
          className="flex w-full items-center justify-center gap-2 bg-black py-3 px-4 text-sm text-white hover:bg-gray-800 rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loadingStripe ? (
            <BiLoader size={18} className="animate-spin" />
          ) : (
            <BiCreditCard size={18} />
          )}
          Pay with Stripe
        </button>
      </div>
    </div>
  );
};

export default CheckoutPage;