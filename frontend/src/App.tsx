import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProtectedRoute from './components/protectedRoute';
import PublicRoute from './components/publicRoutes';
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/navbar";
import Account from "./pages/Account";
import { useAppData } from "./context/AppContext";
import Restaurant from "./pages/Restaurant";
import RestaurantPage from "./pages/RestaurantPage";
import Cart from "./pages/Cart";
import AddAddressPage from "./pages/Address";
import CheckoutPage from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderPage from "./pages/OrderPage";
import RiderDashboard from "./pages/RiderDashboard";
import Admin from "./pages/Admin";


const App = () => {
  const { user,loading } = useAppData();
  if(loading){
    return <h1 className="text-2xl font-bold text-red-500 text-center mt-56">Loading...</h1>
  }
  // CHANGE the entire return to wrap everything in BrowserRouter first:
return (
    <BrowserRouter>
        <Navbar />
        <Routes>
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
            </Route>
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={
                    user?.role === "seller" ? <Navigate to="/restaurant" replace /> :
                    user?.role === "rider"  ? <Navigate to="/rider" replace /> :
                    user?.role === "admin"  ? <Navigate to="/admin-panel" replace /> :
                    <Home />
                } />
                <Route path="/restaurant" element={<Restaurant />} />
                <Route path="/rider" element={<RiderDashboard />} />
                <Route path="/admin-panel" element={<Admin />} />
                <Route path="/address" element={<AddAddressPage />} />
                <Route path="/paymentsuccess/:paymentId" element={<PaymentSuccess />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/order/:id" element={<OrderPage />} />
                <Route path="/ordersuccess" element={<OrderSuccess />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/restaurants/:id" element={<RestaurantPage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/select-role" element={<SelectRole />} />
                <Route path="/account" element={<Account />} />
            </Route>
        </Routes>
    </BrowserRouter>
);
};

export default App;