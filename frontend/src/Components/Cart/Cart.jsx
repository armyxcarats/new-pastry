import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'


const Cart = ({ addItemToCart, removeItemFromCart, updateCartItemMessage, cartItems, loadError }) => {

    const navigate = useNavigate()
    const getAddOnsTotal = (item) => (item.addOns || []).reduce(
        (total, addOn) => total + Number(addOn.price || 0) * (Number(addOn.quantity) || 1),
        0
    )
    const getItemUnitPrice = (item) => Number(item.price || 0) + getAddOnsTotal(item)

    const getMaxItemQuantity = (item) => {
        const quantityInOtherLines = cartItems.reduce((total, otherItem) => (
            otherItem.product === item.product
                && (otherItem.cartKey || otherItem.product) !== (item.cartKey || item.product)
                ? total + Number(otherItem.quantity || 0)
                : total
        ), 0)
        return Math.max(0, Number(item.stock || 0) - quantityInOtherLines)
    }
    const hasInventoryIssue = cartItems.some((item) => (
        Number(item.quantity) > getMaxItemQuantity(item)
    ))


    const increaseQty = (item) => {
        const { product: id, quantity } = item
        const newQty = quantity + 1;
        addItemToCart(id, newQty, item.addOns, item.customizations, item.customMessage)
    }

    const decreaseQty = (item) => {
        const { product: id, quantity } = item
        const newQty = quantity - 1;
        if (newQty <= 0) return;
        addItemToCart(id, newQty, item.addOns, item.customizations, item.customMessage)
    }
    const removeCartItemHandler = (item) => {
        removeItemFromCart(item.cartKey || item.product)
    }
    const checkoutHandler = () => {
        navigate('/login?redirect=shipping')
    }
    return (
        <>
            <MetaData title={'Your Cart'} />
            {loadError
                ? <div className="alert alert-danger mt-5" role="alert">{loadError}</div>
                : cartItems.length === 0 ? <h2 className="mt-5">Your Cart is Empty</h2> : (
                <>
                    <h2 className="mt-5">Your Cart: <b>{cartItems.length} items</b></h2>
                    {hasInventoryIssue && (
                        <div className="alert alert-warning" role="alert">
                            Some cart quantities exceed the current stock. Reduce or remove those items before checkout.
                        </div>
                    )}

                    <div className="row d-flex justify-content-between">
                        <div className="col-12 col-lg-8">

                            {cartItems.map(item => (
                                <React.Fragment key={item.cartKey || item.product}>
                                    <hr />

                                    <div className="cart-item">
                                        <div className="row">
                                            <div className="col-4 col-lg-3">
                                                {item.image && (
                                                    <img src={item.image} alt={item.name} height="90" width="115" />
                                                )}
                                            </div>

                                            <div className="col-5 col-lg-3">
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
                                                <label className="d-block small mt-2" htmlFor={`message-${item.cartKey || item.product}`}>
                                                    Custom message / instructions
                                                </label>
                                                <textarea
                                                    id={`message-${item.cartKey || item.product}`}
                                                    className="form-control"
                                                    rows="2"
                                                    maxLength="200"
                                                    defaultValue={item.customMessage || ''}
                                                    onBlur={(event) => updateCartItemMessage(item.cartKey || item.product, event.target.value)}
                                                    placeholder="Optional, up to 200 characters"
                                                />
                                            </div>


                                            <div className="col-4 col-lg-2 mt-4 mt-lg-0">
                                                <p id="card_item_price">₱{getItemUnitPrice(item).toFixed(2)} each</p>
                                            </div>

                                            <div className="col-4 col-lg-3 mt-4 mt-lg-0">
                                                <div className="stockCounter d-inline">
                                                    <span className="btn btn-danger minus" onClick={() => decreaseQty(item)}>-</span>

                                                    <input type="number" className="form-control count d-inline" value={item.quantity} readOnly />

                                                    <button
                                                        type="button"
                                                        className="btn btn-primary plus"
                                                        onClick={() => increaseQty(item)}
                                                        disabled={Number(item.stock) <= 0}
                                                        aria-label={`Increase ${item.name} quantity`}
                                                    >+</button>
                                                </div>
                                            </div>

                                            <div className="col-4 col-lg-1 mt-4 mt-lg-0">
                                                <i id="delete_cart_item" className="fa fa-trash btn btn-danger" onClick={() => removeCartItemHandler(item)} ></i>
                                                {/* <i id="delete_cart_item" className="fa fa-trash btn btn-danger" ></i> */}
                                            </div>

                                        </div>
                                    </div>
                                    <hr />
                                </React.Fragment>
                            ))}

                        </div>

                        <div className="col-12 col-lg-3 my-4">
                            <div id="order_summary">
                                <h4>Order Summary</h4>
                                <hr />
                                <p>Subtotal:  <span className="order-summary-values">{cartItems.reduce((acc, item) => (acc + Number(item.quantity)), 0)} (Units)</span></p>
                                <p>Est. total: <span className="order-summary-values">₱{cartItems.reduce((acc, item) => acc + item.quantity * getItemUnitPrice(item), 0).toFixed(2)}</span></p>


                                <hr />
                                <button id="checkout_btn" className="btn btn-primary btn-block" onClick={checkoutHandler} disabled={hasInventoryIssue}>Check out</button>
                                {/*<button id="checkout_btn" className="btn btn-primary btn-block" >Check out</button>*/}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default Cart