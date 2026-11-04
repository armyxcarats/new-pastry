import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'
import { DataGrid } from '@mui/x-data-grid'

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

        axios.get(`${import.meta.env.API}/admin/products`)
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
                || String(product.name || '').toLowerCase().includes(query)
                || (product.addOns || []).some((addOn) => String(addOn.name || '').toLowerCase().includes(query))
            const matchesCategory = categoryFilter === 'all'
                || product.category?.name === categoryFilter
            return matchesSearch && matchesCategory
        })
    }, [categoryFilter, products, search])

    const rows = visibleProducts.map((product) => ({
        id: product._id,
        product,
        name: product.name,
        category: product.category?.name || 'Uncategorized',
        subCategory: product.subCategory?.name || '',
        price: Number(product.price || 0),
        stock: product.stock,
        addOns: product.addOns || []
    }))

    const columns = [
        {
            field: 'name',
            headerName: 'Product',
            flex: 1.4,
            minWidth: 250,
            renderCell: ({ row }) => (
                <div className="d-flex align-items-center" style={{ gap: 12, minWidth: 0 }}>
                    {row.product.images?.[0]?.url ? (
                        <img
                            src={row.product.images[0].url}
                            alt=""
                            loading="lazy"
                            style={{
                                width: 56,
                                height: 56,
                                flex: '0 0 56px',
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
                                width: 56,
                                height: 56,
                                flex: '0 0 56px',
                                borderRadius: 8,
                                background: '#f2eadc',
                                color: '#76685e'
                            }}
                        >
                            No image
                        </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                        <strong>{row.name}</strong>
                        <div className="small text-muted">#{row.id}</div>
                    </div>
                </div>
            )
        },
        {
            field: 'category',
            headerName: 'Category',
            flex: 0.8,
            minWidth: 140,
            renderCell: ({ row }) => (
                <div>
                    {row.category}
                    {row.subCategory && <div className="small text-muted">{row.subCategory}</div>}
                </div>
            )
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 125,
            valueFormatter: (value) => currency.format(Number(value || 0))
        },
        { field: 'stock', headerName: 'Stock', width: 95 },
        {
            field: 'addOns',
            headerName: 'Add-ons',
            flex: 1,
            minWidth: 230,
            sortable: false,
            filterable: false,
            renderCell: ({ row }) => row.addOns.length ? (
                <div
                    className="d-flex flex-wrap align-content-center"
                    style={{ gap: 6, padding: '8px 0', whiteSpace: 'normal' }}
                >
                    {row.addOns.map((addOn) => (
                        <span
                            key={addOn._id}
                            className="badge badge-light border"
                            style={{ maxWidth: '100%', whiteSpace: 'normal', textAlign: 'left' }}
                            title={`${addOn.name}: ${currency.format(Number(addOn.price || 0))}`}
                        >
                            {addOn.name} · {currency.format(Number(addOn.price || 0))}
                        </span>
                    ))}
                </div>
            ) : <span className="text-muted">None</span>
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 155,
            sortable: false,
            filterable: false,
            renderCell: ({ row }) => (
                <div className="d-flex align-items-center" style={{ gap: 8 }}>
                    <Link
                        to={`/admin/product/${row.id}`}
                        className="btn btn-sm btn-outline-primary"
                    >
                        Edit
                    </Link>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteProduct(row.product)}
                    >
                        Delete
                    </button>
                </div>
            )
        }
    ]

    const deleteSelectedProducts = async () => {
        if (!selectedProductIds.length) return
        if (!window.confirm(`Delete ${selectedProductIds.length} selected product(s)?`)) return

        try {
            await axios.delete(`${import.meta.env.API}/admin/products`, {
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
            await axios.delete(`${import.meta.env.API}/admin/product/${product._id}`)
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
                    {loading ? <Loader /> : (
                        <div style={{ width: '100%' }}>
                            <DataGrid
                                aria-label="Products"
                                rows={rows}
                                columns={columns}
                                loading={loading}
                                checkboxSelection
                                checkboxSelectionVisibleOnly
                                disableRowSelectionOnClick
                                keepNonExistentRowsSelected
                                rowSelectionModel={{
                                    type: 'include',
                                    ids: new Set(selectedProductIds)
                                }}
                                onRowSelectionModelChange={(selection) => {
                                    setSelectedProductIds([...selection.ids].map(String))
                                }}
                                autoHeight
                                getRowHeight={() => 'auto'}
                                getEstimatedRowHeight={() => 100}
                                pageSizeOptions={[5, 10, 25, 50]}
                                initialState={{
                                    pagination: { paginationModel: { pageSize: 10, page: 0 } }
                                }}
                                showToolbar
                                slots={{
                                    noRowsOverlay: () => (
                                        <div className="d-flex h-100 align-items-center justify-content-center">
                                            No products match those filters.
                                        </div>
                                    )
                                }}
                            />
                        </div>
                    )}
                </main>
            </div>
        </>
    )
}

export default ProductsList
