import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux'
import store from './store'

axios.defaults.withCredentials = true

createRoot(document.getElementById('root')).render(

  <Provider store={store} >
    <App />
  </Provider>




)
