import { useNavigate, useParams } from "react-router-dom"
import { useAppData } from "../context/AppContext"
import { useEffect } from "react"
import { BiCheckCircle } from "react-icons/bi"
import { BsArrowRight } from "react-icons/bs"


const PaymentSucces = () => {
    const {paymentId}=useParams<{paymentId:string}>()
    const navigate=useNavigate()
    const {fetchCart}=useAppData()
    useEffect(()=>{
      fetchCart();
    },[]);
  return <div className="flex min-h-[70vh] items-center justify-center px-4">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm text-center space-y-4">
      
      <BiCheckCircle size={64}  className="mx-auto text-green-500" />
      <h1 className="text-2xl font-bold text-gray-800">Payment Successful!</h1>
      <p className="text-sm text-gray-500">Your payment has been placed successfully.</p>
      {paymentId &&(
        <div className="rounded-lg">
          <span className="text-sm text-white">
            Payment ID:
          </span>
          <p className="text-gray-300 break-all font-mono">{paymentId}</p>
        </div>
       
      )}
       <div className="space-y-2 pt-2">
         <button className="flex w-full items-center justify-center gap-2 bg-[#e23744] py-3 px-4 text-sm text-white font-semibold rounded-lg" onClick={()=>navigate("/")}>
           Continue Shopping<BsArrowRight size={16} />
         </button>
          <button className="flex w-full items-center justify-center gap-2 border border-gray-300 py-3 px-4 text-sm text-gray-700 rounded-lg" onClick={()=>navigate("/orders")}>
            View My Orders<BsArrowRight size={16} />
          </button> 

       </div>
    </div>
  </div>
}

export default PaymentSucces
