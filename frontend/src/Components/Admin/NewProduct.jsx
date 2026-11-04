import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const NewProduct = () => {
    const navigate = useNavigate()
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
    const [loading, setLoading] = useState(false)
    const [optionsLoading, setOptionsLoading] = useState(true)
    const [optionsError, setOptionsError] = useState('')

    useEffect(() => {
        axios.get(`${import.meta.env.API}/admin/product-options`, { withCredentials: true })
            .then(({ data }) => {
                setCategories(data.categories || [])
                setAddOnOptions(data.addOns || [])
            })
            .catch((requestError) => {
                setOptionsError(requestError.response?.data?.message || 'Categories and add-ons could not be loaded.')
            })
            .finally(() => setOptionsLoading(false))
    }, [])

    const onChangeImages = async (event) => {
        const files = Array.from(event.target.files || [])
        if (!files.length) return
        try {
            const imageData = await Promise.all(files.map(readImage))
            setImages(imageData)
            setImagesPreview(imageData)
        } catch (error) {
            toast.error(error.message)
        }
    }

    const toggleAddOn = (id) => {
        setSelectedAddOns((selected) => (
            selected.includes(id)
                ? selected.filter((selectedId) => selectedId !== id)
                : [...selected, id]
        ))
    }
    const topCategories = categories.filter((item) => !item.parentCategory)
    const subcategories = categories.filter(
        (item) => String(item.parentCategory || '') === String(category)
    )

    const submitHandler = async (event) => {
        event.preventDefault()
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

        setLoading(true)
        try {
            await axios.post(`${import.meta.env.API}/admin/product/new`, {
                name,
                price: Number(price),
                description,
                ingredients: ingredients.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean),
                allergens: allergens.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean),
                category,
                subCategory: subCategory || null,
                stock: Number(stock),
                addOns: selectedAddOns,
                customizationOptions,
                images: images.length ? images : imageUrl.trim() ? [imageUrl.trim()] : []
            }, { withCredentials: true })
            toast.success('Product created successfully.')
            navigate('/admin/products')
        } catch (requestError) {
            toast.error(requestError.response?.data?.message || 'Product could not be created.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <MetaData title="New Product" />
            <div className="row">
                <div className="col-12 col-md-2"><Sidebar /></div>
                <main className="col-12 col-md-10">
                    <div className="wrapper my-5">
                        <form className="shadow-lg" onSubmit={submitHandler}>
                            <h1 className="mb-4">Add Product</h1>
                            {optionsError && <div className="alert alert-danger" role="alert">{optionsError}</div>}
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
                                    disabled={optionsLoading || categories.length === 0}
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
                                {optionsLoading ? <p>Loading add-ons...</p> : addOnOptions.length ? (
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
                                    Uploaded images are saved by the shop server; an image URL can also be used.
                                </small>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block py-3"
                                disabled={loading || optionsLoading || categories.length === 0}>
                                {loading ? 'CREATING...' : 'CREATE PRODUCT'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </>
    )
}

export default NewProduct
