
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {BrowserRouter} from 'react-router-dom'
import { CartProvider } from "./context/CartProvider";
import { AuthProvider } from './context/AuthProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
  <AuthProvider>
  <CartProvider>
    <App />
  </CartProvider>
  </AuthProvider>
  </BrowserRouter>

)
