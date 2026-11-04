import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import { LOGIN_SUCCESS } from '../../constants/userConstants'

const profileSchema = yup.object({
    name: yup.string().trim().min(2, 'Full name must be at least 2 characters.').required('Full name is required.'),
    email: yup.string().trim().email('Please enter a valid email address.').required('Email is required.'),
    phoneNumber: yup.string().trim().matches(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number.').optional(),
    deliveryAddress: yup.string().trim().max(250, 'Address cannot exceed 250 characters.').optional(),
    allergies: yup.string().trim().max(300, 'Allergies list is too long.').optional()
});

const UpdateProfile = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        deliveryAddress: '',
        hasAllergies: false,
        allergies: ''
    })
    const [avatar, setAvatar] = useState('')
    const [avatarPreview, setAvatarPreview] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        let isCurrent = true

        axios.get(`${import.meta.env.API}/me`)
            .then(({ data }) => {
                if (!isCurrent) return
                const user = data.user
                setForm({
                    name: user.name || '',
                    email: user.email || '',
                    phoneNumber: user.phoneNumber || '',
                    deliveryAddress: user.deliveryAddress || '',
                    hasAllergies: user.hasAllergies === true || (user.allergies || []).length > 0,
                    allergies: (user.allergies || []).join(', ')
                })
                setAvatarPreview(user.avatar?.url || '')
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || 'Your profile could not be loaded.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    const onChange = (event) => {
        if (event.target.name === 'avatar') {
            const file = event.target.files?.[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    setAvatarPreview(reader.result)
                    setAvatar(reader.result)
                }
            }
            reader.onerror = () => setError('The selected image could not be read. Please choose another file.')
            reader.readAsDataURL(file)
            return
        }

        setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        setError('')

        try {
            await profileSchema.validate({
                name: form.name,
                email: form.email,
                phoneNumber: form.phoneNumber,
                deliveryAddress: form.deliveryAddress,
                allergies: form.allergies
            }, { abortEarly: true })
        } catch (validationError) {
            setError(validationError.errors?.[0] || 'Please check your profile details.')
            return
        }

        setSaving(true)
        const formData = new FormData()
        Object.entries(form).forEach(([key, value]) => formData.set(key, value))
        if (avatar) formData.set('avatar', avatar)

        try {
            const { data } = await axios.put(`${import.meta.env.API}/me/update`, formData)
            dispatch({ type: LOGIN_SUCCESS, payload: data.user })
            toast.success('Profile updated successfully.')
            navigate('/me', { replace: true })
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || 'Your profile could not be updated. Please try again.'
            )
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loader />

    return (
        <>
            <MetaData title="Update Profile" />
            <main className="container my-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-lg-7">
                        <form className="shadow-lg p-4" onSubmit={submitHandler}>
                            <h1 className="mb-4">Edit Profile</h1>

                            <div className="form-group">
                                <label htmlFor="name_field">Full name</label>
                                <input
                                    type="text"
                                    id="name_field"
                                    className="form-control"
                                    name="name"
                                    value={form.name}
                                    onChange={onChange}
                                    maxLength={30}
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email_field">Email address</label>
                                <input
                                    type="email"
                                    id="email_field"
                                    className="form-control"
                                    name="email"
                                    value={form.email}
                                    onChange={onChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone_field">Contact number</label>
                                <input
                                    type="tel"
                                    id="phone_field"
                                    className="form-control"
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={onChange}
                                    autoComplete="tel"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address_field">Delivery address</label>
                                <textarea
                                    id="address_field"
                                    className="form-control"
                                    name="deliveryAddress"
                                    value={form.deliveryAddress}
                                    onChange={onChange}
                                    autoComplete="street-address"
                                    rows={3}
                                />
                            </div>

                            <fieldset className="form-group">
                                <legend className="h6">Food allergies</legend>
                                <label htmlFor="allergy_status">Do you have any food allergies?</label>
                                <select
                                    id="allergy_status"
                                    className="form-control"
                                    value={form.hasAllergies ? 'yes' : 'no'}
                                    onChange={(event) => setForm((current) => ({
                                        ...current,
                                        hasAllergies: event.target.value === 'yes',
                                        allergies: event.target.value === 'yes' ? current.allergies : ''
                                    }))}
                                >
                                    <option value="no">No allergies</option>
                                    <option value="yes">Yes, I have allergies</option>
                                </select>
                                {form.hasAllergies && (
                                    <div className="mt-3">
                                        <label htmlFor="allergies_field">List your allergies</label>
                                        <textarea
                                            id="allergies_field"
                                            className="form-control"
                                            value={form.allergies}
                                            onChange={(event) => setForm((current) => ({
                                                ...current,
                                                allergies: event.target.value
                                            }))}
                                            placeholder="For example: peanuts, dairy, eggs"
                                            rows={2}
                                            maxLength={1600}
                                            required
                                        />
                                        <small className="form-text text-muted">
                                            Separate each allergy with a comma. This helps you check product ingredient and allergen information.
                                        </small>
                                    </div>
                                )}
                            </fieldset>

                            <div className="form-group">
                                <label htmlFor="avatar_field">Profile photo</label>
                                {avatarPreview && (
                                    <div className="mb-3">
                                        <img
                                            src={avatarPreview}
                                            alt="Profile preview"
                                            className="rounded-circle"
                                            style={{ width: 96, height: 96, objectFit: 'cover' }}
                                        />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="avatar_field"
                                    className="form-control-file"
                                    name="avatar"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={onChange}
                                />
                                <small className="form-text text-muted">PNG, JPEG, WEBP, or GIF; maximum 5 MB.</small>
                            </div>

                            {error && <p className="text-danger" role="alert">{error}</p>}

                            <button type="submit" className="btn btn-primary btn-block mt-4" disabled={saving}>
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </>
    )
}

export default UpdateProfile
