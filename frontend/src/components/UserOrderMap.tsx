import { useEffect, useRef } from "react";
import { MapContainer, TileLayer,Marker, Popup,useMap } from "react-leaflet";
import * as L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-routing-machine"

declare module "leaflet"{
    namespace Routing{
        function control(options:any):any;
        function osrmv1(options?:any):any;
    }
} 
const riderIcon=new L.DivIcon({
    html:"🛵",
    iconSize:[30,30],
    className:" ",
});
const deliveryIcon=new L.DivIcon({
    html:"📦",
    iconSize:[30,30],
    className:" ",
});

const Routing=({
    from,
    to
}:{
    from:[number, number],
    to:[number, number]
})=>{
    const map=useMap();
    // Keep a ref so the cleanup can access the control
    const controlRef = useRef<any>(null);

   useEffect(()=>{
    // @ts-ignore
    if (!L.Routing) return;
    let control: any;
    try {
        control = L.Routing.control({
            waypoints:[L.latLng(from),L.latLng(to)],
            lineOptions:{
                styles:[{color:"#E23744",weight:5}],
            },
            addWaypoints:false,
            draggableWaypoints:false,
            show:false,
            createMarker:()=>null,
            // @ts-ignore
            router:L.Routing.osrmv1({
                serviceurl:"https://router.project-osrm.org/route/v1"
            })
        }).addTo(map);
        controlRef.current = control;
    } catch(e) {
        console.warn("Routing unavailable:", e);
        return;
    }

    return () => {
        try {
            control.setWaypoints([]);
        } catch (_) {}
        try {
            map.removeControl(control);
        } catch (_) {}
        controlRef.current = null;
    };
},[from, to, map]);
    return null;
};

interface Props{
    riderLocation:[number,number];
    deliveryLocation:[number,number];
}

const UserOrderMap = ({riderLocation, deliveryLocation}:Props) => {
  return (
     <div className="rounded-xl bg-white shadow-sm p-3">
            <MapContainer 
            center={riderLocation}
            zoom={14}
            className="h-87.5 w-full rounded-lg"
            >
                <TileLayer attribution="&copy; OpenStreetMap"
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                 <Marker position={riderLocation} icon={riderIcon}>
                    <Popup>Rider</Popup>
                 </Marker>
                 <Marker position={deliveryLocation} icon={deliveryIcon}>
                    <Popup>Delivery Location</Popup>
                 </Marker>
                 <Routing from={riderLocation} to={deliveryLocation}/>
            </MapContainer>
        </div>
  )
}

export default UserOrderMap