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
import PaymentSuccess from "./pages/PaymentSucces";
import OrderSuccess from "./pages/OrderSuccess";


const App = () => {
  const { user } = useAppData();

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              user?.role === "seller" ? <Navigate to="/restaurant" replace /> : <Home />
            }
          />
          <Route path="/address" element={<AddAddressPage/>}/>
          <Route path="/paymentsuccess/:paymentId" element={<PaymentSuccess />} />
          <Route path="/ordersuccess" element={<OrderSuccess />} />
          <Route path="/checkout" element={<CheckoutPage/>}/>
          <Route path="/restaurants/:id" element={<RestaurantPage/>} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/account" element={<Account />} />
          <Route path="/restaurant" element={<Restaurant />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;