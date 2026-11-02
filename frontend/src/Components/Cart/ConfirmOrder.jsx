import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { getUser } from '../Utils/helpers'
const ConfirmOrder = ({ cartItems, shippingInfo }) => {
    const [user] = useState(getUser() ? getUser() : {})
    let navigate = useNavigate();
    // Calculate Order Prices
    const getAddOnsTotal = (item) => (item.addOns || []).reduce(
        (total, addOn) => total + Number(addOn.price || 0) * (Number(addOn.quantity) || 1),
        0
    )
    const getItemUnitPrice = (item) => Number(item.price || 0) + getAddOnsTotal(item)
    const itemsPrice = cartItems.reduce((acc, item) => acc + getItemUnitPrice(item) * item.quantity, 0)
    const isDelivery = shippingInfo.orderType !== 'pickup'
    const shippingPrice = !isDelivery || itemsPrice > 200 ? 0 : 25
    const taxPrice = Number((0.05 * itemsPrice).toFixed(2))
    const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2)

    const processToPayment = () => {
        const data = {
            itemsPrice: itemsPrice.toFixed(2),
            shippingPrice,
            taxPrice,
            totalPrice
        }

        sessionStorage.setItem('orderInfo', JSON.stringify(data))
        navigate('/payment')
    }

    return (
        <>
            <MetaData title={'Confirm Order'} />
            <CheckoutSteps shipping confirmOrder />
            <div className="row d-flex justify-content-between">
                <div className="col-12 col-lg-8 mt-5 order-confirm">
                    <h4 className="mb-3">Fulfillment details</h4>
                    {user && <p><b>Name:</b> {user && user.name}</p>}
                    <p><b>Phone:</b> {shippingInfo.phoneNo}</p>
                    <p><b>Method:</b> {shippingInfo.orderType === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                    {isDelivery && (
                        <p className="mb-4"><b>Address:</b> {`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`}</p>
                    )}
                    <p><b>Preferred date and time:</b> {
                        shippingInfo.preferredDateTime
                            ? new Date(shippingInfo.preferredDateTime).toLocaleString()
                            : 'Not selected'
                    }</p>

                    <hr />
                    <h4 className="mt-4">Your Cart Items:</h4>

                    {cartItems.map(item => (
                        <div className="cart-item my-1" key={item.cartKey || item.product}>
                                <hr />
                                <div className="row">
                                    <div className="col-4 col-lg-2">
                                        {item.image && (
                                            <img src={item.image} alt={item.name} height="45" width="65" />
                                        )}
                                    </div>

                                    <div className="col-5 col-lg-6">
                                        <Link to={`/product/${item.product}`}>{item.name}</Link>
                                        {item.customizations?.length > 0 && (
                                            <ul className="small text-muted mb-0 pl-3">
                                                {item.customizations.map((selection) => (
                                                    <li key={selection.type}>
                                                        {selection.name}: {selection.label}
                                                        {selection.priceAdjustment
                                                            ? ` (${selection.priceAdjustment > 0 ? '+' : '-'}₱${Math.abs(selection.priceAdjustment).toFixed(2)})`
                                                            : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {item.addOns?.length > 0 && (
                                            <ul className="small text-muted mb-0 pl-3">
                                                {item.addOns.map((addOn) => (
                                                    <li key={addOn._id}>{addOn.name} x {Number(addOn.quantity) || 1} (+₱{(Number(addOn.price) * (Number(addOn.quantity) || 1)).toFixed(2)})</li>
                                                ))}
                                            </ul>
                                        )}
                                        {item.customMessage && (
                                            <p className="small text-muted mb-0">
                                                <strong>Message / instructions:</strong> {item.customMessage}
                                            </p>
                                        )}
                                    </div>


                                    <div className="col-4 col-lg-4 mt-4 mt-lg-0">
                                        <p>{item.quantity} x ₱{getItemUnitPrice(item).toFixed(2)} = <b>₱{(item.quantity * getItemUnitPrice(item)).toFixed(2)}</b></p>
                                    </div>

                                </div>
                            <hr />
                        </div>
                    ))}

                </div>

                <div className="col-12 col-lg-3 my-4">
                    <div id="order_summary">
                        <h4>Order Summary</h4>
                        <hr />
                        <p>Subtotal:  <span className="order-summary-values">₱{itemsPrice.toFixed(2)}</span></p>
                        <p>Shipping: <span className="order-summary-values">₱{shippingPrice.toFixed(2)}</span></p>
                        <p>Tax:  <span className="order-summary-values">₱{taxPrice.toFixed(2)}</span></p>

                        <hr />

                        <p>Total: <span className="order-summary-values">₱{totalPrice}</span></p>

                        <hr />
                        <button id="checkout_btn" className="btn btn-primary btn-block" onClick={processToPayment}>Proceed to Payment</button>
                    </div>
                </div>


            </div>

        </>
    )
}

export default ConfirmOrder