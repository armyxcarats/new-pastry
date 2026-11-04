import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Sidebar from './SideBar'
import ProductCustomizationEditor from './ProductCustomizationEditor'

const productSchema = yup.object({
    name: yup.string().trim().min(2, 'Product name must be at least 2 characters.').required('Product name is required.'),
    price: yup.number().typeError('Price must be a number.').positive('Price must be greater than zero.').required('Price is required.'),
    description: yup.string().trim().min(20, 'Description must be at least 20 characters.').required('Description is required.'),
    category: yup.string().required('Please choose a category.'),
    stock: yup.number().integer('Stock must be a whole number.').min(0, 'Stock cannot be negative.').required('Stock is required.')
});

const readImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
})

const UpdateProduct = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [product, setProduct] = useState(null)
    const [categories, setCategories] = useState([])
    const [addOnOptions, setAddOnOptions] = useState([])
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [description, setDescription] = useState('')
    const [ingredients, setIngredients] = useState('')
    const [allergens, setAllergens] = useState('')
    const [category, setCategory] = useState('')
    const [subCategory, setSubCategory] = useState('')
    const [stock, setStock] = useState('')
    const [selectedAddOns, setSelectedAddOns] = useState([])
    const [customizationOptions, setCustomizationOptions] = useState([])
    const [images, setImages] = useState([])
    const [imagesPreview, setImagesPreview] = useState([])
    const [imageUrl, setImageUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let isCurrent = true
        Promise.all([
            axios.get(`${import.meta.env.API}/product/${id}`),
            axios.get(`${import.meta.env.API}/admin/product-options`, { withCredentials: true })
        ]).then(([productResponse, optionsResponse]) => {
            if (!isCurrent) return
            const current = productResponse.data.product
            setProduct(current)
            setName(current.name || '')
            setPrice(current.price ?? '')
            setDescription(current.description || '')
            setIngredients((current.ingredients || []).join(', '))
            setAllergens((current.allergens || []).join(', '))
            setCategory(current.category?._id || current.category || '')
            setSubCategory(current.subCategory?._id || current.subCategory || '')
            setStock(current.stock ?? '')
            setSelectedAddOns((current.addOns || []).map((item) => item._id || item))
            setCustomizationOptions((current.customizationOptions || []).map((option) => ({
                name: option.name,
                type: option.type,
                values: (option.values || []).map((value) => ({
                    label: value.label || '',
                    priceAdjustment: Number(value.priceAdjustment || 0)
                }))
            })))
            setImagesPreview((current.images || []).map((image) => image.url).filter(Boolean))
            const availableCategories = optionsResponse.data.categories || []
            const currentCategory = current.category
            if (currentCategory?._id
                && !availableCategories.some((item) => item._id === currentCategory._id)) {
                availableCategories.push(currentCategory)
            }
            setCategories(availableCategories)
            setAddOnOptions(optionsResponse.data.addOns || [])
        }).catch((requestError) => {
            if (isCurrent) {
                setError(requestError.response?.data?.message || 'Product details could not be loaded.')
            }
        }).finally(() => {
            if (isCurrent) setLoading(false)
        })

        return () => {
            isCurrent = false
        }
    }, [id])

    const onChangeImages = async (event) => {
        const files = Array.from(event.target.files || [])
        if (!files.length) return
        try {
            const imageData = await Promise.all(files.map(readImage))
            setImages(imageData)
            setImagesPreview(imageData)
        } catch (readError) {
            toast.error(readError.message)
        }
    }

    const toggleAddOn = (addOnId) => {
        setSelectedAddOns((selected) => (
            selected.includes(addOnId)
                ? selected.filter((selectedId) => selectedId !== addOnId)
                : [...selected, addOnId]
        ))
    }
    const topCategories = categories.filter((item) => !item.parentCategory)
    const subcategories = categories.filter(
        (item) => String(item.parentCategory?._id || item.parentCategory || '') === String(category)
    )

    const submitHandler = async (event) => {
        event.preventDefault()
        if (!product) return

        try {
            await productSchema.validate({
                name,
                price: Number(price),
                description,
                category,
                stock: Number(stock)
            }, { abortEarly: true })
        } catch (validationError) {
            toast.error(validationError.errors?.[0] || 'Please review the product details.')
            return
        }

        setSaving(true)
        const productData = {
            name,
            price: Number(price),
            description,
            ingredients: ingredients.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean),
            allergens: allergens.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean),
            category,
            subCategory: subCategory || null,
            stock: Number(stock),
            addOns: selectedAddOns,
            customizationOptions
        }
        if (images.length) productData.images = images
        else if (imageUrl.trim()) productData.images = [imageUrl.trim()]

        try {
            await axios.put(`${import.meta.env.API}/admin/product/${id}`, productData, {
                withCredentials: true
            })
            toast.success('Product updated successfully.')
            navigate('/admin/products')
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Product could not be updated.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <>
            <MetaData title="Update Product" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <main className="col-12 col-md-10">
                    <div className="wrapper my-5">
                        {loading ? <p className="p-4">Loading product...</p> : error ? (
                            <div className="alert alert-danger m-4" role="alert">{error}</div>
                        ) : (
                            <form className="shadow-lg" onSubmit={submitHandler}>
                                <h1 className="mb-4">Edit Product</h1>
                                <div className="form-group">
                                    <label htmlFor="name_field">Name</label>
                                    <input id="name_field" className="form-control" required maxLength="100"
                                        value={name} onChange={(event) => setName(event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="price_field">Price</label>
                                    <input id="price_field" className="form-control" type="number" min="0" step="0.01"
                                        required value={price} onChange={(event) => setPrice(event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="description_field">Description</label>
                                    <textarea id="description_field" className="form-control" rows="5" required
                                        value={description} onChange={(event) => setDescription(event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="ingredients_field">Ingredients</label>
                                    <textarea id="ingredients_field" className="form-control" rows="3"
                                        placeholder="List ingredients, separated by commas"
                                        value={ingredients} onChange={(event) => setIngredients(event.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="allergens_field">Product allergens</label>
                                    <textarea id="allergens_field" className="form-control" rows="2"
                                        placeholder="List known allergens, separated by commas"
                                        value={allergens} onChange={(event) => setAllergens(event.target.value)} />
                                    <small className="form-text text-muted">
                                        Enter known allergens clearly. Customers should check this information before ordering.
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="category_field">Category</label>
                                    <select id="category_field" className="form-control" required value={category}
                                        onChange={(event) => {
                                            setCategory(event.target.value)
                                            setSubCategory('')
                                        }}>
                                        <option value="">Choose a category</option>
                                        {topCategories.map((item) => (
                                            <option key={item._id} value={item._id}>{item.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {subcategories.length > 0 && (
                                    <div className="form-group">
                                        <label htmlFor="subcategory_field">Subcategory</label>
                                        <select id="subcategory_field" className="form-control" value={subCategory}
                                            onChange={(event) => setSubCategory(event.target.value)}>
                                            <option value="">No subcategory</option>
                                            {subcategories.map((item) => (
                                                <option key={item._id} value={item._id}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <ProductCustomizationEditor
                                    options={customizationOptions}
                                    onChange={setCustomizationOptions}
                                />
                                <div className="form-group">
                                    <label htmlFor="stock_field">Stock</label>
                                    <input id="stock_field" className="form-control" type="number" min="0" step="1"
                                        required value={stock} onChange={(event) => setStock(event.target.value)} />
                                </div>
                                <fieldset className="form-group">
                                    <legend className="h6">Available add-ons</legend>
                                    {addOnOptions.length ? (
                                        <div className="d-flex flex-wrap" style={{ gap: '8px 20px' }}>
                                            {addOnOptions.map((addOn) => (
                                                <label key={addOn._id} className="font-weight-normal">
                                                    <input type="checkbox" checked={selectedAddOns.includes(addOn._id)}
                                                        onChange={() => toggleAddOn(addOn._id)} />{' '}
                                                    {addOn.name} ({Number(addOn.price).toFixed(2)})
                                                </label>
                                            ))}
                                        </div>
                                    ) : <p className="text-muted">No active add-ons are available.</p>}
                                </fieldset>
                                <div className="form-group">
                                    <label htmlFor="product_image_url">Product image URL</label>
                                    <input id="product_image_url" className="form-control mb-2" type="url"
                                        placeholder="Or paste an image URL (https://...)"
                                        value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
                                    <label htmlFor="product_images">Or upload product images</label>
                                    <input id="product_images" className="form-control-file d-block" type="file"
                                        accept="image/*" multiple onChange={onChangeImages} />
                                    {imagesPreview.map((image, index) => (
                                        <img key={`${image.slice(-24)}-${index}`} src={image} alt={`Product preview ${index + 1}`}
                                            className="mt-3 mr-2" width="72" height="68" style={{ objectFit: 'cover' }} />
                                    ))}
                                    <small className="form-text text-muted">
                                        {images.length || imageUrl.trim()
                                            ? 'The selected photos will replace the current product photos.'
                                            : 'Choose photos or paste a URL only if you want to replace the current ones. Uploaded images are saved by the shop server.'}
                                    </small>
                                </div>
                                <button type="submit" className="btn btn-primary btn-block py-3" disabled={saving}>
                                    {saving ? 'SAVING...' : 'SAVE PRODUCT'}
                                </button>
                            </form>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}

export default UpdateProduct
