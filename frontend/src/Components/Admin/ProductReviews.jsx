import { useState } from 'react'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'

const ProductReviews = () => {
    const [productId, setProductId] = useState('')
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(false)

    const getProductReviews = async (id) => {
        if (!id.trim()) {
            toast.error('Enter a product ID.')
            return
        }
        setLoading(true)
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API}/reviews?id=${encodeURIComponent(id)}`, {
                withCredentials: true
            })
            setReviews(data.reviews || [])
        } catch (error) {
            setReviews([])
            toast.error(error.response?.data?.message || 'Reviews could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    const deleteReview = async (reviewId) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API}/reviews?id=${encodeURIComponent(reviewId)}&productId=${encodeURIComponent(productId)}`,
                { withCredentials: true }
            )
            setReviews((current) => current.filter((review) => review._id !== reviewId))
            toast.success('Review deleted.')
        } catch (error) {
            toast.error(error.response?.data?.message || 'Review could not be deleted.')
        }
    }

    const columns = [
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
                    <form className="form-inline mb-4" onSubmit={(event) => {
                        event.preventDefault()
                        getProductReviews(productId)
                    }}>
                        <label className="sr-only" htmlFor="productId_field">Product ID</label>
                        <input id="productId_field" className="form-control mr-2 mb-2" placeholder="Enter product ID"
                            value={productId} onChange={(event) => setProductId(event.target.value)} />
                        <button className="btn btn-primary mb-2" type="submit" disabled={loading}>
                            {loading ? 'Loading…' : 'Search'}
                        </button>
                    </form>
                    <div style={{ width: '100%' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowId={(row) => row.id}
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
