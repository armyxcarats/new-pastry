import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getToken } from '../Utils/helpers'
import './OrderDetails.css'

const OrderDetails = () => {
    const [loading, setLoading] = useState(true)
    const [downloadingReceipt, setDownloadingReceipt] = useState(false)
    const [error, setError] = useState('')
    const [order, setOrder] = useState({})

    const { shippingInfo, orderItems, paymentInfo, user, totalPrice, orderStatus } = order
    let { id } = useParams();

    const getOrderDetails = async (id) => {
        try {

            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            }

            const { data } = await axios.get(`${import.meta.env.API}/order/${id}`, {
                ...config,
                withCredentials: true
            })
            setOrder(data.order)
        } catch (error) {
            setError(error.response?.data?.message || 'Unable to load this order.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        Promise.resolve().then(() => getOrderDetails(id))
    }, [id])

    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: toast.POSITION.BOTTOM_RIGHT
            });
        }
    }, [error])

    const shippingDetails = shippingInfo && [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country].filter(Boolean).join(', ')

    const isPaid = order.paymentStatus === 'paid' || paymentInfo?.status === 'succeeded'
    const paymentMethodLabel = ({
        card: 'Card',
        gcash: 'GCash',
        cod: 'Cash on delivery / pickup'
    })[order.paymentMethod] || 'Not provided'

    const printReceipt = () => window.print()

    const downloadReceipt = async () => {
        setDownloadingReceipt(true)
        try {
            const { data } = await axios.get(`${import.meta.env.API}/order/${id}/receipt.pdf`, {
                responseType: 'blob',
                withCredentials: true
            })
            const pdfUrl = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = pdfUrl
            link.download = `receipt-${id}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 1000)
        } catch {
            toast.error('The receipt PDF could not be downloaded. Please try again.')
        } finally {
            setDownloadingReceipt(false)
        }
    }

    return (
        <>
            <MetaData title={'Order Details'} />

            {loading ? <Loader /> : (
                <main className="order-receipt-page">
                    <article className="order-receipt">
                        <header className="order-receipt-header">
                            <div>
                                <p className="order-receipt-kicker">CRUMB &amp; CO.</p>
                                <h1>Order receipt</h1>
                            </div>
                            <div className="order-receipt-header-side">
                                <div className="order-receipt-actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={downloadReceipt}
                                        disabled={downloadingReceipt}
                                    >
                                        {downloadingReceipt ? 'Preparing PDF…' : 'Download PDF'}
                                    </button>
                                    <button type="button" className="btn btn-outline-primary" onClick={printReceipt}>
                                        Print
                                    </button>
                                </div>
                                <div className="order-receipt-id">
                                    <span>Order number</span>
                                    <strong>{order._id}</strong>
                                    <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</span>
                                </div>
                            </div>
                        </header>

                        <section className="order-receipt-details">
                            <div>
                                <h2>Customer</h2>
                                <p>{user?.name || 'Customer'}</p>
                                {user?.email && <p>{user.email}</p>}
                                {shippingInfo?.phoneNo && <p>{shippingInfo.phoneNo}</p>}
                            </div>
                            <div>
                                <h2>Fulfillment</h2>
                                <p>{order.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                                {order.orderType !== 'pickup' && shippingDetails && <p>{shippingDetails}</p>}
                                <p>Preferred: {order.preferredDate ? new Date(order.preferredDate).toLocaleString() : 'Not provided'}</p>
                            </div>
                            <div>
                                <h2>Payment &amp; status</h2>
                                <p>{paymentMethodLabel}</p>
                                <p>{isPaid ? 'Paid' : 'Not paid'}</p>
                                <p>Order status: {orderStatus || 'Pending'}</p>
                            </div>
                        </section>

                        <section className="order-receipt-items" aria-labelledby="receipt-items-heading">
                            <h2 id="receipt-items-heading">Items</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Qty</th>
                                        <th>Unit price</th>
                                        <th>Line total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(orderItems || []).map((item, index) => (
                                        <tr key={`${item.product}-${index}`}>
                                            <td>
                                                <span className="order-receipt-item-name">{item.name}</span>
                                                {item.selectedOptions?.customizations?.length > 0 && (
                                                    <ul>
                                                        {item.selectedOptions.customizations.map((selection) => (
                                                            <li key={`${selection.type}-${selection.name}`}>
                                                                {selection.name}: {selection.label}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {item.addOns?.length > 0 && (
                                                    <ul>
                                                        {item.addOns.map((addOn, addOnIndex) => (
                                                            <li key={`${addOn.name}-${addOnIndex}`}>
                                                                {addOn.name} x {addOn.quantity || 1}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {item.selectedOptions?.customMessage && (
                                                    <p>Message / instructions: {item.selectedOptions.customMessage}</p>
                                                )}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>₱{Number(item.unitPrice || 0).toFixed(2)}</td>
                                            <td>₱{Number(item.subtotal ?? (item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        <section className="order-receipt-totals" aria-label="Order totals">
                            <p><span>Subtotal</span><strong>₱{Number(order.subtotal || 0).toFixed(2)}</strong></p>
                            <p><span>Shipping</span><strong>₱{Number(order.shippingFee || 0).toFixed(2)}</strong></p>
                            <p><span>Tax</span><strong>₱{Number(order.taxPrice || 0).toFixed(2)}</strong></p>
                            <p className="order-receipt-grand-total"><span>Total</span><strong>₱{Number(totalPrice || 0).toFixed(2)}</strong></p>
                        </section>

                        <footer className="order-receipt-footer">
                            Thank you for choosing Crumb &amp; Co.
                        </footer>
                    </article>
                </main>
            )}

        </>
    )
}

export default OrderDetails