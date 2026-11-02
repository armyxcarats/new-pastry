import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import axios from 'axios'
import { toast } from 'react-toastify'

const Payment = ({ cartItems, shippingInfo, clearCart }) => {
    const navigate = useNavigate()
    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [submitting, setSubmitting] = useState(false)
    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo') || 'null')

    const submitHandler = async (event) => {
        event.preventDefault()
        if (!cartItems.length) {
            toast.error('Your cart is empty.')
            navigate('/cart')
            return
        }
        if (!shippingInfo?.preferredDate || !shippingInfo?.orderType) {
            toast.error('Choose pickup or delivery and a preferred date before placing your order.')
            navigate('/shipping')
            return
        }

        setSubmitting(true)
        const order = {
            orderItems: cartItems.map((item) => ({
                product: item.product,
                quantity: item.quantity,
                addOns: item.addOns || [],
                selectedOptions: {
                    customizations: item.customizations || [],
                    customMessage: item.customMessage || ''
                }
            })),
            shippingInfo,
            orderType: shippingInfo.orderType,
            preferredDate: shippingInfo.preferredDate,
            preferredTime: shippingInfo.preferredTime,
            paymentMethod,
            itemsPrice: orderInfo?.itemsPrice || '0',
            shippingPrice: orderInfo?.shippingPrice || 0,
            taxPrice: orderInfo?.taxPrice || 0,
            totalPrice: orderInfo?.totalPrice || '0'
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_API}/order/new`,
                order,
                { withCredentials: true }
            )
            toast.success('Your order has been placed and is awaiting confirmation.')
            sessionStorage.removeItem('orderInfo')
            clearCart()
            navigate('/success')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Your order could not be created.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <MetaData title="Payment method" />
            <CheckoutSteps shipping confirmOrder payment />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-4">Payment method</h1>
                        <p>
                            Select how you plan to pay. This demo records your choice but does not charge a card or GCash account.
                        </p>

                        <fieldset className="form-group">
                            <legend className="h6">Choose a payment method</legend>
                            {[
                                { value: 'cod', label: 'Cash on delivery / pickup' },
                                { value: 'gcash', label: 'GCash' },
                                { value: 'card', label: 'Card' }
                            ].map((method) => (
                                <label className="d-flex align-items-center mb-3" key={method.value}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method.value}
                                        checked={paymentMethod === method.value}
                                        onChange={(event) => setPaymentMethod(event.target.value)}
                                        className="mr-2"
                                    />
                                    {method.label}
                                </label>
                            ))}
                        </fieldset>

                        <button
                            id="pay_btn"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={submitting}
                        >
                            {submitting
                                ? 'Placing order…'
                                : `Place order · ₱${Number(orderInfo?.totalPrice || 0).toFixed(2)}`}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Payment
