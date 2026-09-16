import { Toaster } from "react-hot-toast";
import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AppLayout from "./pages/AppLayout";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductPage from "./pages/ProductPage";
import SearchResults from "./pages/SearchResults";
import FlashDeals from "./pages/FlashDeals";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderTracking from "./pages/OrderTracking";
import Addresses from "./pages/Addresses";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AdminProductForm from "./admin/AdminProductForm";
import AdminOrders from "./admin/AdminOrders";
import AdminDeliveryPartners from "./admin/AdminDeliveryPartners";
import DeliveryLogin from "./delivery/DeliveryLogin";
import DeliveryLayout from "./delivery/DeliveryLayout";
import DeliveryDashboard from "./delivery/DeliveryDashboard";

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1B3022",
            color: "#fff",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />

      <Routes>
        {/* Auth pages - NO Navbar/Footer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main pages - WITH Navbar/Footer */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/deals" element={<FlashDeals />} />

          {/* Protected pages means login require*/}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/orders/:id" element={<OrderTracking />} />
            <Route path="/addresses" element={<Addresses />} />
          </Route>
        </Route>
           {/* Admin pages */}
           <Route path='/admin' element={<AdminLayout />}>
           <Route index element={<AdminDashboard />}/>
           <Route path='products' element={<AdminProducts/>} />
          <Route path='products/new' element={<AdminProductForm/>}/>
          <Route path='products/:id/edit' element={<AdminProductForm/>}/>
          <Route path='orders' element={<AdminOrders/>} />
          <Route path='delivery-partners' element={<AdminDeliveryPartners/>}/>
           </Route>
        
        {/* Delivery partner pages */}
        <Route path='/delivery/login' element={<DeliveryLogin/>}/>
        <Route path='/delivery' element={<DeliveryLayout/>}>
        <Route index element={<DeliveryDashboard/>}/>
        </Route>

      </Routes>
    </>
  );
};

export default App;
