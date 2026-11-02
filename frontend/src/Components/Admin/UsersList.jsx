import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-toastify'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import Sidebar from './SideBar'

const UsersList = () => {
    const { user: currentUser } = useSelector((state) => state.auth || {})
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState('')

    useEffect(() => {
        let isCurrent = true

        axios.get(`${import.meta.env.VITE_API}/admin/users`)
            .then(({ data }) => {
                if (isCurrent) setUsers(data.users || [])
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.response?.data?.message || 'Users could not be loaded.')
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    const updateUser = async (target, changes) => {
        setUpdatingId(target._id)
        try {
            const { data } = await axios.put(
                `${import.meta.env.VITE_API}/admin/user/${target._id}`,
                changes
            )
            setUsers((current) => current.map((item) => (
                item._id === target._id ? data.user : item
            )))
            toast.success('User account updated.')
        } catch (requestError) {
            toast.error(
                requestError.response?.data?.message
                || 'The user account could not be updated.'
            )
        } finally {
            setUpdatingId('')
        }
    }

    const deleteUser = async (target) => {
        if (!window.confirm(`Delete the account for ${target.name}? This cannot be undone.`)) return

        setUpdatingId(target._id)
        try {
            await axios.delete(`${import.meta.env.VITE_API}/admin/user/${target._id}`)
            setUsers((current) => current.filter((item) => item._id !== target._id))
            toast.success('User account deleted.')
        } catch (requestError) {
            toast.error(
                requestError.response?.data?.message
                || 'The user account could not be deleted.'
            )
        } finally {
            setUpdatingId('')
        }
    }

    return (
        <>
            <MetaData title="Manage Users" />
            <div className="row">
                <div className="col-12 col-md-2">
                    <Sidebar />
                </div>
                <main className="col-12 col-md-10">
                    <h1 className="my-5">Manage Users</h1>
                    {error && <p className="text-danger" role="alert">{error}</p>}
                    {loading ? <Loader /> : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Contact</th>
                                        <th>Role</th>
                                        <th>Account status</th>
                                        <th>Admin actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((target) => {
                                        const isSelf = target._id === currentUser?._id
                                        const isUpdating = updatingId === target._id

                                        return (
                                            <tr key={target._id}>
                                                <td>{target.name}</td>
                                                <td>{target.email}</td>
                                                <td>{target.phoneNumber || '—'}</td>
                                                <td className="text-capitalize">{target.role}</td>
                                                <td>{target.isActive ? 'Active' : 'Deactivated'}</td>
                                                <td>
                                                    <div className="d-flex flex-wrap" style={{ gap: 8 }}>
                                                        <Link
                                                            className="btn btn-sm btn-outline-primary"
                                                            to={`/admin/user/${target._id}`}
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            disabled={isSelf || isUpdating}
                                                            onClick={() => updateUser(target, {
                                                                role: target.role === 'admin' ? 'customer' : 'admin'
                                                            })}
                                                        >
                                                            {target.role === 'admin' ? 'Make customer' : 'Make admin'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm ${target.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                            disabled={isSelf || isUpdating}
                                                            onClick={() => updateUser(target, {
                                                                isActive: !target.isActive
                                                            })}
                                                        >
                                                            {target.isActive ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            disabled={isSelf || isUpdating}
                                                            onClick={() => deleteUser(target)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {!users.length && <p>No users found.</p>}
                        </div>
                    )}
                </main>
            </div>
        </>
    )
}

export default UsersList
