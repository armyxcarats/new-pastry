import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { toast } from 'react-toastify'
import axios from 'axios'

const OrdersList = () => {
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        let isCurrent = true
        axios.get(`${import.meta.env.VITE_API}/admin/orders`, {
                withCredentials: true
            })
            .then(({ data }) => {
                if (!isCurrent) return
                setOrders(data.orders || [])
                setError('')
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || 'Orders could not be loaded.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })
        return () => {
            isCurrent = false
        }
    }, [])

    const upcomingOrders = useMemo(() => (
        orders
            .filter((order) => (
                order.preferredDate
                && new Date(order.preferredDate) >= new Date()
                && !['Completed', 'Cancelled'].includes(order.orderStatus)
            ))
            .sort((first, second) => new Date(first.preferredDate) - new Date(second.preferredDate))
    ), [orders])

    const deleteOrder = async (orderId) => {
        if (!window.confirm('Delete this order record?')) return
        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/order/${orderId}`, {
                withCredentials: true
            })
            setOrders((current) => current.filter((order) => order._id !== orderId))
            toast.success('Order deleted.')
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Order could not be deleted.')
        }
    }

    return (
        <>
            <MetaData title="All Orders" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <main className="col-12 col-md-10 px-4">
                    <h1 className="my-5">All Orders</h1>
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}

                    <section className="card p-4 mb-5" aria-labelledby="upcoming-orders-title">
                        <h2 id="upcoming-orders-title" className="h4">Upcoming pickups and deliveries</h2>
                        {loading ? <p>Loading schedule…</p> : upcomingOrders.length ? (
                            <div className="table-responsive">
                                <table className="table table-sm">
                                    <thead>
                                        <tr><th>Date &amp; time</th><th>Method</th><th>Customer</th><th>Status</th><th>Order</th></tr>
                                    </thead>
                                    <tbody>
                                        {upcomingOrders.map((order) => (
                                            <tr key={order._id}>
                                                <td>{new Date(order.preferredDate).toLocaleString()}</td>
                                                <td>{order.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</td>
                                                <td>
                                                    {order.shippingInfo?.fullName || 'Customer'}
                                                    <div className="small text-muted">{order.shippingInfo?.phoneNo || 'No phone'}</div>
                                                </td>
                                                <td>{order.orderStatus}</td>
                                                <td><Link to={`/admin/order/${order._id}`}>View order</Link></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted mb-0">No upcoming fulfillment appointments.</p>}
                    </section>

                    <h2 className="h4 mb-3">Order records</h2>
                    {loading ? <Loader /> : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order._id}>
                                            <td>{order._id}</td>
                                            <td>{order.shippingInfo?.fullName || 'Customer'}</td>
                                            <td>{order.orderItems?.length || 0}</td>
                                            <td>₱{Number(order.totalPrice || 0).toFixed(2)}</td>
                                            <td>{order.orderStatus}</td>
                                            <td>
                                                <Link to={`/admin/order/${order._id}`} className="btn btn-sm btn-primary mr-2">View</Link>
                                                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => deleteOrder(order._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!orders.length && <tr><td colSpan="6">No orders found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </>
    )
}

export default OrdersList
