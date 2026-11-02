import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import Loader from '../Layout/Loader'

const ProtectedRoute = ({ children, isAdmin = false }) => {
    const { isAuthenticated, user, loading } = useSelector((state) => state.auth || {})
    const location = useLocation()

    if (loading) {
        return <Loader />
    }

    if (!isAuthenticated) {
        const redirect = encodeURIComponent(location.pathname.replace(/^\//, ''))
        return <Navigate to={`/login?redirect=${redirect}`} replace />
    }

    if (isAdmin && user?.role !== 'admin') {
        return <Navigate to="/" replace />
    }

    return children
};

export default ProtectedRoute;