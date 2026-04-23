import { useEffect, useState } from "react";
import type { IOrder } from "../types";
import { restaurantService } from "../main";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

 
import axios from "axios";

const ACTIVE_STATUSES=[
    "placed",
    "accepted",
    "preparing",
    "ready_for_rider",
    "rider_assigned",
    "picked_up",
];
const Orders=()=>{
    const [orders,setOrders]=useState<IOrder[]>([]);
    const [loading, setLoading]=useState(true)
    const navigate=useNavigate()
    const {socket}=useSocket()

    const fetchOrders=async()=>{
        try{
            const {data}=await axios.get(`${restaurantService}/api/order/my`,{
                headers:{
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setOrders(data.orders || []);
        }catch(error){
            console.log(error);
        }finally{
            setLoading(false);
        }
    };
    useEffect(()=>{
        fetchOrders();
    },[]);
    useEffect(()=>{
        if(!socket)return;
        const onOrderUpdate=()=>{
            fetchOrders();
        };
        socket.on("order:update",onOrderUpdate);
        return()=>{
            socket.off("order:update", onOrderUpdate);
        }
    },[socket]);
    if(loading){
        return <p className="text-center text-gray-500">Loading orders...</p>;
    }
    if(orders.length===0){
        return  (<div className="flex min-h-[60vh] items-center justify-center">
            <p className="text-gray-500">No Orders Yet</p>
        </div>
        );
    }
    const activeOrders=orders.filter((o)=> ACTIVE_STATUSES.includes(o.status));
    const completedOrders=orders.filter((o)=>!ACTIVE_STATUSES.includes(o.status));


    return(
        <div className="mx-auto ma-w-4xl px-4 py-6 space-y-6">
             <h1 className="text-2xl font-bold">My Orders</h1>
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Active Orders</h2>
                {activeOrders.length===0 ? <p>No Active Orders yet</p>:activeOrders.map((order)=>(
                    <OrderRow key={order._id}
                    order={order}
                    onClick={()=>navigate(`/order/${order._id}`)}
                    />
                ))}
            </section>
            <section className="space-y-3">
                <h2 className="text-lg font-semibold">Completed Orders</h2>
                {completedOrders.length===0 ? <p>No Completed Orders</p>:completedOrders.map((order)=>(
                    <OrderRow key={order._id}
                    order={order}
                    onClick={()=>navigate(`/order/${order._id}`)}
                    />
                ))}
            </section>
        </div>
    );
};


//component order row

const OrderRow=({order,onClick,}:{order:IOrder;
    onClick:()=>void;
})=>{
    return <div className="cursor-pointer rounded-xl bg-white p-4 shadow-sm hover:bg-gray-50"
    onClick={onClick}>
        <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Order #{order._id.slice(-6)}</p>
            <span className="text-xs cpitalize text-gray-500">{order.status}</span>
        </div>
    </div>
}

export default Orders;