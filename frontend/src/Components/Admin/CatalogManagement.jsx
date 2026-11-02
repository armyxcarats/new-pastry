import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'

const API = import.meta.env.VITE_API
const ADDON_CATEGORIES = ['cake', 'pastry', 'cookies', 'drinks', 'party']

const CatalogManagement = () => {
    const [categories, setCategories] = useState([])
    const [addOns, setAddOns] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parentCategory: '' })
    const [addOnForm, setAddOnForm] = useState({ name: '', category: 'cake', description: '', price: '' })
    const [editingCategory, setEditingCategory] = useState('')
    const [editingAddOn, setEditingAddOn] = useState('')
    const [error, setError] = useState('')

    const loadCatalog = async () => {
        try {
            const { data } = await axios.get(`${API}/admin/catalog-management`, { withCredentials: true })
            setCategories(data.categories || [])
            setAddOns(data.addOns || [])
            setError('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Catalog settings could not be loaded.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        let isCurrent = true
        axios.get(`${API}/admin/catalog-management`, { withCredentials: true })
            .then(({ data }) => {
                if (!isCurrent) return
                setCategories(data.categories || [])
                setAddOns(data.addOns || [])
                setError('')
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || 'Catalog settings could not be loaded.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })
        return () => {
            isCurrent = false
        }
    }, [])

    const parentCategories = useMemo(
        () => categories.filter((category) => !category.parentCategory),
        [categories]
    )
    const subcategories = useMemo(
        () => categories.filter((category) => Boolean(category.parentCategory)),
        [categories]
    )

    const saveCategory = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            const url = editingCategory
                ? `${API}/admin/categories/${editingCategory}`
                : `${API}/admin/categories`
            await axios[editingCategory ? 'put' : 'post'](url, categoryForm, { withCredentials: true })
            toast.success(editingCategory ? 'Category updated.' : 'Category created.')
            setCategoryForm({ name: '', description: '', parentCategory: '' })
            setEditingCategory('')
            await loadCatalog()
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Category could not be saved.')
        } finally {
            setSaving(false)
        }
    }

    const editCategory = (category) => {
        setEditingCategory(category._id)
        setCategoryForm({
            name: category.name,
            description: category.description || '',
            parentCategory: category.parentCategory?._id || ''
        })
    }

    const toggleCategory = async (category) => {
        try {
            await axios.patch(`${API}/admin/categories/${category._id}/active`, {
                isActive: !category.isActive
            }, { withCredentials: true })
            await loadCatalog()
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Category status could not be changed.')
        }
    }

    const saveAddOn = async (event) => {
        event.preventDefault()
        setSaving(true)
        try {
            const url = editingAddOn
                ? `${API}/admin/addons/${editingAddOn}`
                : `${API}/admin/addons`
            const payload = { ...addOnForm, price: Number(addOnForm.price) }
            await axios[editingAddOn ? 'put' : 'post'](url, payload, { withCredentials: true })
            toast.success(editingAddOn ? 'Add-on updated.' : 'Add-on created.')
            setAddOnForm({ name: '', category: 'cake', description: '', price: '' })
            setEditingAddOn('')
            await loadCatalog()
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Add-on could not be saved.')
        } finally {
            setSaving(false)
        }
    }

    const editAddOn = (addOn) => {
        setEditingAddOn(addOn._id)
        setAddOnForm({
            name: addOn.name,
            category: addOn.category,
            description: addOn.description || '',
            price: String(addOn.price)
        })
    }

    const toggleAddOn = async (addOn) => {
        try {
            await axios.patch(`${API}/admin/addons/${addOn._id}/active`, {
                isActive: !addOn.isActive
            }, { withCredentials: true })
            await loadCatalog()
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Add-on status could not be changed.')
        }
    }

    return (
        <>
            <MetaData title="Categories and add-ons" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <main className="col-12 col-md-10 px-4">
                    <header className="my-5">
                        <h1>Categories &amp; add-ons</h1>
                        <p className="text-muted">Manage product categories, subcategories, extras, and the product options configured on each product.</p>
                    </header>
                    {error && <div className="alert alert-danger">{error}</div>}
                    {loading ? <Loader /> : (
                        <>
                            <section className="card p-4 mb-5">
                                <h2 className="h4">{editingCategory ? 'Edit category' : 'Create category or subcategory'}</h2>
                                <form onSubmit={saveCategory}>
                                    <div className="form-row">
                                        <div className="form-group col-md-4">
                                            <label htmlFor="catalog-category-name">Name</label>
                                            <input id="catalog-category-name" className="form-control" maxLength="50" required
                                                value={categoryForm.name}
                                                onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} />
                                        </div>
                                        <div className="form-group col-md-4">
                                            <label htmlFor="catalog-category-parent">Parent category</label>
                                            <select id="catalog-category-parent" className="form-control"
                                                value={categoryForm.parentCategory}
                                                onChange={(event) => setCategoryForm({ ...categoryForm, parentCategory: event.target.value })}>
                                                <option value="">Top-level category</option>
                                                {parentCategories.map((category) => (
                                                    <option key={category._id} value={category._id}>{category.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group col-md-4">
                                            <label htmlFor="catalog-category-description">Description</label>
                                            <input id="catalog-category-description" className="form-control"
                                                value={categoryForm.description}
                                                onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} />
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving…' : editingCategory ? 'Save category' : 'Create category'}
                                    </button>
                                    {editingCategory && (
                                        <button type="button" className="btn btn-link" onClick={() => {
                                            setEditingCategory('')
                                            setCategoryForm({ name: '', description: '', parentCategory: '' })
                                        }}>Cancel</button>
                                    )}
                                </form>

                                <h3 className="h5 mt-4">Categories and subcategories</h3>
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead><tr><th>Name</th><th>Parent</th><th>Status</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {[...parentCategories, ...subcategories].map((category) => (
                                                <tr key={category._id}>
                                                    <td>{category.name}</td>
                                                    <td>{category.parentCategory?.name || '—'}</td>
                                                    <td>{category.isActive ? 'Active' : 'Inactive'}</td>
                                                    <td>
                                                        <button type="button" className="btn btn-sm btn-outline-primary mr-2" onClick={() => editCategory(category)}>Edit</button>
                                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => toggleCategory(category)}>
                                                            {category.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!categories.length && <tr><td colSpan="4">No categories yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="card p-4 mb-5">
                                <h2 className="h4">{editingAddOn ? 'Edit add-on' : 'Create add-on'}</h2>
                                <form onSubmit={saveAddOn}>
                                    <div className="form-row">
                                        <div className="form-group col-md-3">
                                            <label htmlFor="catalog-addon-name">Name</label>
                                            <input id="catalog-addon-name" className="form-control" required
                                                value={addOnForm.name}
                                                onChange={(event) => setAddOnForm({ ...addOnForm, name: event.target.value })} />
                                        </div>
                                        <div className="form-group col-md-3">
                                            <label htmlFor="catalog-addon-category">Type</label>
                                            <select id="catalog-addon-category" className="form-control"
                                                value={addOnForm.category}
                                                onChange={(event) => setAddOnForm({ ...addOnForm, category: event.target.value })}>
                                                {ADDON_CATEGORIES.map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group col-md-2">
                                            <label htmlFor="catalog-addon-price">Price (₱)</label>
                                            <input id="catalog-addon-price" type="number" min="0" step="0.01" className="form-control" required
                                                value={addOnForm.price}
                                                onChange={(event) => setAddOnForm({ ...addOnForm, price: event.target.value })} />
                                        </div>
                                        <div className="form-group col-md-4">
                                            <label htmlFor="catalog-addon-description">Description</label>
                                            <input id="catalog-addon-description" className="form-control"
                                                value={addOnForm.description}
                                                onChange={(event) => setAddOnForm({ ...addOnForm, description: event.target.value })} />
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving…' : editingAddOn ? 'Save add-on' : 'Create add-on'}
                                    </button>
                                    {editingAddOn && (
                                        <button type="button" className="btn btn-link" onClick={() => {
                                            setEditingAddOn('')
                                            setAddOnForm({ name: '', category: 'cake', description: '', price: '' })
                                        }}>Cancel</button>
                                    )}
                                </form>

                                <h3 className="h5 mt-4">Available add-ons</h3>
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead><tr><th>Name</th><th>Type</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {addOns.map((addOn) => (
                                                <tr key={addOn._id}>
                                                    <td>{addOn.name}</td>
                                                    <td>{addOn.category}</td>
                                                    <td>₱{Number(addOn.price).toFixed(2)}</td>
                                                    <td>{addOn.isActive ? 'Active' : 'Inactive'}</td>
                                                    <td>
                                                        <button type="button" className="btn btn-sm btn-outline-primary mr-2" onClick={() => editAddOn(addOn)}>Edit</button>
                                                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => toggleAddOn(addOn)}>
                                                            {addOn.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {!addOns.length && <tr><td colSpan="5">No add-ons yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </>
    )
}

export default CatalogManagement
