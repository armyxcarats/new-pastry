import { useState, useEffect } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const NewPassword = () => {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const { token } = useParams();

    const resetPassword = async (token, passwords) => {
        setLoading(true)
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_API}/password/reset/${encodeURIComponent(token)}`,
                passwords,
                { withCredentials: true }
            )
            setSuccess(data.success)
        } catch (error) {
            setError(
                error.response?.data?.message
                || error.response?.data?.error
                || (error.request
                    ? 'Cannot connect to the server. Please try again.'
                    : error.message)
                || 'Unable to reset your password. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: 'bottom-right'
            });
        }
        if (success) {
            toast.success('Password updated successfully.', {
                position: 'bottom-right'
            });
            navigate('/login')
        }

    }, [error, success, navigate])

    const submitHandler = (e) => {
        e.preventDefault();
        setError('')
        resetPassword(token, { password, confirmPassword })
    }

    return (
        <>
            <MetaData title={'New Password Reset'} />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form className="shadow-lg" onSubmit={submitHandler}>
                        <h1 className="mb-3">New Password</h1>

                        <div className="form-group">
                            <label htmlFor="password_field">Password</label>
                            <input
                                type="password"
                                id="password_field"
                                className="form-control"
                                autoComplete="new-password"
                                minLength={6}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm_password_field">Confirm Password</label>
                            <input
                                type="password"
                                id="confirm_password_field"
                                className="form-control"
                                autoComplete="new-password"
                                minLength={6}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <button
                            id="new_password_button"
                            type="submit"
                            className="btn btn-block py-3"
                            disabled={loading}>
                            {loading ? 'Updating...' : 'Set Password'}
                        </button>

                    </form>
                </div>
            </div>

        </>
    )
}

export default NewPassword