import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { toast } from 'react-toastify'
import axios from 'axios'

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Baking', 'Ready', 'Completed', 'Cancelled']

const ProcessOrder = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [order, setOrder] = useState(null)
    const [status, setStatus] = useState('')

    useEffect(() => {
        const loadOrder = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, {
                    withCredentials: true
                })
                setOrder(data.order)
                setStatus(data.order.orderStatus)
            } catch (error) {
                toast.error(error.response?.data?.message || 'Unable to load this order.')
            } finally {
                setLoading(false)
            }
        }
        loadOrder()
    }, [id])

    const updateOrder = async () => {
        setUpdating(true)
        try {
            await axios.put(
                `${import.meta.env.VITE_API}/admin/order/${id}`,
                { status },
                { withCredentials: true }
            )
            toast.success('Order status updated.')
            navigate('/admin/orders')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update this order.')
        } finally {
            setUpdating(false)
        }
    }

    const shippingInfo = order?.shippingInfo || {}
    const address = [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country]
        .filter(Boolean)
        .join(', ')
    const isPaid = order?.paymentStatus === 'paid' || order?.paymentInfo?.status === 'succeeded'
    const isFinal = ['Completed', 'Cancelled'].includes(order?.orderStatus)

    return (
        <>
            <MetaData title={order ? `Process Order #${order._id}` : 'Process Order'} />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <div className="col-12 col-md-10">
                    {loading ? <Loader /> : !order ? (
                        <div className="alert alert-danger my-5">Order not found.</div>
                    ) : (
                        <div className="row d-flex justify-content-around">
                            <div className="col-12 col-lg-7 order-details">
                                <h2 className="my-5">Order # {order._id}</h2>
                                <h4 className="mb-4">Fulfillment details</h4>
                                <p><b>Name:</b> {order.user?.name || shippingInfo.fullName}</p>
                                <p><b>Phone:</b> {shippingInfo.phoneNo}</p>
                                <p><b>Method:</b> {order.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                                {order.orderType !== 'pickup' && <p><b>Address:</b> {address}</p>}
                                <p><b>Preferred date and time:</b> {
                                    order.preferredDate ? new Date(order.preferredDate).toLocaleString() : 'Not provided'
                                }</p>
                                <p><b>Amount:</b> ₱{Number(order.totalPrice || 0).toFixed(2)}</p>

                                <hr />
                                <h4 className="my-4">Payment</h4>
                                <p className={isPaid ? 'greenColor' : 'redColor'}>
                                    <b>{isPaid ? 'PAID' : 'PENDING'}</b>
                                </p>
                                <p><b>Method:</b> {order.paymentMethod || 'Not provided'}</p>

                                <h4 className="my-4">Order status</h4>
                                <p><b>{order.orderStatus}</b></p>
                                <h4 className="my-4">Order items</h4>
                                <hr />
                                {order.orderItems.map((item, index) => (
                                    <div key={`${item.product}-${index}`} className="row my-4">
                                        <div className="col-4 col-lg-2">
                                            {item.image && <img src={item.image} alt={item.name} height="45" width="65" />}
                                        </div>
                                        <div className="col-8 col-lg-6">
                                            <Link to={`/product/${item.product}`}>{item.name}</Link>
                                            {item.selectedOptions?.customizations?.length > 0 && (
                                                <ul className="small text-muted">
                                                    {item.selectedOptions.customizations.map((selection) => (
                                                        <li key={`${selection.type}-${selection.name}`}>
                                                            {selection.name}: {selection.label}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {item.addOns?.length > 0 && (
                                                <ul className="small text-muted">
                                                    {item.addOns.map((addOn, addOnIndex) => (
                                                        <li key={`${addOn.name}-${addOnIndex}`}>
                                                            {addOn.name} × {addOn.quantity}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {item.selectedOptions?.customMessage && (
                                                <p className="small">
                                                    <strong>Message / instructions:</strong> {item.selectedOptions.customMessage}
                                                </p>
                                            )}
                                        </div>
                                        <div className="col-6 col-lg-2">
                                            ₱{Number(item.unitPrice || 0).toFixed(2)}
                                        </div>
                                        <div className="col-6 col-lg-2">{item.quantity} item(s)</div>
                                    </div>
                                ))}
                                <hr />
                            </div>
                            <div className="col-12 col-lg-3 mt-5">
                                <h4 className="my-4">Update status</h4>
                                <div className="form-group">
                                    <select
                                        className="form-control"
                                        name="status"
                                        value={status}
                                        onChange={(event) => setStatus(event.target.value)}
                                        disabled={isFinal}
                                    >
                                        {ORDER_STATUSES.map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    className="btn btn-primary btn-block"
                                    onClick={updateOrder}
                                    disabled={updating || isFinal || status === order.orderStatus}
                                >
                                    {updating ? 'Updating…' : 'Update status'}
                                </button>
                                {isFinal && <p className="small text-muted mt-2">Completed and cancelled orders are final.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default ProcessOrder
