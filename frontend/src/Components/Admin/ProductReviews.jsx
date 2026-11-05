import { useCallback, useEffect, useState } from 'react'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'

const ProductReviews = () => {
    const [productId, setProductId] = useState('')
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')

    const fetchProductReviews = useCallback(async (id = '') => {
        const params = new URLSearchParams()
        if (id.trim()) params.set('id', id.trim())
        const query = params.toString()
        const requestConfig = { withCredentials: true }
        const getReviewsByProduct = async () => {
            const { data: productsData } = await axios.get(
                `${import.meta.env.API}/admin/products`,
                requestConfig
            )
            if (!Array.isArray(productsData.products)) {
                throw new Error('The products API returned an unexpected response.')
            }

            const productReviews = await Promise.all(productsData.products.map(async (product) => {
                const { data: reviewsData } = await axios.get(
                    `${import.meta.env.API}/reviews?id=${encodeURIComponent(product._id)}`,
                    requestConfig
                )
                if (!Array.isArray(reviewsData.reviews)) {
                    throw new Error(`The reviews API returned an unexpected response for ${product.name}.`)
                }

                return reviewsData.reviews.map((review) => ({
                    ...review,
                    product: review.product?.name
                        ? review.product
                        : { _id: product._id, name: product.name }
                }))
            }))

            return productReviews.flat().sort(
                (first, second) => new Date(second.createdAt) - new Date(first.createdAt)
            )
        }

        let data
        try {
            ({ data } = await axios.get(
                `${import.meta.env.API}/reviews${query ? `?${query}` : ''}`,
                requestConfig
            ))
        } catch (error) {
            const needsProductFilter = error.response?.status === 404
                && error.response?.data?.message === 'Product not found.'
            if (id.trim() || !needsProductFilter) {
                return Promise.reject(error)
            }

            return getReviewsByProduct()
        }

        if (!Array.isArray(data.reviews)) {
            throw new Error('The reviews API returned an unexpected response.')
        }
        return data.reviews
    }, [])

    const getProductReviews = useCallback(async (id = '') => {
        setLoading(true)
        setLoadError('')
        try {
            setReviews(await fetchProductReviews(id))
        } catch (error) {
            setReviews([])
            const message = error.response?.data?.message || error.message || 'Reviews could not be loaded.'
            setLoadError(message)
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [fetchProductReviews])

    useEffect(() => {
        let isCurrent = true
        fetchProductReviews()
            .then((loadedReviews) => {
                if (isCurrent) {
                    setReviews(loadedReviews)
                    setLoadError('')
                }
            })
            .catch((error) => {
                if (isCurrent) {
                    setReviews([])
                    const message = error.response?.data?.message || error.message || 'Reviews could not be loaded.'
                    setLoadError(message)
                    toast.error(message)
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [fetchProductReviews])

    const deleteReview = async (reviewId) => {
        const review = reviews.find((item) => item._id === reviewId)
        const reviewProductId = review?.product?._id || review?.product
        if (!reviewProductId) {
            toast.error('The product for this review could not be found.')
            return
        }

        try {
            await axios.delete(
                `${import.meta.env.API}/reviews?id=${encodeURIComponent(reviewId)}&productId=${encodeURIComponent(reviewProductId)}`,
                { withCredentials: true }
            )
            setReviews((current) => current.filter((review) => review._id !== reviewId))
            toast.success('Review deleted.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Review could not be deleted.')
        }
    }

    const columns = [
        {
            field: 'product',
            headerName: 'Product',
            width: 200
        },
        { field: 'rating', headerName: 'Rating', width: 110 },
        { field: 'comment', headerName: 'Review', flex: 1, minWidth: 240 },
        { field: 'customer', headerName: 'Customer', width: 180 },
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 130,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : ''
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            renderCell: (params) => (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteReview(params.id)}>
                    Delete
                </button>
            )
        }
    ]
    const rows = reviews.map((review) => ({
        id: review._id,
        product: review.product?.name || 'Product unavailable',
        rating: `${review.rating} / 5`,
        comment: review.comment,
        customer: review.user?.name || review.name || 'Customer',
        createdAt: review.createdAt
    }))

    return (
        <>
            <MetaData title="Product reviews" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <main className="col-12 col-md-10 px-4">
                    <h1 className="my-5">Product reviews</h1>
                    {loadError && <p className="alert alert-danger" role="alert">{loadError}</p>}
                    <form className="form-inline mb-4" onSubmit={(event) => {
                        event.preventDefault()
                        getProductReviews(productId)
                    }}>
                        <label className="sr-only" htmlFor="productId_field">Filter by product ID</label>
                        <input id="productId_field" className="form-control mr-2 mb-2" placeholder="Filter by product ID (optional)"
                            value={productId} onChange={(event) => setProductId(event.target.value)} />
                        <button className="btn btn-primary mb-2" type="submit" disabled={loading}>
                            {loading ? 'Loading…' : 'Search'}
                        </button>
                        {productId.trim() && (
                            <button className="btn btn-outline-secondary mb-2" type="button" disabled={loading}
                                onClick={() => {
                                    setProductId('')
                                    getProductReviews()
                                }}>
                                Show all reviews
                            </button>
                        )}
                    </form>
                    <div style={{ width: '100%' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(row) => row.id}
                            loading={loading}
                            localeText={{
                                noRowsLabel: 'No reviews found. Check that the API uses the same MongoDB database where reviews were submitted.'
                            }}
                            autoHeight
                            pageSizeOptions={[5, 10, 25]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            showToolbar
                        />
                    </div>
                </main>
            </div>
        </>
    )
}

export default ProductReviews
