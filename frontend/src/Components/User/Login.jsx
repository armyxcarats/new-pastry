import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import * as yup from 'yup'
import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, FacebookAuthProvider, getAuth, linkWithCredential, signInWithPopup } from 'firebase/auth'

import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData';
import { useDispatch, useSelector } from 'react-redux'
import { login, socialLogin } from '../../actions/userActions'
import './Login.css'

const loginSchema = yup.object({
    email: yup.string().trim().email('Please enter a valid email address.').required('Email is required.'),
    password: yup.string().trim().min(6, 'Password must be at least 6 characters.').required('Password is required.')
});

const firebaseConfig = {
    apiKey: import.meta.env.FIREBASE_API_KEY,
    authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.FIREBASE_PROJECT_ID,
    appId: import.meta.env.FIREBASE_APP_ID,
    messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID,
}

const firebaseApp = Object.values(firebaseConfig).every((value) => value)
    ? initializeApp(firebaseConfig)
    : null

const Login = () => {
    const { isAuthenticated, error, loading, user } = useSelector(state => state.auth)
    const location = useLocation()
    const registrationCredentials = location.state?.registrationCredentials
    const [email, setEmail] = useState(() => registrationCredentials?.email || '');
    const [password, setPassword] = useState(() => registrationCredentials?.password || '');
    const [socialLoading, setSocialLoading] = useState(false)
    const [pendingCredential, setPendingCredential] = useState(null)
    const [socialMessage, setSocialMessage] = useState('')
    const navigate = useNavigate()
    const dispatch = useDispatch()

    useEffect(() => {
        if (registrationCredentials) {
            navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
        }
    }, [location.pathname, location.search, navigate, registrationCredentials])

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            await loginSchema.validate({ email, password }, { abortEarly: true });
            dispatch(login(email, password))
        } catch (validationError) {
            const message = validationError?.errors?.[0] || 'Please check your login details.'
            if (typeof window !== 'undefined') {
                window.alert(message)
            }
        }
    }

    const handleSocialSignIn = async (providerName) => {
        if (!firebaseApp) {
            setSocialMessage('Social sign-in is not configured for this environment yet. Please use email and password instead.')
            return
        }

        try {
            setSocialLoading(true)
            setSocialMessage('')
            const auth = getAuth(firebaseApp)
            const provider = providerName === 'google'
                ? new GoogleAuthProvider()
                : new FacebookAuthProvider()

            let result = await signInWithPopup(auth, provider)

            if (pendingCredential) {
                result = await linkWithCredential(result.user, pendingCredential)
                setPendingCredential(null)
            }

            const idToken = await result.user.getIdToken()

            if (!result.user.email) {
                throw new Error('Your social account does not provide an email address.')
            }

            dispatch(socialLogin(providerName, idToken))
        } catch (socialError) {
            if (socialError?.code === 'auth/account-exists-with-different-credential') {
                if (!pendingCredential) {
                    const credential = providerName === 'google'
                        ? GoogleAuthProvider.credentialFromError(socialError)
                        : FacebookAuthProvider.credentialFromError(socialError)

                    if (credential) {
                        setPendingCredential(credential)
                    }
                }

                setSocialMessage(
                    'This email already uses another sign-in method. Click the button for the method already linked to this account; after you sign in, the other provider will be linked.'
                )
                return
            }

            const message = socialError?.message || 'Social sign-in could not be completed.'
            setSocialMessage(message)
        } finally {
            setSocialLoading(false)
        }
    }

    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') : ''

    useEffect(() => {
        if (isAuthenticated) {
            navigate(redirect ? `/${redirect}` : user?.role === 'admin' ? '/dashboard' : '/')
        }
    }, [isAuthenticated, navigate, redirect, user?.role])

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={'Login'} />

                    <main className="cookie-login-page">
                        <section className="cookie-login-story" aria-label="Welcome to Crumb and Co.">
                            <div className="cookie-login-story-copy">
                                <span className="cookie-login-kicker">A LITTLE SOMETHING, FRESHLY BAKED</span>
                                <h1>Your cookie break is waiting.</h1>
                                <p>Warm-from-the-oven favorites, made in small batches and ready to make your day.</p>
                                <span className="cookie-login-stamp">Baked with<br />a little joy</span>
                            </div>
                        </section>

                        <section className="cookie-login-panel" aria-labelledby="login_heading">
                            <Link to="/" className="cookie-login-wordmark">
                                <img src="/images/crumb-co-logo.png" alt="" />
                                <span>Crumb &amp; Co.</span>
                            </Link>
                            <p className="cookie-login-overline">GOOD TO HAVE YOU BACK</p>
                            <h2 id="login_heading">Sign in</h2>
                            <p className="cookie-login-intro">Pick up where your next favorite treat begins.</p>

                            <form onSubmit={submitHandler}>
                                <div className="cookie-login-field">
                                    <label htmlFor="email_field">Email address</label>
                                    <input
                                        type="email"
                                        id="email_field"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="cookie-login-field">
                                    <div className="cookie-login-password-label">
                                        <label htmlFor="password_field">Password</label>
                                        <Link to="/password/forgot">Forgot password?</Link>
                                    </div>
                                    <input
                                        type="password"
                                        id="password_field"
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {error && <p className="cookie-login-error" role="alert">{error}</p>}

                                <button id="login_button" type="submit" disabled={loading}>
                                    {loading ? 'Signing in...' : 'Sign in to your account'}
                                </button>
                            </form>

                            {socialMessage && <p className="cookie-login-error" role="alert">{socialMessage}</p>}

                            {firebaseApp ? (
                                <div className="cookie-login-social" aria-label="Social sign in options">
                                    <button
                                        type="button"
                                        className="cookie-login-social-button"
                                        onClick={() => handleSocialSignIn('google')}
                                        disabled={socialLoading || loading}
                                    >
                                        {socialLoading ? 'Connecting Google...' : 'Continue with Google'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cookie-login-social-button secondary"
                                        onClick={() => handleSocialSignIn('facebook')}
                                        disabled={socialLoading || loading}
                                    >
                                        {socialLoading ? 'Connecting Facebook...' : 'Continue with Facebook'}
                                    </button>
                                </div>
                            ) : (
                                <p className="cookie-login-social-unavailable" role="status">
                                    Google and Facebook sign-in are not set up yet. Use your email and password.
                                </p>
                            )}

                            <p className="cookie-login-register">New to the bakery? <Link to="/register">Create an account</Link></p>
                        </section>
                    </main>


                </>
            )}
        </>
    )
}
export default Login
