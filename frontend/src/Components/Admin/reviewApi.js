import axios from 'axios'

export const fetchProductReviews = async ({ id = '', products } = {}) => {
    const productId = id.trim()
    const query = productId ? `?id=${encodeURIComponent(productId)}` : ''
    const requestConfig = { withCredentials: true }

    const getReviewsByProduct = async () => {
        let productsToFetch = products
        if (!productsToFetch) {
            const { data } = await axios.get(
                `${import.meta.env.API}/admin/products`,
                requestConfig
            )
            if (!Array.isArray(data.products)) {
                throw new Error('The products API returned an unexpected response.')
            }
            productsToFetch = data.products
        }

        const productReviews = await Promise.all(productsToFetch.map(async (product) => {
            const { data } = await axios.get(
                `${import.meta.env.API}/reviews?id=${encodeURIComponent(product._id)}`,
                requestConfig
            )
            if (!Array.isArray(data.reviews)) {
                throw new Error(`The reviews API returned an unexpected response for ${product.name}.`)
            }

            return data.reviews.map((review) => ({
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
            `${import.meta.env.API}/reviews${query}`,
            requestConfig
        ))
    } catch (error) {
        const needsProductFilter = error.response?.status === 404
            && error.response?.data?.message === 'Product not found.'
        if (productId || !needsProductFilter) {
            throw error
        }

        return getReviewsByProduct()
    }

    if (!Array.isArray(data.reviews)) {
        throw new Error('The reviews API returned an unexpected response.')
    }
    return data.reviews
}
