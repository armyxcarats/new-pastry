import React, { useState, } from 'react'

import MetaData from '../Layout/MetaData'
import axios from 'axios'
import { toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from "react-router-dom";



const ForgotPassword = () => {

    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [developmentResetUrl, setDevelopmentResetUrl] = useState('')

    const navigate = useNavigate()

    const forgotPassword = async (formData) => {
        setLoading(true)
        try {
            const { data } = await axios.post(
                `${import.meta.env.API}/password/forgot`,
                formData,
                { withCredentials: true }
            )

            if (data.developmentResetUrl) {
                setDevelopmentResetUrl(data.developmentResetUrl)
                return
            }

            toast.success(data.message, {
                position: 'bottom-center'
            });
            navigate('/login')
        } catch (error) {
            const message = error.response?.data?.message
                || error.response?.data?.error
                || (error.request
                    ? 'Cannot connect to the server. Please make sure the backend is running, then try again.'
                    : error.message)
                || 'Unable to send the password reset email. Please try again.'
            toast.error(message, {
                position: 'top-right'
            });
        } finally {
            setLoading(false)
        }
    }

    const submitHandler = (e) => {
        e.preventDefault();
        forgotPassword({ email: email.trim() })
    }

    return (
        <>
            <MetaData title={'Forgot Password'} />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-3">Forgot Password</h1>
                        <div className="form-group">
                            <label htmlFor="email_field">Enter Email</label>
                            <input
                                type="email"
                                id="email_field"
                                className="form-control"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {developmentResetUrl && (
                            <p className="alert alert-warning mt-3" role="status">
                                Email is unavailable in local development.{' '}
                                <a href={developmentResetUrl}>Open the password reset link</a>
                            </p>
                        )}

                        <button
                            id="forgot_password_button"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={loading} >
                            {loading ? 'Sending...' : 'Send Email'}
                        </button>

                    </form>
                </div>
            </div>

        </>
    )
}

export default ForgotPassword