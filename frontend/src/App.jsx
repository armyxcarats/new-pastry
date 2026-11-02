import { useEffect, useRef, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, } from 'react-toastify';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

import { Header } from './Components/Layout/Header'
import Footer from './Components/Layout/Footer'

import './App.css'
import Home from './Components/Home'
import ProductDetails from './Components/Product/ProductDetails';
import Login from './Components/User/Login';
import UserDashboard from './Components/User/UserDashboard';
import Register from './Components/User/Register';
import ForgotPassword from './Components/User/ForgotPassword';
import NewPassword from './Components/User/NewPassword';
import Profile from './Components/User/Profile';
import UpdateProfile from './Components/User/UpdateProfile';
import UpdatePassword from './Components/User/UpdatePassword';
import Cart from './Components/Cart/Cart';
import Shipping from './Components/Cart/Shipping';
import ConfirmOrder from './Components/Cart/ConfirmOrder';
import Payment from './Components/Cart/Payment';
import OrderSuccess from './Components/Cart/OrderSuccess';
import ListOrders from './Components/Order/ListOrders';
import OrderDetails from './Components/Order/OrderDetails';

import Dashboard from './Components/Admin/Dashboard';
import ProductsList from './Components/Admin/ProductsList';
import NewProduct from './Components/Admin/NewProduct';
import UpdateProduct from './Components/Admin/UpdateProduct';
import OrdersList from './Components/Admin/OrdersList';
import ProcessOrder from './Components/Admin/ProcessOrder';
import UsersList from './Components/Admin/UsersList';
import UpdateUser from './Components/Admin/UpdateUser';
import ProtectedRoute from './Components/Route/ProtectedRoute';
import ProductReviews from './Components/Admin/ProductReviews';
import CatalogManagement from './Components/Admin/CatalogManagement';
import { loadUser } from './actions/userActions'
import Loader from './Components/Layout/Loader'

const AuthenticatedLoginRedirect = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth || {});
  const redirect = new URLSearchParams(location.search).get('redirect');

  const destination = redirect ? `/${redirect}` : user?.role === 'admin' ? '/dashboard' : '/';

  return <Navigate to={destination} replace />;
};

function App() {

  const { isAuthenticated, loading: authLoading, user } = useSelector((state) => state.auth || {});
  const userId = user?._id
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(loadUser())
  }, [dispatch])

  const [state, setState] = useState({
    cartItems: [],
    shippingInfo: localStorage.getItem('shippingInfo')
      ? JSON.parse(localStorage.getItem('shippingInfo'))
      : {},
  })
  const [cartOwnerId, setCartOwnerId] = useState(null)
  const [cartLoadError, setCartLoadError] = useState({ userId: null, message: '' })
  const cartSyncTimer = useRef(null)
  const cartIdentityRef = useRef(null)

  useEffect(() => {
    cartIdentityRef.current = { isAuthenticated, userId, cartOwnerId }
  }, [cartOwnerId, isAuthenticated, userId])

  useEffect(() => {
    let isCurrent = true
    if (!authLoading && isAuthenticated && userId) {
      axios.get(`${import.meta.env.VITE_API}/cart`, { withCredentials: true })
        .then(({ data }) => {
          if (!isCurrent) return
          setState((current) => ({ ...current, cartItems: data.items || [] }))
          setCartOwnerId(userId)
          setCartLoadError({ userId: null, message: '' })
        })
        .catch((error) => {
          if (isCurrent) {
            const message = error.response?.data?.message || 'Your cart could not be loaded. Please refresh and try again.'
            console.error('Cart load failed:', message)
            setCartLoadError({ userId, message })
            toast.error(message)
          }
        })
    } else if (!authLoading) {
      localStorage.removeItem('cartItems')
    }
    return () => {
      isCurrent = false
    }
  }, [authLoading, isAuthenticated, userId])

  useEffect(() => {
    if (!isAuthenticated || !userId || cartOwnerId !== userId) return
    if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current)
    cartSyncTimer.current = setTimeout(() => {
      const currentIdentity = cartIdentityRef.current
      if (!currentIdentity.isAuthenticated || currentIdentity.userId !== userId
        || currentIdentity.cartOwnerId !== userId) return
      axios.put(`${import.meta.env.VITE_API}/cart`, { items: state.cartItems }, {
        withCredentials: true
      }).catch((error) => {
        console.error('Cart synchronization failed:', error.response?.data?.message || error.message)
      })
    }, 300)
    return () => {
      if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current)
    }
  }, [cartOwnerId, isAuthenticated, state.cartItems, userId])

  const addItemToCart = async (id, quantity, selectedAddOns, selectedCustomizations, customMessage = '') => {
    if (!isAuthenticated || !userId) {
      return false
    }
    if (cartOwnerId !== userId) {
      toast.error(cartLoadError.userId === userId
        ? cartLoadError.message
        : 'Your cart is still loading. Please try again in a moment.')
      return false
    }
    const ownerIdAtRequest = userId
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API}/product/${id}`)
      const currentIdentity = cartIdentityRef.current
      if (!currentIdentity.isAuthenticated || currentIdentity.userId !== ownerIdAtRequest
        || currentIdentity.cartOwnerId !== ownerIdAtRequest) return false
      const normalizedCustomizations = (selectedCustomizations || [])
        .map((selection) => {
          const option = (data.product.customizationOptions || []).find(
            (item) => item.type === selection.type
          )
          const value = option?.values?.find((item) => item.label === selection.label)
          return value ? {
            name: option.name,
            type: option.type,
            label: value.label,
            priceAdjustment: Number(value.priceAdjustment || 0)
          } : null
        })
        .filter(Boolean)
      const configurationKey = JSON.stringify(
        [
          ...normalizedCustomizations.map(({ type, label }) => [type, label]),
          ['message', customMessage.trim()]
        ].sort()
      )
      const existingItem = state.cartItems.find((item) => (
        item.product === id
        && JSON.stringify(
          [
            ...(item.customizations || []).map(({ type, label }) => [type, label]),
            ['message', item.customMessage || '']
          ].sort()
        ) === configurationKey
      ))
      const selectedAddOnItems = selectedAddOns ?? existingItem?.addOns ?? []
      const selectedAddOnMap = new Map(selectedAddOnItems.filter(Boolean).map((addOn) => (
        typeof addOn === 'string'
          ? [addOn, { quantity: 1 }]
          : [addOn._id, { quantity: Math.max(1, Number(addOn.quantity) || 1) }]
      )))
      const cartAddOns = (data.product.addOns || [])
        .filter((addOn) => addOn && selectedAddOnMap.has(addOn._id))
        .map(({ _id, name, price }) => ({
          _id,
          name,
          price: Number(price || 0),
          quantity: selectedAddOnMap.get(_id).quantity
        }))
      const customizationPrice = normalizedCustomizations.reduce(
        (total, selection) => total + selection.priceAdjustment,
        0
      )

      const item = {
        cartKey: `${data.product._id}:${configurationKey}`,
        product: data.product._id,
        name: data.product.name,
        price: Number(data.product.price || 0) + customizationPrice,
        image: data.product.images?.[0]?.url || '',
        stock: data.product.stock,
        quantity,
        addOns: cartAddOns,
        customizations: normalizedCustomizations,
        customMessage: customMessage.trim()
      }

      if (existingItem) {
        setState((current) => ({
          ...current,
          cartItems: current.cartItems.map((cartItem) => cartItem.cartKey === existingItem.cartKey ? item : cartItem)
        }))
      } else {
        setState((current) => ({
          ...current,
          cartItems: [...current.cartItems, item]
        }))
      }

      toast.success('Item Added to Cart', {
        position: 'bottom-right'
      })
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || 'This item could not be added to your cart.', {
        position: 'top-left'
      })
      return false
    }
  }

  const updateCartItemMessage = (cartKey, customMessage) => {
    if (!isAuthenticated || !userId || cartOwnerId !== userId) return
    setState((current) => {
      const cartItems = current.cartItems.map((item) => {
        if ((item.cartKey || item.product) !== cartKey) return item
        const customizationsKey = JSON.stringify([
          ...(item.customizations || []).map(({ type, label }) => [type, label]),
          ['message', customMessage.trim()]
        ].sort())
        return {
          ...item,
          customMessage: customMessage.trim(),
          cartKey: `${item.product}:${customizationsKey}`
        }
      })
      return { ...current, cartItems }
    })
  }

  const clearCart = () => {
    setState((current) => ({ ...current, cartItems: [] }))
  }

  const removeItemFromCart = async (id) => {
    if (!isAuthenticated || !userId || cartOwnerId !== userId) return
    setState((current) => ({
      ...current,
      cartItems: current.cartItems.filter((item) => (item.cartKey || item.product) !== id)
    }))
  }

  const saveShippingInfo = async (data) => {
    setState({
      ...state,
      shippingInfo: data
    })
    localStorage.setItem('shippingInfo', JSON.stringify(data))
  }


  return (
    <>

      <Router>
        <Header cartItems={isAuthenticated && cartOwnerId === userId ? state.cartItems : []} />
        {authLoading ? <Loader /> : <Routes>
          <Route path="/" element={<Home />} exact="true" />
          <Route path="/product/:id" element={<ProductDetails addItemToCart={addItemToCart} />} exact="true" />
          <Route path="/search/:keyword" element={<Home />} exact="true" />
          <Route path="/login" element={isAuthenticated ? <AuthenticatedLoginRedirect /> : <Login />} exact="true" />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} exact="true" />
          <Route path="/password/forgot" element={<ForgotPassword />} exact="true" />
          <Route path="/password/reset/:token" element={<NewPassword />} exact="true" />
          <Route path="/account" element={isAuthenticated ? <UserDashboard /> : <Navigate to="/login?redirect=account" replace />} />
          <Route path="/me" element={<Profile />} exact="true" />
          <Route path="/me/update" element={<UpdateProfile />} exact="true"
          />
          <Route path="/password/update" element={<UpdatePassword />} />
          <Route path="/cart" element={<Cart cartItems={isAuthenticated && cartOwnerId === userId ? state.cartItems : []} loadError={cartLoadError.userId === userId ? cartLoadError.message : ''} addItemToCart={addItemToCart} removeItemFromCart={removeItemFromCart} updateCartItemMessage={updateCartItemMessage} />} exact="true" />
          <Route path="/shipping" element={<Shipping shipping={state.shippingInfo} saveShippingInfo={saveShippingInfo} />} />
          <Route path="/confirm" element={<ConfirmOrder cartItems={isAuthenticated && cartOwnerId === userId ? state.cartItems : []} shippingInfo={state.shippingInfo} />} />
          <Route path="/payment" element={<Payment cartItems={isAuthenticated && cartOwnerId === userId ? state.cartItems : []} shippingInfo={state.shippingInfo} clearCart={clearCart} />} />
          <Route path="/success" element={<OrderSuccess />} />
          <Route path="/orders/me" element={<ListOrders />} />
          <Route path="/order/:id" element={<OrderDetails />} />

          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          {/* <Route path="/admin/products" element={<ProductsList />} /> */}
          <Route
            path="/admin/product"
            element={
              <ProtectedRoute isAdmin>
                <NewProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/product/:id"
            element={
              <ProtectedRoute isAdmin>
                <UpdateProduct />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/admin/orders"
            element={<OrdersList />}

          /> */}
          <Route
            path="/admin/order/:id"
            element={
              <ProtectedRoute isAdmin>
                <ProcessOrder />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/admin/users"
            element={<UsersList />} /> */}
          <Route
            path="/admin/user/:id"
            element={
              <ProtectedRoute isAdmin>
                <UpdateUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <ProtectedRoute isAdmin={true}>
                <ProductsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/catalog"
            element={
              <ProtectedRoute isAdmin={true}>
                <CatalogManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isAdmin={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute isAdmin={true}>
                <UsersList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute isAdmin={true}>
                <OrdersList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <ProtectedRoute isAdmin={true} >
                <ProductReviews />
              </ProtectedRoute>} />

        </Routes>}


      </Router>
      <Footer />
      <ToastContainer />
    </>
  )
}

export default App
