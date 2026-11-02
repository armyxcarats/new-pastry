import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getToken } from '../Utils/helpers'

const OrderDetails = () => {
    const [loading, setLoading] = useState(true)
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

            const { data } = await axios.get(`${import.meta.env.VITE_API}/order/${id}`, {
                ...config,
                withCredentials: true
            })
            console.log(data)
            setOrder(data.order)

            setLoading(false)


        } catch (error) {
            setError(error.response?.data?.message || 'Unable to load this order.')
        }
    }

    useEffect(() => {
        getOrderDetails(id)

        if (error) {
            toast.error(error, {
                position: toast.POSITION.BOTTOM_RIGHT
            });
        }
    }, [error, id])

    const shippingDetails = shippingInfo && [shippingInfo.address, shippingInfo.city, shippingInfo.postalCode, shippingInfo.country].filter(Boolean).join(', ')

    const isPaid = order.paymentStatus === 'paid' || paymentInfo?.status === 'succeeded'

    return (
        <>
            <MetaData title={'Order Details'} />

            {loading ? <Loader /> : (
                <>
                    <div className="row d-flex justify-content-between">
                        <div className="col-12 col-lg-8 mt-5 order-details">

                            <h1 className="my-5">Order # {order._id}</h1>

                            <h4 className="mb-4">Fulfillment details</h4>
                            <p><b>Name:</b> {user && user.name}</p>
                            <p><b>Phone:</b> {shippingInfo && shippingInfo.phoneNo}</p>
                            <p><b>Method:</b> {order.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                            {order.orderType !== 'pickup' && <p className="mb-4"><b>Address:</b> {shippingDetails}</p>}
                            <p><b>Preferred date and time:</b> {order.preferredDate ? new Date(order.preferredDate).toLocaleString() : 'Not provided'}</p>
                            <p><b>Amount:</b> ₱{Number(totalPrice || 0).toFixed(2)}</p>

                            <hr />

                            <h4 className="my-4">Payment</h4>
                            <p><b>Method:</b> {order.paymentMethod || 'Not provided'}</p>
                            <p className={isPaid ? "greenColor" : "redColor"}><b>{isPaid ? "PAID" : "NOT PAID"}</b></p>


                            <h4 className="my-4">Order Status:</h4>
                            <p className={order.orderStatus && String(order.orderStatus).includes('Delivered') ? "greenColor" : "redColor"} ><b>{orderStatus}</b></p>


                            <h4 className="my-4">Order Items:</h4>

                            <hr />
                            <div className="cart-item my-1">
                                {orderItems && orderItems.map(item => (
                                    <div key={item.product} className="row my-5">
                                        <div className="col-4 col-lg-2">
                                            {item.image && (
                                                <img src={item.image} alt={item.name} height="45" width="65" />
                                            )}
                                        </div>

                                        <div className="col-5 col-lg-5">
                                            <Link to={`/product/${item.product}`}>{item.name}</Link>
                                            {item.selectedOptions?.customizations?.length > 0 && (
                                                <ul className="small text-muted mb-0 pl-3">
                                                    {item.selectedOptions.customizations.map((selection) => (
                                                        <li key={`${selection.type}-${selection.name}`}>
                                                            {selection.name}: {selection.label}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {item.addOns?.length > 0 && (
                                                <ul className="small text-muted mb-0 pl-3">
                                                    {item.addOns.map((addOn, index) => (
                                                        <li key={`${addOn.name}-${index}`}>
                                                            {addOn.name} x {addOn.quantity || 1}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            {item.selectedOptions?.customMessage && (
                                                <p className="small text-muted mb-0">
                                                    <strong>Message / instructions:</strong> {item.selectedOptions.customMessage}
                                                </p>
                                            )}
                                        </div>


                                        <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                            <p>₱{Number(item.unitPrice || 0).toFixed(2)}</p>
                                        </div>

                                        <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                            <p>{item.quantity} Piece(s)</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <hr />
                        </div>
                    </div>
                </>
            )}

        </>
    )
}

export default OrderDetails