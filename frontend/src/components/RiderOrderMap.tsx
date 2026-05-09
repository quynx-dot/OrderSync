import type{IOrder} from "../types"
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer,Marker, Popup,useMap } from "react-leaflet";
import * as L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine"
import axios from "axios";
import { riderService } from "../main";

declare module "leaflet"{
    namespace Routing{
        function control(options:any):any;
        function osrmv1(options?:any):any;
    }
}

const riderIcon=new L.DivIcon({
    html:"🛵",
    iconSize:[30,30],
    className:"",
});
const deliveryIcon=new L.DivIcon({
    html:"📦",
    iconSize:[30,30],
    className:"",
});

interface Props{
    order:IOrder;
}

const Routing=({from,to}:{from:[number,number],to:[number,number]})=>{
    const map=useMap();
    // Keep a ref to the control so we can safely remove it
    const controlRef = useRef<any>(null);

    useEffect(()=>{
        const control=L.Routing.control({
            waypoints:[L.latLng(from),L.latLng(to)],
            lineOptions:{styles:[{color:"#E23744",weight:5}]},
            addWaypoints:false,
            draggableWaypoints:false,
            show:false,
            createMarker:()=>null,
            router:L.Routing.osrmv1({serviceurl:"https://router.project-osrm.org/route/v1"})
        }).addTo(map);
        controlRef.current = control;

        return () => {
            // Safely clear the drawn route lines before removing the control.
            // If the map is already destroyed, _clearLines will throw because
            // the internal layer group is null — we catch and swallow that error.
            try {
                control.setWaypoints([]);
            } catch (_) { /* map already gone */ }
            try {
                map.removeControl(control);
            } catch (_) { /* map already gone */ }
            controlRef.current = null;
        };
    },[from,to,map]);
    return null;
};

const RiderOrderMap = ({order}:Props) => {
    const [riderLocation, setRiderLocation]=useState<[number,number]|null>(null);

    useEffect(()=>{
        if(order.deliveryAddress.latitude==null || order.deliveryAddress.longitude==null){
            return;
        }
        const fetchLocation=()=>{
            navigator.geolocation.getCurrentPosition(
                (pos)=>{
                    const latitude=pos.coords.latitude;
                    const longitude=pos.coords.longitude;
                    setRiderLocation([latitude,longitude]);
                    axios.post(`${riderService}/api/rider/location/update`,{
                        latitude,
                        longitude,
                        orderId:order._id,
                    },{
                        headers:{Authorization:`Bearer ${localStorage.getItem("token")}`},
                    });
                },
                (err)=>console.log("Location Error:",err),
                {enableHighAccuracy:true,maximumAge:5000,timeout:10000}
            );
        };
        fetchLocation();
        const interval=setInterval(fetchLocation,10000);
        return()=>clearInterval(interval);
    },[order._id]);

    if(order.deliveryAddress.latitude==null || order.deliveryAddress.longitude==null){
        return null;
    }
    if(!riderLocation) return null;

    const deliveryLocation:[number,number]=[
        order.deliveryAddress.latitude,
        order.deliveryAddress.longitude,
    ];

    return (
        <div className="rounded-xl bg-white shadow-sm p-3">
            <MapContainer center={riderLocation} zoom={14} className="h-87.5 w-full rounded-lg">
                <TileLayer attribution="&copy; OpenStreetMap"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <Marker position={riderLocation} icon={riderIcon}>
                    <Popup>You (Rider)</Popup>
                </Marker>
                <Marker position={deliveryLocation} icon={deliveryIcon}>
                    <Popup>Delivery Location</Popup>
                </Marker>
                <Routing from={riderLocation} to={deliveryLocation}/>
            </MapContainer>
        </div>
    );
};

export default RiderOrderMap;