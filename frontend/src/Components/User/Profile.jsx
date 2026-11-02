import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'

const Profile = () => {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [avatarError, setAvatarError] = useState(false)

    useEffect(() => {
        let isCurrent = true

        axios.get(`${import.meta.env.VITE_API}/me`)
            .then(({ data }) => {
                if (isCurrent) setUser(data.user)
            })
            .catch((error) => {
                if (isCurrent) {
                    toast.error(error.response?.data?.message || 'Your profile could not be loaded.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    if (loading) return <Loader />

    return (
        <>
            <MetaData title="Your Profile" />
            <main className="container my-5">
                <h1 className="mb-4">My Profile</h1>
                {user && (
                    <div className="row align-items-start">
                        <section className="col-12 col-md-4 mb-4">
                            {user.avatar?.url && !avatarError ? (
                                <img
                                    className="rounded-circle img-fluid"
                                    src={user.avatar.url}
                                    alt={`${user.name}'s profile`}
                                    style={{ width: 180, height: 180, objectFit: 'cover' }}
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    aria-label="No profile photo"
                                    style={{ width: 180, height: 180, background: '#fbf5eb', color: '#653d2c', fontSize: '4rem' }}
                                >
                                    {user.name?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                            <Link to="/me/update" className="btn btn-primary btn-block mt-4">
                                Edit Profile
                            </Link>
                        </section>

                        <section className="col-12 col-md-7">
                            <h2>{user.name}</h2>
                            <p className="text-muted text-capitalize">{user.role} account</p>
                            <dl className="row mt-4">
                                <dt className="col-sm-4">Email address</dt>
                                <dd className="col-sm-8">{user.email}</dd>
                                <dt className="col-sm-4">Contact number</dt>
                                <dd className="col-sm-8">{user.phoneNumber || 'Not provided'}</dd>
                                <dt className="col-sm-4">Delivery address</dt>
                                <dd className="col-sm-8">{user.deliveryAddress || 'Not provided'}</dd>
                                <dt className="col-sm-4">Food allergies</dt>
                                <dd className="col-sm-8">
                                    {user.hasAllergies
                                        ? (user.allergies || []).join(', ') || 'Allergies reported'
                                        : 'None reported'}
                                </dd>
                                <dt className="col-sm-4">Joined on</dt>
                                <dd className="col-sm-8">{new Date(user.createdAt).toLocaleDateString()}</dd>
                            </dl>

                            {user.role !== 'admin' && (
                                <Link to="/orders/me" className="btn btn-outline-primary btn-block mt-3">
                                    My Orders
                                </Link>
                            )}
                            <Link to="/password/update" className="btn btn-primary btn-block mt-3">
                                Change Password
                            </Link>
                        </section>
                    </div>
                )}
            </main>
        </>
    )
}

export default Profile
