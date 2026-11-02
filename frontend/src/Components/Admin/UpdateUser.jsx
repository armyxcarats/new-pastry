import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'

const UpdateUser = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user: currentUser } = useSelector((state) => state.auth || {})
    const [user, setUser] = useState(null)
    const [form, setForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        deliveryAddress: '',
        hasAllergies: false,
        allergies: '',
        role: 'customer',
        isActive: true
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const isSelf = user?._id === currentUser?._id

    useEffect(() => {
        let isCurrent = true

        axios.get(`${import.meta.env.VITE_API}/admin/user/${id}`)
            .then(({ data }) => {
                if (!isCurrent) return
                setUser(data.user)
                setForm({
                    name: data.user.name || '',
                    email: data.user.email || '',
                    phoneNumber: data.user.phoneNumber || '',
                    deliveryAddress: data.user.deliveryAddress || '',
                    hasAllergies: data.user.hasAllergies === true || (data.user.allergies || []).length > 0,
                    allergies: (data.user.allergies || []).join(', '),
                    role: data.user.role || 'customer',
                    isActive: data.user.isActive !== false
                })
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || 'User details could not be loaded.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [id])

    const onChange = (event) => {
        const { name, value, checked, type } = event.target
        setForm((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        setSaving(true)
        setError('')

        try {
            await axios.put(`${import.meta.env.VITE_API}/admin/user/${id}`, form)
            toast.success('User account updated successfully.')
            navigate('/admin/users', { replace: true })
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || 'The user account could not be updated.'
            )
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <Loader />

    return (
        <>
            <MetaData title="Edit User" />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <main className="col-12 col-md-10">
                    <div className="row justify-content-center my-5">
                        <div className="col-12 col-lg-8">
                            <form className="shadow-lg p-4" onSubmit={submitHandler}>
                                <h1 className="mb-4">Edit User Account</h1>
                                {user && <p className="text-muted">{user.email}</p>}

                                <div className="form-group">
                                    <label htmlFor="user_name">Full name</label>
                                    <input
                                        id="user_name"
                                        className="form-control"
                                        name="name"
                                        value={form.name}
                                        onChange={onChange}
                                        maxLength={30}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="user_email">Email address</label>
                                    <input
                                        id="user_email"
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={form.email}
                                        onChange={onChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="user_phone">Contact number</label>
                                    <input
                                        id="user_phone"
                                        type="tel"
                                        className="form-control"
                                        name="phoneNumber"
                                        value={form.phoneNumber}
                                        onChange={onChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="user_address">Delivery address</label>
                                    <textarea
                                        id="user_address"
                                        className="form-control"
                                        name="deliveryAddress"
                                        value={form.deliveryAddress}
                                        onChange={onChange}
                                        rows={3}
                                    />
                                </div>

                                <fieldset className="form-group">
                                    <legend className="h6">Food allergies</legend>
                                    <label htmlFor="user_allergy_status">Does this user have food allergies?</label>
                                    <select
                                        id="user_allergy_status"
                                        className="form-control"
                                        value={form.hasAllergies ? 'yes' : 'no'}
                                        onChange={(event) => setForm((current) => ({
                                            ...current,
                                            hasAllergies: event.target.value === 'yes',
                                            allergies: event.target.value === 'yes' ? current.allergies : ''
                                        }))}
                                    >
                                        <option value="no">No allergies</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                    {form.hasAllergies && (
                                        <div className="mt-3">
                                            <label htmlFor="user_allergies">List allergies</label>
                                            <textarea
                                                id="user_allergies"
                                                className="form-control"
                                                value={form.allergies}
                                                onChange={(event) => setForm((current) => ({
                                                    ...current,
                                                    allergies: event.target.value
                                                }))}
                                                placeholder="Separate allergies with commas"
                                                rows={2}
                                                maxLength={1600}
                                                required
                                            />
                                        </div>
                                    )}
                                </fieldset>

                                <div className="form-group">
                                    <label htmlFor="user_role">Account role</label>
                                    <select
                                        id="user_role"
                                        className="form-control"
                                        name="role"
                                        value={form.role}
                                        onChange={onChange}
                                        disabled={isSelf}
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="form-check mb-3">
                                    <input
                                        id="user_active"
                                        type="checkbox"
                                        className="form-check-input"
                                        name="isActive"
                                        checked={form.isActive}
                                        onChange={onChange}
                                        disabled={isSelf}
                                    />
                                    <label className="form-check-label" htmlFor="user_active">
                                        Account is active
                                    </label>
                                </div>

                                {error && <p className="text-danger" role="alert">{error}</p>}

                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save changes'}
                                </button>
                                <Link className="btn btn-link ml-2" to="/admin/users">Cancel</Link>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}

export default UpdateUser
