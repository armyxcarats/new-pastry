import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import axios from 'axios'
import { toast } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css';
import ListReviews from '../Review/ListReviews';

import { useDispatch, useSelector } from 'react-redux'
import { getProductDetails } from '../../actions/productActions'
import Loader from '../Layout/Loader'

const ProductDetails = ({ addItemToCart }) => {
    // const [product, setProduct] = useState({})
    const { loading, error, product } = useSelector(state => state.productDetails);
    const { isAuthenticated, user: currentUser } = useSelector((state) => state.auth || {})
    const [quantity, setQuantity] = useState(1)
    const [addOnSelections, setAddOnSelections] = useState({})
    const [customizationSelections, setCustomizationSelections] = useState({})
    const [rating, setRating] = useState(0)
    const [reviewEligibility, setReviewEligibility] = useState(null)
    const [reviewFormOpen, setReviewFormOpen] = useState(false)
    const [reviewSubmitting, setReviewSubmitting] = useState(false)
    const [editingReviewId, setEditingReviewId] = useState(null)
    const [activeImageSelection, setActiveImageSelection] = useState({ productId: '', index: 0 })
    const [comment, setComment] = useState('')
    const [customMessage, setCustomMessage] = useState('')
    let { id } = useParams()
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const reviewEligibilityForCurrentUser = reviewEligibility?.productId === id
        && reviewEligibility?.userId === currentUser?._id
        ? reviewEligibility
        : null
    const activeImageIndex = activeImageSelection.productId === id ? activeImageSelection.index : 0
    const currentAddOnSelection = addOnSelections[id] || { wantsAddOns: false, quantities: {} }
    const wantsAddOns = currentAddOnSelection.wantsAddOns
    const selectedAddOnQuantities = currentAddOnSelection.quantities || {}
    const availableAddOns = (Array.isArray(product?.addOns) ? product.addOns : [])
        .filter((addOn) => addOn && addOn._id && addOn.isActive !== false)
    const customizationOptions = Array.isArray(product?.customizationOptions)
        ? product.customizationOptions.filter((option) => ['size', 'flavor', 'filling'].includes(option.type)
            && Array.isArray(option.values) && option.values.length > 0)
        : []
    const selectedCustomizations = customizationOptions.map((option) => {
        const label = customizationSelections[id]?.[option.type]
            ?? option.values[0].label
        const selectedValue = option.values.find((value) => value.label === label) || option.values[0]
        return {
            name: option.name,
            type: option.type,
            label: selectedValue.label,
            priceAdjustment: Number(selectedValue.priceAdjustment || 0)
        }
    })
    const customizationPrice = selectedCustomizations.reduce(
        (total, selection) => total + selection.priceAdjustment,
        0
    )
    const addOnPrice = availableAddOns.reduce(
        (total, addOn) => total + Number(addOn.price || 0) * (selectedAddOnQuantities[addOn._id] || 0),
        0
    )
    // const productDetails = async (id) => {
    //     let link = `http://localhost:4001/api/v1/product/${id}`
    //     try {
    //         let res = await axios.get(link)
    //         setProduct(res.data.product)
    //     } catch (err) {
    //         console.log(err)
    //         // setError('Product not found')
    //     }
    // }

    const productImages = (product?.images || []).filter((image) => image?.url)
    const activeImage = productImages[activeImageIndex] || productImages[0]
    const unitPrice = Number(product.price || 0) + customizationPrice + addOnPrice
    const cartTotal = unitPrice * quantity

    const increaseQty = () => setQuantity((current) => Math.min(Number(product.stock) || 1, current + 1))
    const decreaseQty = () => setQuantity((current) => Math.max(1, current - 1))

    const addToCart = async () => {
        if (!isAuthenticated) {
            toast.info('Please sign in to add products to your cart.')
            navigate(`/login?redirect=${encodeURIComponent(`product/${id}`)}`)
            return
        }
        const selectedAddOns = wantsAddOns
            ? availableAddOns
                .filter((addOn) => selectedAddOnQuantities[addOn._id] > 0)
                .map((addOn) => ({
                    _id: addOn._id,
                    name: addOn.name,
                    price: Number(addOn.price || 0),
                    quantity: selectedAddOnQuantities[addOn._id]
                }))
            : []
        await addItemToCart(id, quantity, selectedAddOns, selectedCustomizations, customMessage.trim());
    }

    const changeAddOnQuantity = (addOnId, quantity) => {
        updateAddOnSelection({
            quantities: {
                ...selectedAddOnQuantities,
                [addOnId]: Math.max(0, Math.min(99, quantity))
            }
        })
    }

    const updateAddOnSelection = (update) => {
        setAddOnSelections((current) => ({
            ...current,
            [id]: {
                ...current[id],
                ...update
            }
        }))
    }

    const updateCustomization = (type, label) => {
        setCustomizationSelections((current) => ({
            ...current,
            [id]: {
                ...current[id],
                [type]: label
            }
        }))
    }

    const saveReview = async (reviewData) => {
        setReviewSubmitting(true)
        try {
            const request = editingReviewId
                ? axios.put(`${import.meta.env.VITE_API}/review/${editingReviewId}`, reviewData, { withCredentials: true })
                : axios.post(`${import.meta.env.VITE_API}/review`, reviewData, { withCredentials: true })
            const { data } = await request
            if (data.success) {
                toast.success(editingReviewId ? 'Review updated successfully.' : 'Review added successfully.')
                dispatch(getProductDetails(id))
                setReviewEligibility({
                    productId: id,
                    userId: currentUser._id,
                    eligible: true,
                    error: ''
                })
                setReviewFormOpen(false)
                setEditingReviewId(null)
                setComment('')
                setRating(0)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Your review could not be saved.')
        } finally {
            setReviewSubmitting(false)
        }
    }

    const deleteReview = async (reviewId) => {
        if (!window.confirm('Delete this review? This cannot be undone.')) return

        try {
            await axios.delete(`${import.meta.env.VITE_API}/review/${reviewId}`, {
                withCredentials: true
            })
            toast.success('Review deleted.')
            dispatch(getProductDetails(id))
            if (editingReviewId === reviewId) {
                setReviewFormOpen(false)
                setEditingReviewId(null)
                setComment('')
                setRating(0)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Your review could not be deleted.')
        }
    }

    const reviewHandler = (event) => {
        event.preventDefault()
        if (rating < 1 || !comment.trim()) {
            toast.error('Choose a star rating and write a review first.')
            return
        }
        saveReview({ rating, comment, productId: id })
    }

    const startReview = (review = null) => {
        setEditingReviewId(review?._id || null)
        setRating(review?.rating || 0)
        setComment(review?.comment || '')
        setReviewFormOpen(true)
    }

    useEffect(() => {
        dispatch(getProductDetails(id))

    }, [dispatch, id]);

    useEffect(() => {
        if (!isAuthenticated || !currentUser?._id) return undefined

        let isCurrent = true
        axios.get(`${import.meta.env.VITE_API}/product/${id}/review-eligibility`, {
            withCredentials: true
        }).then(({ data }) => {
            if (isCurrent) {
                setReviewEligibility({
                    productId: id,
                    userId: currentUser._id,
                    eligible: data.eligible,
                    error: ''
                })
            }
        }).catch((requestError) => {
            if (isCurrent) {
                setReviewEligibility({
                    productId: id,
                    userId: currentUser._id,
                    eligible: false,
                    error: requestError.response?.data?.message || 'Review eligibility could not be checked.'
                })
            }
        })

        return () => {
            isCurrent = false
        }
    }, [currentUser?._id, id, isAuthenticated])

    if (loading && !product?.name) {
        return (
            <main className="container text-center py-5" aria-live="polite">
                <Loader />
                <p>Loading product details...</p>
            </main>
        )
    }

    if (error && !product?.name) {
        return (
            <main className="container py-5">
                <div className="alert alert-danger" role="alert">{error}</div>
            </main>
        )
    }

    if (!product?.name) return null

    return (
        <>
            <MetaData title={product.name} />
            <main className="product-detail-page">
            <div className="container product-detail-grid">
                <div className="product-gallery-column">
                    <div className="product-gallery" id="product_image">
                        <div className="product-gallery-main">
                            {activeImage ? (
                                <img className="product-gallery-image" src={activeImage.url} alt={product.name} />
                            ) : (
                                <div className="product-gallery-empty">A fresh bake is on its way</div>
                            )}
                            {productImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        className="product-gallery-arrow product-gallery-previous"
                                        aria-label="Show previous product photo"
                                        onClick={() => setActiveImageSelection({
                                            productId: id,
                                            index: (activeImageIndex - 1 + productImages.length) % productImages.length
                                        })}
                                    >‹</button>
                                    <button
                                        type="button"
                                        className="product-gallery-arrow product-gallery-next"
                                        aria-label="Show next product photo"
                                        onClick={() => setActiveImageSelection({
                                            productId: id,
                                            index: (activeImageIndex + 1) % productImages.length
                                        })}
                                    >›</button>
                                    <span className="product-gallery-count">
                                        {activeImageIndex + 1} / {productImages.length}
                                    </span>
                                </>
                            )}
                        </div>
                        {productImages.length > 1 && (
                            <div className="product-gallery-thumbnails" aria-label="Product photos">
                                {productImages.map((image, index) => (
                                    <button
                                        type="button"
                                        key={`${image.public_id || image.url}-${index}`}
                                        className={`product-gallery-thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                                        aria-label={`Show product photo ${index + 1}`}
                                        aria-pressed={index === activeImageIndex}
                                        onClick={() => setActiveImageSelection({ productId: id, index })}
                                    >
                                        <img src={image.url} alt="" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {product.addOns?.length > 0 && (
                        <section className="product-addons my-4 p-3" aria-labelledby="product-addons-heading">
                            <h4 id="product-addons-heading">Would you like any add-ons?</h4>
                            <div className="btn-group mb-3" role="group" aria-label="Choose whether to add extras">
                                <button
                                    type="button"
                                    className={`btn ${wantsAddOns ? 'btn-primary' : 'btn-outline-primary'}`}
                                    aria-pressed={wantsAddOns}
                                    onClick={() => updateAddOnSelection({ wantsAddOns: true })}
                                >
                                    Yes, show add-ons
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${!wantsAddOns ? 'btn-primary' : 'btn-outline-primary'}`}
                                    aria-pressed={!wantsAddOns}
                                    onClick={() => updateAddOnSelection({ wantsAddOns: false, quantities: {} })}
                                >
                                    No thanks
                                </button>
                            </div>
                            {wantsAddOns && (
                                <fieldset className="border rounded p-3 mb-3">
                                    <legend className="w-auto px-2 h6">Choose extras</legend>
                                    {availableAddOns.map((addOn) => (
                                            <label
                                                key={addOn._id}
                                                className="d-flex align-items-center justify-content-between py-2 border-bottom"
                                            >
                                                <span>
                                                    {addOn.name}
                                                </span>
                                                <span className="d-flex align-items-center">
                                                    <span className="mr-3">
                                                        +₱{Number(addOn.price || 0).toFixed(2)} each
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        aria-label={`Remove one ${addOn.name}`}
                                                        disabled={!selectedAddOnQuantities[addOn._id]}
                                                        onClick={() => changeAddOnQuantity(
                                                            addOn._id,
                                                            (selectedAddOnQuantities[addOn._id] || 0) - 1
                                                        )}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="mx-2" aria-live="polite">
                                                        {selectedAddOnQuantities[addOn._id] || 0}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-primary"
                                                        aria-label={`Add one ${addOn.name}`}
                                                        disabled={(selectedAddOnQuantities[addOn._id] || 0) >= 99}
                                                        onClick={() => changeAddOnQuantity(
                                                            addOn._id,
                                                            (selectedAddOnQuantities[addOn._id] || 0) + 1
                                                        )}
                                                    >
                                                        +
                                                    </button>
                                                </span>
                                            </label>
                                    ))}
                                    {!availableAddOns.length && (
                                        <p>No add-ons are available for this product.</p>
                                    )}
                                    <p className="mb-0 mt-2">
                                        Add-ons total: <strong>₱{addOnPrice.toFixed(2)}</strong>
                                    </p>
                                </fieldset>
                            )}
                        </section>
                    )}
                </div>

                <section className="product-info-column">
                    <p className="product-detail-eyebrow">
                        {product.category?.name || 'Fresh from our bakery'}
                        {product.subCategory?.name ? ` · ${product.subCategory.name}` : ''}
                    </p>
                    <h1 className="product-detail-title">{product.name}</h1>
                    <p className="product-detail-description">{product.description}</p>
                    <div className="product-detail-rating">
                        <div className="rating-outer">
                            <div className="rating-inner" style={{ width: `${((product.rating || 0) / 5) * 100}%` }}></div>
                        </div>
                        <span id="no_of_reviews">{product.numOfReviews || 0} reviews</span>
                        <span className={`product-availability ${product.stock > 0 ? 'available' : 'unavailable'}`}>
                            {product.stock > 0 ? 'Freshly available' : 'Currently sold out'}
                        </span>
                    </div>

                    {customizationOptions.length > 0 && (
                        <section className="product-customizations mb-4" aria-label="Customize your product">
                            <h4>Customize your order</h4>
                            {customizationOptions.map((option) => {
                                const selected = selectedCustomizations.find((item) => item.type === option.type)
                                return (
                                    <div className="form-group" key={`${option.type}-${option.name}`}>
                                        <label htmlFor={`customization-${option.type}`}>{option.name}</label>
                                        <select
                                            id={`customization-${option.type}`}
                                            className="form-control product-customization-select"
                                            value={selected?.label || ''}
                                            onChange={(event) => updateCustomization(option.type, event.target.value)}
                                        >
                                            {option.values.map((value) => (
                                                <option key={value.label} value={value.label}>
                                                    {value.label}
                                                    {Number(value.priceAdjustment) > 0
                                                        ? ` (+₱${Number(value.priceAdjustment).toFixed(2)})`
                                                        : Number(value.priceAdjustment) < 0
                                                            ? ` (-₱${Math.abs(Number(value.priceAdjustment)).toFixed(2)})`
                                                            : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )
                            })}
                        </section>
                    )}

                    <div className="form-group product-custom-message">
                        <label htmlFor="custom-message">Custom message or special instructions</label>
                        <textarea
                            id="custom-message"
                            className="form-control"
                            rows="3"
                            maxLength="200"
                            value={customMessage}
                            onChange={(event) => setCustomMessage(event.target.value)}
                            placeholder="For example, the message to write on your cake"
                        />
                        <small className="form-text text-muted">
                            Up to 200 characters. Instructions are saved with this cart item.
                        </small>
                    </div>

                    <section className="product-ingredients-card" aria-labelledby="product-ingredients-heading">
                        <h2 id="product-ingredients-heading">Inside this bake</h2>
                        <p>
                            <strong>Made with</strong>
                            {product.ingredients?.length ? product.ingredients.join(', ') : 'Not provided'}
                        </p>
                        <p>
                            <strong>Known allergens</strong>
                            {product.allergens?.length ? product.allergens.join(', ') : 'Not provided'}
                        </p>
                        <small className="text-muted">
                            Allergen information may be incomplete. If you have food allergies, contact the bakery before ordering.
                        </small>
                    </section>
                    <p id="product_price" className="product-detail-price">₱{unitPrice.toFixed(2)}</p>
                    {(customizationPrice !== 0 || addOnPrice > 0) && (
                        <p className="product-price-note">
                            Includes your selected options and add-ons
                        </p>
                    )}
                    <div className="product-purchase-row">
                        <div className="product-quantity-control" aria-label="Quantity">
                            <button type="button" aria-label="Decrease quantity" onClick={decreaseQty} disabled={quantity <= 1}>−</button>
                            <span aria-live="polite">{quantity}</span>
                            <button type="button" aria-label="Increase quantity" onClick={increaseQty} disabled={quantity >= product.stock}>+</button>
                        </div>
                        <button type="button" id="cart_btn" className="product-add-to-cart" disabled={product.stock === 0} onClick={addToCart}>
                            Add to bag · ₱{cartTotal.toFixed(2)}
                        </button>
                    </div>
                    <p className="product-detail-stock">
                        {product.stock > 0 ? `${product.stock} available today` : 'Currently out of stock'}
                    </p>

                    <section className="product-review-form mt-5" aria-labelledby="product-review-heading">
                        <h2 id="product-review-heading">Your review</h2>
                        {!isAuthenticated ? (
                            <div className="alert alert-info" role="status">
                                <button
                                    type="button"
                                    className="btn btn-link p-0"
                                    onClick={() => navigate(`/login?redirect=${encodeURIComponent(`product/${id}`)}`)}
                                >
                                    Sign in
                                </button>
                                {' '}to review this product after your order is completed.
                            </div>
                        ) : !reviewEligibilityForCurrentUser ? (
                            <p className="text-muted" role="status">Checking whether you can review this product…</p>
                        ) : reviewEligibilityForCurrentUser.error ? (
                            <div className="alert alert-danger" role="alert">{reviewEligibilityForCurrentUser.error}</div>
                        ) : !reviewEligibilityForCurrentUser.eligible ? (
                            <p className="text-muted" role="status">
                                You can review this product after an order containing it is marked Completed.
                            </p>
                        ) : (
                            <>
                                {!reviewFormOpen ? (
                                    <button
                                        id="review_btn"
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => startReview()}
                                    >
                                        Write another review
                                    </button>
                                ) : (
                                    <form className="product-review-editor" onSubmit={reviewHandler}>
                                        <h3>{editingReviewId ? 'Edit your review' : 'Write a review'}</h3>
                                        <div className="product-review-stars" role="group" aria-label="Choose a star rating">
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <button
                                                    type="button"
                                                    key={value}
                                                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                                                    aria-pressed={rating === value}
                                                    className={rating >= value ? 'selected' : ''}
                                                    onClick={() => setRating(value)}
                                                >★</button>
                                            ))}
                                        </div>
                                        <label className="sr-only" htmlFor="product-review-comment">Your review</label>
                                        <textarea
                                            name="review"
                                            id="product-review-comment"
                                            className="form-control mt-3"
                                            rows="4"
                                            maxLength="2000"
                                            placeholder="Share what you thought about this pastry."
                                            value={comment}
                                            onChange={(event) => setComment(event.target.value)}
                                            required
                                        />
                                        <div className="mt-3">
                                            <button className="btn btn-primary mr-2" type="submit" disabled={reviewSubmitting}>
                                                {reviewSubmitting ? 'Saving…' : editingReviewId ? 'Save changes' : 'Submit review'}
                                            </button>
                                            <button className="btn btn-outline-secondary" type="button" onClick={() => {
                                                setReviewFormOpen(false)
                                                setEditingReviewId(null)
                                            }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </section>
                    {product.reviews && product.reviews.length > 0 && (
                        <ListReviews
                            reviews={product.reviews}
                            currentUserId={currentUser?._id}
                            onEdit={startReview}
                            onDelete={deleteReview}
                        />
                    )}
            </section>
            </div>
            </main>
        </>
    )
}

export default ProductDetails