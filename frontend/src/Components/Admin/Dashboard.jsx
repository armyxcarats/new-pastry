import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
import './Dashboard.css'

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
})

const formatDate = (date) => new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium'
}).format(new Date(date))

const currentMonthValue = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const getDailyActivity = (records, dateField, monthValue, metric) => {
    const [year, month] = monthValue.split('-').map(Number)
    if (!year || !month) return []

    const daysInMonth = new Date(year, month, 0).getDate()
    const dailyCounts = Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        [metric]: 0
    }))

    records.forEach((record) => {
        const date = new Date(record[dateField])
        if (Number.isNaN(date.getTime())
            || date.getFullYear() !== year
            || date.getMonth() + 1 !== month) {
            return
        }
        dailyCounts[date.getDate() - 1][metric] += 1
    })

    return dailyCounts
}

const getDailySales = (orders, yearValue, monthValue) => {
    const year = Number(yearValue)
    const month = Number(monthValue)
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return []

    const daysInMonth = new Date(year, month, 0).getDate()
    const dailySales = Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        sales: 0
    }))

    orders.forEach((order) => {
        const date = new Date(order.createdAt)
        if (order.orderStatus === 'Cancelled'
            || Number.isNaN(date.getTime())
            || date.getFullYear() !== year
            || date.getMonth() + 1 !== month) {
            return
        }
        dailySales[date.getDate() - 1].sales += Number(order.totalPrice) || 0
    })

    return dailySales
}

const Dashboard = () => {
    const [selectedMonth, setSelectedMonth] = useState(currentMonthValue)
    const [selectedSalesMonth, setSelectedSalesMonth] = useState(() => String(new Date().getMonth() + 1))
    const [selectedSalesYear, setSelectedSalesYear] = useState(() => String(new Date().getFullYear()))
    const [summary, setSummary] = useState({
        products: 0,
        catalog: [],
        orders: 0,
        customers: 0,
        revenue: 0,
        customerRecords: [],
        orderRecords: [],
        recentOrders: [],
        reviews: []
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let isCurrent = true

        const loadDashboard = async () => {
            try {
                const [productsResponse, ordersResponse, usersResponse, reviewsResponse] = await Promise.all([
                    axios.get(`${import.meta.env.API}/admin/products`, { withCredentials: true }),
                    axios.get(`${import.meta.env.API}/admin/orders`, { withCredentials: true }),
                    axios.get(`${import.meta.env.API}/admin/users`, { withCredentials: true }),
                    axios.get(`${import.meta.env.API}/reviews`, { withCredentials: true })
                ])

                if (!isCurrent) return

                const products = productsResponse.data.products || []
                const orders = ordersResponse.data.orders || []
                const customers = (usersResponse.data.users || []).filter((user) => user.role !== 'admin')
                const recentOrders = [...orders]
                    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
                    .slice(0, 5)

                setSummary({
                    products: products.length,
                    catalog: products,
                    orders: orders.length,
                    customers: customers.length,
                    revenue: Number(ordersResponse.data.totalAmount || 0),
                    customerRecords: customers,
                    orderRecords: orders,
                    recentOrders,
                    reviews: reviewsResponse.data.reviews || []
                })
            } catch (requestError) {
                if (isCurrent) {
                    setError(
                        requestError.response?.data?.message
                        || 'The admin dashboard could not load. Please try again.'
                    )
                }
            } finally {
                if (isCurrent) setLoading(false)
            }
        }

        loadDashboard()

        return () => {
            isCurrent = false
        }
    }, [])

    const deleteReview = async (review) => {
        if (!window.confirm('Delete this product review? This cannot be undone.')) return

        const productId = review.product?._id || review.product
        if (!productId) {
            toast.error('The product for this review could not be found.')
            return
        }

        try {
            await axios.delete(
                `${import.meta.env.API}/reviews?id=${encodeURIComponent(review._id)}&productId=${encodeURIComponent(productId)}`,
                { withCredentials: true }
            )
            setSummary((current) => ({
                ...current,
                reviews: current.reviews.filter((item) => item._id !== review._id)
            }))
            toast.success('Review deleted.')
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Review could not be deleted.')
        }
    }

    const productsByCategory = summary.catalog.reduce((groups, product) => {
        const categoryName = product.category?.name || 'Uncategorized'
        if (!groups.has(categoryName)) groups.set(categoryName, [])
        groups.get(categoryName).push(product)
        return groups
    }, new Map())
    const userActivity = getDailyActivity(summary.customerRecords, 'createdAt', selectedMonth, 'users')
    const orderActivity = getDailyActivity(summary.orderRecords, 'createdAt', selectedMonth, 'orders')
    const salesActivity = getDailySales(summary.orderRecords, selectedSalesYear, selectedSalesMonth)
    const selectedMonthSales = salesActivity.reduce((total, item) => total + item.sales, 0)
    const selectedMonthLabel = selectedMonth
        ? new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' })
            .format(new Date(`${selectedMonth}-01T12:00:00`))
        : ''
    const selectedSalesPeriodLabel = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' })
        .format(new Date(Number(selectedSalesYear), Number(selectedSalesMonth) - 1, 1))
    const currentYear = new Date().getFullYear()
    const firstSalesYear = summary.orderRecords.reduce((earliestYear, order) => {
        const orderYear = new Date(order.createdAt).getFullYear()
        return Number.isNaN(orderYear) ? earliestYear : Math.min(earliestYear, orderYear)
    }, currentYear)
    const salesYearRangeStart = Math.min(firstSalesYear, currentYear - 1)
    const salesYears = Array.from(
        { length: currentYear + 1 - salesYearRangeStart + 1 },
        (_, index) => String(currentYear + 1 - index)
    )

    return (
        <>
            <MetaData title="Admin Dashboard" />
            <main className="admin-dashboard-page">
                <aside className="admin-dashboard-sidebar">
                    <Sidebar />
                </aside>

                <section className="admin-dashboard-content">
                    <header className="admin-dashboard-heading">
                        <div>
                            <p className="admin-dashboard-eyebrow">CRUMB &amp; CO. MANAGEMENT</p>
                            <h1>Admin dashboard</h1>
                            <p>Here’s an overview of your bakery’s activity.</p>
                        </div>
                    </header>

                    {error && <p className="admin-dashboard-error" role="alert">{error}</p>}

                    <section className="admin-dashboard-stats" aria-label="Store overview">
                        <article className="admin-dashboard-stat">
                            <span>Products</span>
                            <strong>{loading ? '...' : summary.products}</strong>
                            <span className="admin-dashboard-stat-note">In your catalog</span>
                        </article>
                        <article className="admin-dashboard-stat">
                            <span>Orders</span>
                            <strong>{loading ? '...' : summary.orders}</strong>
                            <span className="admin-dashboard-stat-note">Orders received</span>
                        </article>
                        <article className="admin-dashboard-stat">
                            <span>Customers</span>
                            <strong>{loading ? '...' : summary.customers}</strong>
                            <span className="admin-dashboard-stat-note">Registered accounts</span>
                        </article>
                        <article className="admin-dashboard-stat">
                            <span>Total revenue</span>
                            <strong>{loading ? '...' : currency.format(summary.revenue)}</strong>
                            <span className="admin-dashboard-stat-note">Across all orders</span>
                        </article>
                    </section>

                    <section className="admin-dashboard-analytics" aria-labelledby="admin-analytics-heading">
                        <div className="admin-dashboard-section-heading admin-dashboard-analytics-heading">
                            <div>
                                <p className="admin-dashboard-eyebrow">MONTHLY ACTIVITY</p>
                                <h2 id="admin-analytics-heading">Users, orders &amp; sales</h2>
                            </div>
                            <label className="admin-dashboard-month-picker">
                                <span>Choose month</span>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    max={currentMonthValue()}
                                    onChange={(event) => setSelectedMonth(event.target.value || currentMonthValue())}
                                />
                            </label>
                        </div>

                        {loading ? (
                            <p className="admin-dashboard-message">Loading monthly activity...</p>
                        ) : (
                            <div className="admin-dashboard-chart-grid">
                                <article className="admin-dashboard-chart-card">
                                    <div className="admin-dashboard-chart-title">
                                        <h3>New customers</h3>
                                        <strong>{userActivity.reduce((total, item) => total + item.users, 0)}</strong>
                                    </div>
                                    <p>Customer accounts registered in {selectedMonthLabel}</p>
                                    <div className="admin-dashboard-chart">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={userActivity} margin={{ top: 8, right: 12, left: -20, bottom: 4 }}>
                                                <CartesianGrid stroke="#eee7de" strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#76685e', fontSize: 11 }} />
                                                <YAxis allowDecimals={false} width={36} tickLine={false} axisLine={false} tick={{ fill: '#76685e', fontSize: 11 }} />
                                                <Tooltip
                                                    labelFormatter={(day) => `${selectedMonthLabel} ${day}`}
                                                    formatter={(value) => [value, 'New customers']}
                                                    cursor={{ fill: '#f7efe4' }}
                                                />
                                                <Bar dataKey="users" name="New customers" fill="#68735a" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </article>

                                <article className="admin-dashboard-chart-card">
                                    <div className="admin-dashboard-chart-title">
                                        <h3>Orders received</h3>
                                        <strong>{orderActivity.reduce((total, item) => total + item.orders, 0)}</strong>
                                    </div>
                                    <p>Orders placed in {selectedMonthLabel}</p>
                                    <div className="admin-dashboard-chart">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={orderActivity} margin={{ top: 8, right: 12, left: -20, bottom: 4 }}>
                                                <CartesianGrid stroke="#eee7de" strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#76685e', fontSize: 11 }} />
                                                <YAxis allowDecimals={false} width={36} tickLine={false} axisLine={false} tick={{ fill: '#76685e', fontSize: 11 }} />
                                                <Tooltip
                                                    labelFormatter={(day) => `${selectedMonthLabel} ${day}`}
                                                    formatter={(value) => [value, 'Orders']}
                                                    cursor={{ fill: '#f7efe4' }}
                                                />
                                                <Bar dataKey="orders" name="Orders" fill="#b65a3c" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </article>

                                <article className="admin-dashboard-chart-card">
                                    <div className="admin-dashboard-chart-title">
                                        <h3>Sales</h3>
                                        <strong>{currency.format(selectedMonthSales)}</strong>
                                    </div>
                                    <div className="admin-dashboard-sales-filters">
                                        <label>
                                            <span>Month</span>
                                            <select
                                                className="form-control"
                                                value={selectedSalesMonth}
                                                onChange={(event) => setSelectedSalesMonth(event.target.value)}
                                            >
                                                {Array.from({ length: 12 }, (_, index) => {
                                                    const month = index + 1
                                                    const label = new Intl.DateTimeFormat('en-PH', { month: 'long' })
                                                        .format(new Date(2026, index, 1))
                                                    return <option key={month} value={month}>{label}</option>
                                                })}
                                            </select>
                                        </label>
                                        <label>
                                            <span>Year</span>
                                            <select
                                                className="form-control"
                                                value={selectedSalesYear}
                                                onChange={(event) => setSelectedSalesYear(event.target.value)}
                                            >
                                                {salesYears.map((year) => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                    <p>Daily order sales in {selectedSalesPeriodLabel}, excluding cancelled orders</p>
                                    <div className="admin-dashboard-chart">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={salesActivity} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                                                <CartesianGrid stroke="#eee7de" strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#76685e', fontSize: 11 }} />
                                                <YAxis
                                                    width={88}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tick={{ fill: '#76685e', fontSize: 11 }}
                                                    tickFormatter={(value) => currency.format(value)}
                                                />
                                                <Tooltip
                                                    labelFormatter={(day) => `${selectedSalesPeriodLabel} ${day}`}
                                                    formatter={(value) => [currency.format(Number(value)), 'Sales']}
                                                    cursor={{ fill: '#f7efe4' }}
                                                />
                                                <Bar dataKey="sales" name="Sales" fill="#68735a" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </article>
                            </div>
                        )}
                    </section>

                    <section className="admin-dashboard-catalog" aria-labelledby="admin-catalog-heading">
                        <div className="admin-dashboard-section-heading">
                            <div>
                                <p className="admin-dashboard-eyebrow">YOUR BAKERY MENU</p>
                                <h2 id="admin-catalog-heading">Products by category</h2>
                            </div>
                            <Link to="/admin/products">Manage products <span aria-hidden="true">&rarr;</span></Link>
                        </div>

                        {loading ? (
                            <p className="admin-dashboard-message">Loading products...</p>
                        ) : productsByCategory.size ? (
                            [...productsByCategory.entries()].map(([category, products]) => (
                                <section className="admin-dashboard-category" key={category}>
                                    <h3>{category} <span>{products.length}</span></h3>
                                    <div className="admin-dashboard-product-list">
                                        {products.map((product) => (
                                            <Link
                                                className="admin-dashboard-product"
                                                key={product._id}
                                                to={`/admin/product/${product._id}`}
                                            >
                                                {product.images?.[0]?.url ? (
                                                    <img src={product.images[0].url} alt="" loading="lazy" />
                                                ) : (
                                                    <span className="admin-dashboard-product-placeholder" aria-hidden="true">B</span>
                                                )}
                                                <span className="admin-dashboard-product-info">
                                                    <strong>{product.name}</strong>
                                                    <span>{currency.format(Number(product.price || 0))} · {product.stock} in stock</span>
                                                </span>
                                                <span className={`admin-dashboard-product-status ${product.isAvailable === false ? 'is-unavailable' : ''}`}>
                                                    {product.isAvailable === false ? 'Unavailable' : 'Available'}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            ))
                        ) : (
                            <p className="admin-dashboard-message">No products are in the catalog yet.</p>
                        )}
                    </section>

                    <section className="admin-dashboard-orders" aria-labelledby="admin-recent-orders">
                        <div className="admin-dashboard-section-heading">
                            <div>
                                <p className="admin-dashboard-eyebrow">LATEST ACTIVITY</p>
                                <h2 id="admin-recent-orders">Recent orders</h2>
                            </div>
                            <Link to="/admin/orders">Manage orders <span aria-hidden="true">&rarr;</span></Link>
                        </div>

                        {loading ? (
                            <p className="admin-dashboard-message">Loading store activity...</p>
                        ) : summary.recentOrders.length ? (
                            <div className="admin-dashboard-order-list">
                                {summary.recentOrders.map((order) => (
                                    <article className="admin-dashboard-order" key={order._id}>
                                        <div>
                                            <Link to={`/admin/order/${order._id}`}>
                                                Order #{order._id.slice(-6).toUpperCase()}
                                            </Link>
                                            <span>{formatDate(order.createdAt)}</span>
                                        </div>
                                        <span className="admin-dashboard-order-status">
                                            {order.orderStatus || 'Pending'}
                                        </span>
                                        <strong>{currency.format(Number(order.subtotal || 0) + Number(order.shippingFee || 0))}</strong>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="admin-dashboard-message">No orders have been placed yet.</p>
                        )}
                    </section>

                    <section className="admin-dashboard-reviews" aria-labelledby="admin-recent-reviews">
                        <div className="admin-dashboard-section-heading">
                            <div>
                                <p className="admin-dashboard-eyebrow">CUSTOMER FEEDBACK</p>
                                <h2 id="admin-recent-reviews">Recent product reviews</h2>
                            </div>
                            <Link to="/admin/reviews">Manage all reviews <span aria-hidden="true">&rarr;</span></Link>
                        </div>

                        {loading ? (
                            <p className="admin-dashboard-message">Loading reviews...</p>
                        ) : summary.reviews.length ? (
                            <div className="admin-dashboard-review-list">
                                {summary.reviews.slice(0, 5).map((review) => (
                                    <article className="admin-dashboard-review" key={review._id}>
                                        <div className="admin-dashboard-review-content">
                                            <div>
                                                <strong>{review.product?.name || 'Product unavailable'}</strong>
                                                <span>{review.rating} / 5 · {review.user?.name || 'Customer'} · {formatDate(review.createdAt)}</span>
                                            </div>
                                            <p>{review.comment}</p>
                                        </div>
                                        <button type="button" onClick={() => deleteReview(review)}>
                                            Delete
                                        </button>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="admin-dashboard-message">No product reviews have been submitted yet.</p>
                        )}
                    </section>
                </section>
            </main>
        </>
    )
}

export default Dashboard
