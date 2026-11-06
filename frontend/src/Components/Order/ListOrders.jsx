import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import axios from 'axios'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getToken } from '../Utils/helpers'

import {

    Button
} from '@mui/material'


import { DataGrid, } from '@mui/x-data-grid'

const ListOrders = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [myOrdersList, setMyOrdersList] = useState([])
    const [downloadingReceiptId, setDownloadingReceiptId] = useState('')

    const myOrders = async () => {
        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            }
            const { data } = await axios.get(`${import.meta.env.API}/orders/me`, {
                ...config,
                withCredentials: true
            })
            setMyOrdersList(data.orders)
            setLoading(false)

        } catch (error) {
            setError(error.response?.data?.message || 'Unable to load your orders.')
            setLoading(false)
        }
    }
    useEffect(() => {
        Promise.resolve().then(myOrders)
    }, [])

    useEffect(() => {
        if (error) {
            toast.error(error, {
                position: toast.POSITION.BOTTOM_RIGHT
            });
        }
    }, [error])

    const downloadReceipt = async (orderId) => {
        setDownloadingReceiptId(orderId)
        try {
            const { data } = await axios.get(`${import.meta.env.API}/order/${orderId}/receipt.pdf`, {
                responseType: 'blob',
                withCredentials: true
            })
            const pdfUrl = window.URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = pdfUrl
            link.download = `receipt-${orderId}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 1000)
        } catch {
            toast.error('The receipt PDF could not be downloaded. Please try again.')
        } finally {
            setDownloadingReceiptId('')
        }
    }

    const columns = [
        {
            field: 'id',
            headerName: 'Order ID',
            flex: 1,
            renderCell: (params) => <span style={{ wordBreak: 'break-all' }}>{params.value}</span>
        },
        {
            field: 'numOfItems',
            headerName: 'Num of Items',
            type: 'number',
            width: 130,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 120,
            align: 'right',
            headerAlign: 'right'
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 160,
            renderCell: (params) =>
                (['Ready', 'Completed'].includes(params.value))
                    ? <span style={{ color: 'green' }}>{params.value}</span>
                    : <span style={{ color: 'red' }}>{params.value}</span>
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 280,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: '100%', flexWrap: 'nowrap' }}>
                    <Button
                        component={Link}
                        to={`/order/${params.id}`}
                        variant="contained"
                        size="small"
                        sx={{ minWidth: 72, px: 1 }}
                        aria-label={`View order ${params.id}`}
                    >
                        <i className="fa fa-eye" />
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 180, px: 1.5, whiteSpace: 'nowrap' }}
                        onClick={() => downloadReceipt(params.id)}
                        disabled={downloadingReceiptId === params.id}
                        aria-label={`Download receipt for order ${params.id}`}
                    >
                        {downloadingReceiptId === params.id ? 'Preparing…' : 'Download Receipt'}
                    </Button>
                </div>
            )
        }
    ];

    const rows = myOrdersList.map(order => ({
        id: order._id,
        numOfItems: order.orderItems.length,
        amount: `₱${(Number(order.subtotal || 0) + Number(order.shippingFee || 0)).toFixed(2)}`,
        status: order.orderStatus || ''
    }));



    return (
        <>
            <MetaData title={'My Orders'} />
            <h1 className="my-5">My Orders</h1>




            {loading ? <Loader /> : (
                <div style={{ width: '100%' }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}

                        pageSize={5}
                        rowsPerPageOptions={[5, 10, 25]}
                        disableSelectionOnClick
                        getRowId={(row) => row.id}
                        showToolbar
                    />
                </div>
            )}
        </>
    )
}

export default ListOrders