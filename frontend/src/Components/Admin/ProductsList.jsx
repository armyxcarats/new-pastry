import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
})

const ProductsList = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [selectedProductIds, setSelectedProductIds] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        let isCurrent = true

        axios.get(`${import.meta.env.VITE_API}/admin/products`)
            .then(({ data }) => {
                if (isCurrent) setProducts(data.products || [])
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || 'Products could not be loaded.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    const categories = useMemo(() => (
        [...new Set(products.map((product) => product.category?.name).filter(Boolean))]
            .sort((first, second) => first.localeCompare(second))
    ), [products])

    const visibleProducts = useMemo(() => {
        const query = search.trim().toLowerCase()
        return products.filter((product) => {
            const matchesSearch = !query
                || product.name.toLowerCase().includes(query)
                || (product.addOns || []).some((addOn) => addOn.name.toLowerCase().includes(query))
            const matchesCategory = categoryFilter === 'all'
                || product.category?.name === categoryFilter
            return matchesSearch && matchesCategory
        })
    }, [categoryFilter, products, search])

    const toggleProductSelection = (productId) => {
        setSelectedProductIds((current) => (
            current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId]
        ))
    }

    const toggleAllProducts = () => {
        if (selectedProductIds.length === visibleProducts.length) {
            setSelectedProductIds([])
            return
        }
        setSelectedProductIds(visibleProducts.map((product) => product._id))
    }

    const deleteSelectedProducts = async () => {
        if (!selectedProductIds.length) return
        if (!window.confirm(`Delete ${selectedProductIds.length} selected product(s)?`)) return

        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/products`, {
                data: { ids: selectedProductIds },
                withCredentials: true
            })
            setProducts((current) => current.filter((product) => !selectedProductIds.includes(product._id)))
            setSelectedProductIds([])
            toast.success('Selected products were deleted successfully.')
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'The selected products could not be deleted.')
        }
    }

    const deleteProduct = async (product) => {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return

        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/product/${product._id}`)
            setProducts((current) => current.filter((item) => item._id !== product._id))
            setSelectedProductIds((current) => current.filter((id) => id !== product._id))
            toast.success('Product deleted successfully.')
        } catch (requestError) {
            toast.error(
                requestError.response?.data?.message
                || 'The product could not be deleted.'
            )
        }
    }

    return (
        <>
            <MetaData title="All Products" />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <main className="col-12 col-md-10 px-4">
                    <header className="d-flex flex-wrap align-items-center justify-content-between my-5">
                        <div>
                            <h1 className="mb-1">Products</h1>
                            <p className="text-muted mb-0">Manage product photos, categories, add-ons, and stock.</p>
                        </div>
                        <Link to="/admin/product" className="btn btn-primary mt-3 mt-md-0">
                            Add product
                        </Link>
                    </header>

                    <div className="row mb-4">
                        <div className="col-12 col-md-7 mb-2">
                            <label className="sr-only" htmlFor="product-search">Search products or add-ons</label>
                            <input
                                id="product-search"
                                className="form-control"
                                type="search"
                                placeholder="Search products or add-ons"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>
                        <div className="col-12 col-md-5 mb-2">
                            <label className="sr-only" htmlFor="category-filter">Filter by category</label>
                            <select
                                id="category-filter"
                                className="form-control"
                                value={categoryFilter}
                                onChange={(event) => setCategoryFilter(event.target.value)}
                            >
                                <option value="all">All categories</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedProductIds.length > 0 && (
                        <div className="d-flex justify-content-end mb-3">
                            <button type="button" className="btn btn-outline-danger" onClick={deleteSelectedProducts}>
                                Delete selected ({selectedProductIds.length})
                            </button>
                        </div>
                    )}

                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    {loading ? <Loader /> : visibleProducts.length ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="thead-light">
                                    <tr>
                                        <th scope="col" style={{ width: 44 }}>
                                            <input
                                                type="checkbox"
                                                aria-label="Select all visible products"
                                                checked={visibleProducts.length > 0 && selectedProductIds.length === visibleProducts.length}
                                                onChange={toggleAllProducts}
                                            />
                                        </th>
                                        <th scope="col">Product</th>
                                        <th scope="col">Category</th>
                                        <th scope="col">Price</th>
                                        <th scope="col">Stock</th>
                                        <th scope="col">Add-ons</th>
                                        <th scope="col">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleProducts.map((product) => (
                                        <tr key={product._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Select ${product.name}`}
                                                    checked={selectedProductIds.includes(product._id)}
                                                    onChange={() => toggleProductSelection(product._id)}
                                                />
                                            </td>
                                            <td style={{ minWidth: 230 }}>
                                                <div className="d-flex align-items-center" style={{ gap: 12 }}>
                                                    {product.images?.[0]?.url ? (
                                                        <img
                                                            src={product.images[0].url}
                                                            alt=""
                                                            loading="lazy"
                                                            style={{
                                                                width: 68,
                                                                height: 68,
                                                                objectFit: 'cover',
                                                                borderRadius: 8,
                                                                background: '#f2eadc'
                                                            }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className="d-flex align-items-center justify-content-center"
                                                            aria-label="No product photo"
                                                            style={{
                                                                width: 68,
                                                                height: 68,
                                                                borderRadius: 8,
                                                                background: '#f2eadc',
                                                                color: '#76685e'
                                                            }}
                                                        >
                                                            No image
                                                        </div>
                                                    )}
                                                    <div>
                                                        <strong>{product.name}</strong>
                                                        <div className="small text-muted">#{product._id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {product.category?.name || 'Uncategorized'}
                                                {product.subCategory?.name && (
                                                    <div className="small text-muted">{product.subCategory.name}</div>
                                                )}
                                            </td>
                                            <td>{currency.format(Number(product.price || 0))}</td>
                                            <td>{product.stock}</td>
                                            <td style={{ minWidth: 190 }}>
                                                {product.addOns?.length ? (
                                                    <div className="d-flex flex-wrap" style={{ gap: 4 }}>
                                                        {product.addOns.map((addOn) => (
                                                            <span
                                                                key={addOn._id}
                                                                className="badge badge-light border"
                                                                title={`${addOn.name}: ${currency.format(Number(addOn.price || 0))}`}
                                                            >
                                                                {addOn.name} · {currency.format(Number(addOn.price || 0))}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">None</span>
                                                )}
                                            </td>
                                            <td style={{ minWidth: 145 }}>
                                                <Link
                                                    to={`/admin/product/${product._id}`}
                                                    className="btn btn-sm btn-outline-primary mr-2"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => deleteProduct(product)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-light border">
                            No products match those filters.
                        </div>
                    )}
                </main>
            </div>
        </>
    )
}

export default ProductsList
