import axios from "axios";
import { useSearchParams } from "react-router-dom"
import { utilsService } from "../main";
import toast from "react-hot-toast";
import { useEffect } from "react";

const OrderSuccess = () => {
  const [params]=useSearchParams();
  const sessionId=params.get("session_id");
  useEffect(()=>{
    const verifyPayment=async()=>{
      try{
        await axios.post(`${utilsService}/api/payment/verify`,{
          sessionId,
        })
      }catch(error){
        toast.error("Stripe payment verification failed.");
        console.log(error); 
      }
  };
verifyPayment();
  },[sessionId]);
  return (
    <div className="flex h-[60vh] items-center justify-center ">
      <h1 className="text-2xl font-bold text-green-600">Payment Successful! Your order has been placed.</h1>
      
    </div>
  )
}

export default OrderSuccess
