import { useState } from 'react'
import { useNavigate } from "react-router-dom";
import { countries } from 'countries-list'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { toast } from 'react-toastify'

const MINIMUM_LEAD_TIME_HOURS = 48

const formatLocalDateTime = (date) => {
    const pad = (value) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const Shipping = ({ shipping = {}, saveShippingInfo }) => {
    const countriesList = Object.values(countries)
    const [address, setAddress] = useState(shipping.address || '')
    const [city, setCity] = useState(shipping.city || '')
    const [postalCode, setPostalCode] = useState(shipping.postalCode || '')
    const [phoneNo, setPhoneNo] = useState(shipping.phoneNo || '')
    const [country, setCountry] = useState(shipping.country || 'Philippines')
    const [orderType, setOrderType] = useState(shipping.orderType || 'delivery')
    const [preferredDateTime, setPreferredDateTime] = useState(
        shipping.preferredDateTime
            || (shipping.preferredDate ? formatLocalDateTime(new Date(shipping.preferredDate)) : '')
    )
    const navigate = useNavigate()
    const minimumDateTime = formatLocalDateTime(
        new Date(Date.now() + MINIMUM_LEAD_TIME_HOURS * 60 * 60 * 1000)
    )

    const submitHandler = (event) => {
        event.preventDefault()
        const scheduledDate = new Date(preferredDateTime)
        if (!preferredDateTime || Number.isNaN(scheduledDate.getTime())) {
            toast.error('Choose a valid pickup or delivery date and time.')
            return
        }
        if (scheduledDate.getTime() < Date.now() + MINIMUM_LEAD_TIME_HOURS * 60 * 60 * 1000) {
            toast.error('Orders need at least 48 hours advance notice.')
            return
        }
        if (!phoneNo.trim()) {
            toast.error('Enter a contact number for your order.')
            return
        }

        saveShippingInfo({
            address: address.trim(),
            city: city.trim(),
            phoneNo: phoneNo.trim(),
            postalCode: postalCode.trim(),
            country,
            orderType,
            preferredDate: scheduledDate.toISOString(),
            preferredTime: preferredDateTime.slice(11, 16),
            preferredDateTime
        })
        navigate('/confirm')
    }

    return (
        <>
            <MetaData title="Pickup or Delivery" />
            <CheckoutSteps shipping />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-4">Pickup or delivery</h1>

                        <div className="form-group">
                            <label htmlFor="order_type_field">How would you like your order?</label>
                            <select
                                id="order_type_field"
                                className="form-control"
                                value={orderType}
                                onChange={(event) => setOrderType(event.target.value)}
                            >
                                <option value="delivery">Delivery</option>
                                <option value="pickup">Pickup</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="preferred_datetime_field">Preferred {orderType} date and time</label>
                            <input
                                id="preferred_datetime_field"
                                type="datetime-local"
                                className="form-control"
                                value={preferredDateTime}
                                min={minimumDateTime}
                                step="900"
                                onChange={(event) => setPreferredDateTime(event.target.value)}
                                required
                            />
                            <small className="form-text text-muted">
                                Please schedule at least 48 hours ahead.
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_field">Contact number</label>
                            <input
                                type="tel"
                                id="phone_field"
                                className="form-control"
                                value={phoneNo}
                                onChange={(event) => setPhoneNo(event.target.value)}
                                required
                            />
                        </div>

                        {orderType === 'delivery' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="address_field">Delivery address</label>
                                    <input
                                        type="text"
                                        id="address_field"
                                        className="form-control"
                                        value={address}
                                        onChange={(event) => setAddress(event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="city_field">City</label>
                                    <input
                                        type="text"
                                        id="city_field"
                                        className="form-control"
                                        value={city}
                                        onChange={(event) => setCity(event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="postal_code_field">Postal code</label>
                                    <input
                                        type="text"
                                        id="postal_code_field"
                                        className="form-control"
                                        value={postalCode}
                                        onChange={(event) => setPostalCode(event.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="country_field">Country</label>
                                    <select
                                        id="country_field"
                                        className="form-control"
                                        value={country}
                                        onChange={(event) => setCountry(event.target.value)}
                                        required
                                    >
                                        {countriesList.map((item) => (
                                            <option key={item.name} value={item.name}>{item.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <button id="shipping_btn" type="submit" className="btn btn-block py-3">
                            CONTINUE
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Shipping
