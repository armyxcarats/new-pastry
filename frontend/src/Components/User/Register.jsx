import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import './Login.css'

const registerSchema = yup.object({
    name: yup.string().trim().min(2, 'Name must be at least 2 characters.').required('Name is required.'),
    email: yup.string().trim().email('Please enter a valid email address.').required('Email is required.'),
    password: yup.string().trim().min(6, 'Password must be at least 6 characters.').required('Password is required.')
});

const Register = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        password: '',
    })
    const { name, email, password } = user
    const [avatar, setAvatar] = useState('')
    const [avatarPreview, setAvatarPreview] = useState('/images/default_avatar.jpg')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const onChange = (event) => {
        if (event.target.name === 'avatar') {
            const file = event.target.files?.[0]
            if (!file) return

            const reader = new FileReader()
            reader.onload = () => {
                if (reader.readyState === 2) {
                    setAvatarPreview(reader.result)
                    setAvatar(reader.result)
                }
            }
            reader.readAsDataURL(file)
            return
        }

        setUser({ ...user, [event.target.name]: event.target.value })
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        setError('')
        try {
            await registerSchema.validate({ name, email, password }, { abortEarly: true })
        } catch (validationError) {
            setError(validationError.errors?.[0] || 'Please review your registration details.')
            return
        }

        setLoading(true)

        const formData = new FormData()
        formData.set('name', name)
        formData.set('email', email)
        formData.set('password', password)
        formData.set('avatar', avatar)

        try {
            const { data } = await axios.post(`${import.meta.env.API}/register`, formData)
            toast.success('Registration complete! Sign in with your new credentials.')
            if (data.avatarUploadWarning) {
                toast.warning('Your account was created, but the avatar could not be uploaded.')
            }
            navigate('/login', {
                state: {
                    registrationCredentials: { email, password }
                }
            })
        } catch (requestError) {
            setError(
                requestError.response?.data?.message
                || requestError.response?.data?.error
                || 'Unable to create your account. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <MetaData title="Register User" />

            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler} encType="multipart/form-data">
                        <h1 className="mb-3">Register</h1>

                        <div className="form-group">
                            <label htmlFor="name_field">Name</label>
                            <input
                                type="text"
                                id="name_field"
                                className="form-control"
                                name="name"
                                value={name}
                                onChange={onChange}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="register_email_field">Email</label>
                            <input
                                type="email"
                                id="register_email_field"
                                className="form-control"
                                name="email"
                                value={email}
                                onChange={onChange}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="register_password_field">Password</label>
                            <input
                                type="password"
                                id="register_password_field"
                                className="form-control"
                                name="password"
                                value={password}
                                onChange={onChange}
                                autoComplete="new-password"
                                minLength={6}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="customFile">Avatar</label>
                            <div className="d-flex align-items-center">
                                <div>
                                    <figure className="avatar mr-3 item-rtl">
                                        <img
                                            src={avatarPreview}
                                            className="rounded-circle"
                                            alt="Avatar preview"
                                        />
                                    </figure>
                                </div>
                                <div className="custom-file">
                                    <input
                                        type="file"
                                        name="avatar"
                                        className="custom-file-input"
                                        id="customFile"
                                        accept="image/*"
                                        onChange={onChange}
                                    />
                                    <label className="custom-file-label" htmlFor="customFile">
                                        Choose Avatar
                                    </label>
                                </div>
                            </div>
                        </div>

                        {error && <p className="cookie-login-error" role="alert">{error}</p>}

                        <button
                            id="register_button"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'REGISTER'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Register
