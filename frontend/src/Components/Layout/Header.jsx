import '../../App.css'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import { getUser, logout } from '../Utils/helpers';
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../actions/userActions'

import Search from './Search'
export const Header = ({ cartItems }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth)

    // const logoutHandler = () => {
    //     logout(navigate('/'));

    //     toast.success('log out', {
    //         position: 'bottom-right'
    //     });
    // }

    const logoutHandler = () => {
        dispatch(logout());
        toast.success('log out', {
            position: 'bottom-right'
        });
    }
    // useEffect(() => {
    //     setUser(getUser())
    // }, []);
    return (
        <>
            <nav className="navbar row">
                <div className="col-12 col-md-3">
                    <div className="navbar-brand">
                        <Link to="/" className="bakery-header-brand">
                            <img src="/images/crumb-co-logo.png" alt="" />
                            <span className="bakery-header-brand-name">Crumb &amp; Co.</span>
                        </Link>

                    </div>

                </div>
                <Search />
                <div className="col-12 col-md-3 mt-4 mt-md-0 text-center">

                    {user ? (<div className="ml-4 dropdown d-inline">
                        <Link to="#!" className="btn dropdown-toggle text-white mr-4" type="button" id="dropDownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <figure className="avatar avatar-nav">
                                {user.avatar?.url ? (
                                    <img
                                        src={user.avatar.url}
                                        alt={user.name}
                                        className="rounded-circle"
                                    />
                                ) : (
                                    <span className="avatar-nav-fallback" aria-hidden="true">
                                        {user.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                            </figure>
                            <span>{user && user.name}</span>
                        </Link>

                        <div className="dropdown-menu" aria-labelledby="dropDownMenuButton">
                            {user && user.role === 'admin' && (
                                <Link className="dropdown-item" to="/dashboard">Admin dashboard</Link>
                            )}
                            <Link className="dropdown-item" to="/orders/me">Orders</Link>
                            <Link className="dropdown-item" to="/me">Profile</Link>

                            <Link
                                className="dropdown-item text-danger" to="/"
                                onClick={logoutHandler}
                            >
                                Logout
                            </Link>
                        </div>
                    </div>) : <Link to="/login" className="btn ml-4" id="login_btn">Login</Link>}

                    <Link to="/cart" style={{ textDecoration: 'none' }} >
                        <span id="cart" className="ml-3">Cart</span>
                        <span className="ml-1" id="cart_count">{cartItems ? cartItems.length : null}</span>
                        {/* <span className="ml-1" id="cart_count">2</span> */}
                    </Link>
                    {/* <span className="ml-1" id="cart_count">{cartItems ? cartItems.length : null}</span>  */}
                </div>

            </nav>
        </>
    )
}
