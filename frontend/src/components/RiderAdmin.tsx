import axios from "axios";
import { adminService } from "../main";
import toast from "react-hot-toast";


const RiderAdmin= ({rider, onVerify}:{
   rider:any;
    onVerify:()=>void;
}) => {
    const verify=async()=>{
        try{
            await axios.patch(`${adminService}/api/v1/verify/rider/${rider._id}`,
            {},
            {
                headers:{
                    Authorization:`Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
        toast.success("rider Verified");
        onVerify();
        }catch(error){
            toast.error("failed to verify rider");
        }
    };
  return (
    <div className="rounded-xl bg-white p-4 shadow space-y-2">
        <img src={rider.picture} alt="" className="h-40 w-full object-cover rounded" />
        <h3>{rider.phoneNumber}</h3>
        <p className="text-sm text-gray-500">aadhar{rider.aadharNumber}</p>
        <p>Dl Number {rider.drivingLicenseNumber}</p>
        <p>{rider.autoLocation?.formattedAddress}</p>
        <button className="w-full rounded bg-green-500 py-2 text-white hover:bg-green-600" onClick={verify}>Verify rider</button>
      
    </div>
  )
}

export default RiderAdmin
