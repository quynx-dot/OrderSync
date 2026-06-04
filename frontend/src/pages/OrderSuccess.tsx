import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { utilsService } from "../main";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import { BiCheckCircle, BiLoader } from "react-icons/bi";
import { BsArrowRight } from "react-icons/bs";

const OrderSuccess = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  const { fetchCart } = useAppData();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  // FIX: fetchCart added to dependency array — safe because AppContext now
  // wraps it in useCallback, so its identity is stable across renders.
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        await axios.post(`${utilsService}/api/payment/stripe/verify`, { sessionId });
        await fetchCart();
        setVerified(true);
      } catch (error) {
        toast.error("Stripe payment verification failed.");
        console.error(error);
      } finally {
        setVerifying(false);
      }
    };

    if (sessionId) {
      verifyPayment();
    } else {
      setVerifying(false);
    }
  }, [sessionId, fetchCart]);

  if (verifying) {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3">
        <BiLoader className="animate-spin text-[#E23744]" size={28} />
        <p className="text-gray-500">Verifying your payment...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm text-center space-y-4">
        {verified ? (
          <>
            <BiCheckCircle size={64} className="mx-auto text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">Payment Successful!</h1>
            <p className="text-sm text-gray-500">
              Your order has been placed and the restaurant has been notified.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-red-500">Verification Failed</h1>
            <p className="text-sm text-gray-500">
              We couldn't verify your payment. Please contact support.
            </p>
          </>
        )}
        <div className="space-y-2 pt-2">
          <button
            className="flex w-full items-center justify-center gap-2 bg-[#e23744] py-3 px-4 text-sm text-white font-semibold rounded-lg hover:bg-[#d32f3a]"
            onClick={() => navigate("/orders")}
          >
            View My Orders <BsArrowRight size={16} />
          </button>
          <button
            className="flex w-full items-center justify-center gap-2 border border-gray-300 py-3 px-4 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
            onClick={() => navigate("/")}
          >
            Continue Shopping <BsArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;