import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useSelector } from 'react-redux'
import MetaData from '../Layout/MetaData'
import './UserDashboard.css'

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
})

const formatDate = (date) => new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium'
}).format(new Date(date))

const UserDashboard = () => {
    const { user } = useSelector((state) => state.auth || {})
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isCurrent = true

        axios.get(`${import.meta.env.VITE_API}/orders/me`, { withCredentials: true })
            .then(({ data }) => {
                if (isCurrent) {
                    setOrders(Array.isArray(data.orders) ? data.orders : [])
                }
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || 'Your orders could not be loaded right now.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    const activeOrders = orders.filter((order) => !['Completed', 'Cancelled'].includes(order.orderStatus))
    const totalSpent = orders.reduce((total, order) => total + Number(order.totalPrice || 0), 0)
    const recentOrders = [...orders]
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        .slice(0, 5)

    return (
        <main className="customer-dashboard">
            <MetaData title="Your Dashboard" />

            <section className="customer-dashboard-welcome">
                <div>
                    <p className="customer-dashboard-kicker">YOUR CRUMB & CO. ACCOUNT</p>
                    <h1>Welcome back, {user?.name || 'friend'}.</h1>
                    <p>Keep an eye on your orders, or find something lovely for your next treat.</p>
                </div>
                <Link className="customer-dashboard-shop" to="/">Browse the bakes <span aria-hidden="true">&rarr;</span></Link>
            </section>

            <section className="customer-dashboard-stats" aria-label="Order summary">
                <div className="customer-dashboard-stat">
                    <span>Orders placed</span>
                    <strong>{loading ? '...' : orders.length}</strong>
                </div>
                <div className="customer-dashboard-stat">
                    <span>In progress</span>
                    <strong>{loading ? '...' : activeOrders.length}</strong>
                </div>
                <div className="customer-dashboard-stat">
                    <span>Total spent</span>
                    <strong>{loading ? '...' : currency.format(totalSpent)}</strong>
                </div>
            </section>

            <section className="customer-dashboard-orders" aria-labelledby="recent-orders-heading">
                <div className="customer-dashboard-section-heading">
                    <div>
                        <p className="customer-dashboard-kicker">FRESH FROM YOUR ACCOUNT</p>
                        <h2 id="recent-orders-heading">Recent orders</h2>
                    </div>
                    <Link to="/orders/me">View all orders <span aria-hidden="true">&rarr;</span></Link>
                </div>

                {error && <p className="customer-dashboard-error" role="alert">{error}</p>}
                {loading ? (
                    <p className="customer-dashboard-message">Loading your orders...</p>
                ) : recentOrders.length ? (
                    <div className="customer-dashboard-order-list">
                        {recentOrders.map((order) => (
                            <article className="customer-dashboard-order" key={order._id}>
                                <div className="customer-dashboard-order-main">
                                    <Link to={`/order/${order._id}`}>Order #{order._id.slice(-6).toUpperCase()}</Link>
                                    <span>{formatDate(order.createdAt)} · {order.orderItems?.length || 0} items</span>
                                </div>
                                <span className={`customer-dashboard-status customer-dashboard-status-${String(order.orderStatus || 'pending').toLowerCase()}`}>
                                    {order.orderStatus || 'Pending'}
                                </span>
                                <strong>{currency.format(Number(order.totalPrice || 0))}</strong>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="customer-dashboard-empty">
                        <p>No orders yet. Your next favorite might be waiting in the bakery.</p>
                        <Link to="/">Explore the menu</Link>
                    </div>
                )}
            </section>

            <nav className="customer-dashboard-links" aria-label="Account links">
                <Link to="/me">Profile details <span aria-hidden="true">&rarr;</span></Link>
                <Link to="/password/update">Change password <span aria-hidden="true">&rarr;</span></Link>
            </nav>
        </main>
    )
}

export default UserDashboard