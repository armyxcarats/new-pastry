const Order = require('../models/order');
const Product = require('../models/product');
const PDFDocument = require('pdfkit');
const sendEmail = require('../utils/sendEmail');
const MINIMUM_LEAD_TIME_MS = 48 * 60 * 60 * 1000;
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Baking', 'Ready', 'Completed', 'Cancelled'];

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatCurrency = (value) => `₱${Number(value || 0).toFixed(2)}`;

const getPaymentMethodLabel = (method) => ({
    card: 'Card',
    gcash: 'GCash',
    cod: 'Cash on delivery / pickup'
}[method] || 'Not provided');

const buildOrderReceiptPdf = async (order) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(20).text('Pastry Shop Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Order ID: ${order._id}`);
        doc.text(`Customer: ${order.user?.name || 'Guest'}`);
        doc.text(`Email: ${order.user?.email || 'N/A'}`);
        doc.text(`Status: ${order.orderStatus}`);
        doc.text(`Payment method: ${getPaymentMethodLabel(order.paymentMethod)}`);
        doc.text(`Payment status: ${order.paymentStatus === 'paid' ? 'Paid' : 'Not paid'}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`);
        doc.text(`Fulfillment: ${order.orderType === 'pickup' ? 'Pickup' : 'Delivery'}`);
        if (order.shippingInfo?.phoneNo) {
            doc.text(`Phone: ${order.shippingInfo.phoneNo}`);
        }
        if (order.orderType === 'delivery') {
            const address = [
                order.shippingInfo?.address,
                order.shippingInfo?.city,
                order.shippingInfo?.postalCode,
                order.shippingInfo?.country
            ].filter(Boolean).join(', ');
            if (address) doc.text(`Delivery address: ${address}`);
        }
        if (order.preferredDate) {
            doc.text(`Preferred date and time: ${new Date(order.preferredDate).toLocaleString()}${order.preferredTime ? ` ${order.preferredTime}` : ''}`);
        }
        doc.moveDown();

        doc.fontSize(14).text('Items');
        order.orderItems.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.name} x${item.quantity} - ${formatCurrency(item.subtotal)}`);
            const customizations = item.selectedOptions?.customizations || [];
            if (customizations.length) {
                doc.text(`   Options: ${customizations.map((option) => `${option.name}: ${option.label}`).join(', ')}`);
            }
            if (item.addOns?.length) {
                doc.text(`   Add-ons: ${item.addOns.map(
                    (addOn) => `${addOn.name} x${addOn.quantity} (${formatCurrency(addOn.price)} each)`
                ).join(', ')}`);
            }
            if (item.selectedOptions?.customMessage) {
                doc.text(`   Message / instructions: ${item.selectedOptions.customMessage}`);
            }
        });

        doc.moveDown();
        doc.fontSize(12).text(`Subtotal: ${formatCurrency(order.subtotal)}`);
        doc.text(`Delivery: ${formatCurrency(order.shippingFee)}`);
        doc.text(`Tax: ${formatCurrency(order.taxPrice)}`);
        doc.fontSize(14).text(`Grand Total: ${formatCurrency(order.totalPrice)}`);
        doc.end();
    });
};

const sendOrderStatusEmail = async (order) => {
    if (!order?.user?.email) return false;

    const itemsHtml = order.orderItems.map((item) => `
        <tr>
            <td>
                ${escapeHtml(item.name)}
                ${item.selectedOptions?.customizations?.length ? `<ul>${item.selectedOptions.customizations.map(
                    (option) => `<li>${escapeHtml(option.name)}: ${escapeHtml(option.label)}</li>`
                ).join('')}</ul>` : ''}
                ${item.addOns?.length ? `<ul>${item.addOns.map(
                    (addOn) => `<li>${escapeHtml(addOn.name)} x${escapeHtml(addOn.quantity)} (${formatCurrency(addOn.price)} each)</li>`
                ).join('')}</ul>` : ''}
            </td>
            <td>${escapeHtml(item.quantity)}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.subtotal)}</td>
        </tr>
    `).join('');

    const pdfBuffer = await buildOrderReceiptPdf(order);
    await sendEmail({
        email: order.user.email,
        subject: `Order ${order._id} status updated to ${order.orderStatus}`,
        html: `
            <h2>Your order status has been updated</h2>
            <p>Hello ${escapeHtml(order.user.name || 'Customer')},</p>
            <p>Your order is now marked as <strong>${escapeHtml(order.orderStatus)}</strong>.</p>
            <p><strong>Payment method:</strong> ${escapeHtml(getPaymentMethodLabel(order.paymentMethod))}</p>
            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
            <p><strong>Shipping:</strong> ${formatCurrency(order.shippingFee)}</p>
            <p><strong>Tax:</strong> ${formatCurrency(order.taxPrice)}</p>
            <p><strong>Grand Total:</strong> ${formatCurrency(order.totalPrice)}</p>
            <p>Thank you for shopping with us.</p>
        `,
        attachments: [{
            filename: `receipt-${order._id}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        }]
    });
    return true;
};

exports.newOrder = async (req, res, next) => {
    try {
        const {
            orderItems,
            shippingInfo,
            orderType,
            preferredDate,
            preferredTime,
            paymentMethod
        } = req.body;

        const badRequest = (message) => res.status(400).json({ success: false, message });
        if (!Array.isArray(orderItems) || !orderItems.length || orderItems.length > 50) {
            return badRequest('Add between 1 and 50 items before placing an order.');
        }
        if (orderItems.some((item) => !item || typeof item !== 'object')) {
            return badRequest('One or more order items are invalid.');
        }
        if (!['pickup', 'delivery'].includes(orderType)) {
            return badRequest('Choose pickup or delivery for your order.');
        }
        if (!['card', 'gcash', 'cod'].includes(paymentMethod)) {
            return badRequest('Choose a valid payment method.');
        }
        const scheduledDate = new Date(preferredDate);
        if (!preferredDate || Number.isNaN(scheduledDate.getTime())) {
            return badRequest('Choose a valid preferred date and time.');
        }
        if (scheduledDate.getTime() < Date.now() + MINIMUM_LEAD_TIME_MS) {
            return badRequest('Orders need at least 48 hours advance notice.');
        }
        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(preferredTime || '')) {
            return badRequest('Choose a valid preferred time.');
        }
        if (!shippingInfo || typeof shippingInfo !== 'object' || !String(shippingInfo.phoneNo || '').trim()) {
            return badRequest('Enter a contact number for your order.');
        }
        if (orderType === 'delivery'
            && (!String(shippingInfo.address || '').trim()
                || !String(shippingInfo.city || '').trim()
                || !String(shippingInfo.postalCode || '').trim())) {
            return badRequest('A delivery address, city, and postal code are required.');
        }

        const productIds = [...new Set(orderItems.map((item) => String(item.product || '')))];
        const products = await Product.find({ _id: { $in: productIds } }).populate('addOns');
        const productsById = new Map(products.map((product) => [String(product._id), product]));
        const productQuantities = new Map();
        const normalizedItems = [];
        let subtotal = 0;

        for (const item of orderItems) {
            const product = productsById.get(String(item.product || ''));
            const quantity = Number(item.quantity);
            if (!product || product.isAvailable === false || !Number.isInteger(quantity) || quantity < 1) {
                return badRequest('One or more products are unavailable or have an invalid quantity.');
            }
            productQuantities.set(
                String(product._id),
                (productQuantities.get(String(product._id)) || 0) + quantity
            );

            const selections = item.selectedOptions?.customizations || [];
            if (!Array.isArray(selections)) {
                return badRequest(`Invalid customization for ${product.name}.`);
            }
            const normalizedCustomizations = [];
            const selectedTypes = new Set();
            let customizationPrice = 0;
            for (const selection of selections) {
                const option = product.customizationOptions.find(
                    (candidate) => candidate.type === selection.type
                );
                const value = option?.values?.find((candidate) => candidate.label === selection.label);
                if (!option || !value || selectedTypes.has(option.type)) {
                    return badRequest(`Invalid customization for ${product.name}.`);
                }
                selectedTypes.add(option.type);
                customizationPrice += Number(value.priceAdjustment || 0);
                normalizedCustomizations.push({
                    name: option.name,
                    type: option.type,
                    label: value.label,
                    priceAdjustment: Number(value.priceAdjustment || 0)
                });
            }

            const customMessage = String(item.selectedOptions?.customMessage || '').trim();
            if (customMessage.length > 200) {
                return badRequest('Custom messages and instructions must be 200 characters or fewer.');
            }

            if (!Array.isArray(item.addOns || [])) {
                return badRequest(`Invalid add-on selection for ${product.name}.`);
            }
            const normalizedAddOns = [];
            const availableAddOns = new Map(
                product.addOns
                    .filter((addOn) => addOn && addOn.isActive !== false)
                    .map((addOn) => [String(addOn._id), addOn])
            );
            for (const selectedAddOn of item.addOns || []) {
                if (!selectedAddOn || typeof selectedAddOn !== 'object') {
                    return badRequest(`Invalid add-on selection for ${product.name}.`);
                }
                const addOn = availableAddOns.get(String(selectedAddOn._id || ''));
                const addOnQuantity = Number(selectedAddOn.quantity);
                if (!addOn || !Number.isInteger(addOnQuantity) || addOnQuantity < 1 || addOnQuantity > 99) {
                    return badRequest(`Invalid add-on selection for ${product.name}.`);
                }
                normalizedAddOns.push({
                    name: addOn.name,
                    price: Number(addOn.price),
                    quantity: addOnQuantity
                });
            }

            const addOnsPrice = normalizedAddOns.reduce(
                (total, addOn) => total + addOn.price * addOn.quantity,
                0
            );
            const unitPrice = Number(product.price) + customizationPrice + addOnsPrice;
            const itemSubtotal = Math.round(unitPrice * quantity * 100) / 100;
            subtotal += itemSubtotal;
            normalizedItems.push({
                product: product._id,
                name: product.name,
                image: product.images[0]?.url || '',
                quantity,
                unitPrice: Math.round(unitPrice * 100) / 100,
                subtotal: itemSubtotal,
                addOns: normalizedAddOns,
                selectedOptions: {
                    size: normalizedCustomizations.find((selection) => selection.type === 'size')?.label,
                    flavor: normalizedCustomizations.find((selection) => selection.type === 'flavor')?.label,
                    filling: normalizedCustomizations.find((selection) => selection.type === 'filling')?.label,
                    customMessage,
                    customizations: normalizedCustomizations
                }
            });
        }

        for (const [productId, quantity] of productQuantities) {
            const product = productsById.get(productId);
            if (quantity > product.stock) {
                return badRequest(`${product.name} does not have enough stock for that quantity.`);
            }
        }

        subtotal = Math.round(subtotal * 100) / 100;
        const shippingFee = orderType === 'delivery' && subtotal <= 200 ? 25 : 0;
        const taxPrice = Math.round(subtotal * 0.05 * 100) / 100;
        const totalPrice = Math.round((subtotal + shippingFee + taxPrice) * 100) / 100;
        const normalizedShippingInfo = {
            fullName: req.user.name,
            address: String(shippingInfo.address || '').trim(),
            city: String(shippingInfo.city || '').trim(),
            phoneNo: String(shippingInfo.phoneNo).trim(),
            postalCode: String(shippingInfo.postalCode || '').trim(),
            country: String(shippingInfo.country || 'Philippines').trim()
        };

        const order = await Order.create({
            orderItems: normalizedItems,
            shippingInfo: normalizedShippingInfo,
            subtotal,
            taxPrice,
            shippingFee,
            totalPrice,
            orderType,
            preferredDate: scheduledDate,
            preferredTime,
            paymentMethod,
            paymentInfo: { status: 'pending' },
            paymentStatus: 'pending',
            orderStatus: 'Pending',
            user: req.user._id
        });

        return res.status(201).json({ success: true, order });
    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        return next(error);
    }
};

exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        return res.status(404).json({ success: false, message: 'No order found with this ID.' })
    }
    if ((!order.user || order.user._id.toString() !== req.user._id.toString()) && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'You are not allowed to view this order.' })
    }
    return res.status(200).json({
        success: true,
        order
    })
}

exports.getOrderReceiptPdf = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (!order) {
            return res.status(404).json({ success: false, message: 'No order found with this ID.' });
        }
        if ((!order.user || order.user._id.toString() !== req.user._id.toString()) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'You are not allowed to download this receipt.' });
        }

        const pdf = await buildOrderReceiptPdf(order);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="receipt-${order._id}.pdf"`,
            'Content-Length': pdf.length
        });
        return res.status(200).send(pdf);
    } catch (error) {
        return next(error);
    }
}

exports.allOrders = async (req, res, next) => {
    const orders = await Order.find()
    // console.log(orders)
    let totalAmount = 0;

    orders.forEach(order => {

        totalAmount += order.totalPrice
    })

    res.status(200).json({
        success: true,
        totalAmount,
        orders
    })
}

exports.deleteOrder = async (req, res, next) => {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
        return res.status(400).json({
            message: 'No Order found with this ID',

        })

    }
    return res.status(200).json({
        success: true
    })
}

exports.updateOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
        return res.status(404).json({ success: false, message: 'No order found with this ID.' });
    }
    if (!ORDER_STATUSES.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Choose a valid order status.' });
    }
    if (['Completed', 'Cancelled'].includes(order.orderStatus)) {
        return res.status(400).json({ success: false, message: `A ${order.orderStatus.toLowerCase()} order cannot be changed.` });
    }
    order.orderStatus = req.body.status;
    if (req.body.status === 'Completed') {
        order.deliveredAt = new Date();
    }
    await order.save();
    let emailSent = false;
    let emailWarning;
    if (!order.user?.email) {
        emailWarning = 'The order was updated, but this customer account has no email address.';
        console.error(`Order status email skipped for order ${order._id}: customer email is missing.`);
    } else {
        try {
            emailSent = await sendOrderStatusEmail(order);
        } catch (emailError) {
            emailWarning = 'The order was updated, but the receipt email failed. Check the backend terminal for the SMTP error and restart the backend after changing its .env file.';
            console.error('Order status email failed:', emailError.message);
        }
    }
    return res.status(200).json({
        success: true,
        order,
        emailSent,
        ...(!emailSent && { emailWarning })
    });
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

}

exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" }
            }
        }
    ])
    if (!totalSales) {
        return res.status(404).json({
            message: 'error total sales',
        })
    }
    res.status(200).json({
        success: true,
        totalSales
    })
}

exports.customerSales = async (req, res, next) => {
    const customerSales = await Order.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            },
        },
        // {
        //     $group: {
        //         _id: "$user",
        //         total: { $sum: "$totalPrice" },
        //     }
        // },

        { $unwind: "$userDetails" },
        {
            $group: {
                _id: "$user",
                total: { $sum: "$totalPrice" },
                doc: { "$first": "$$ROOT" },

            }
        },

        {
            $replaceRoot: {
                newRoot: { $mergeObjects: [{ total: '$total' }, '$doc'] },
            },
        },
        // {
        //     $group: {
        //         _id: "$userDetails.name",
        //         total: { $sum: "$totalPrice" }
        //     }
        // },
        {
            $project: {
                _id: 0,
                "userDetails.name": true,
                total: true,
            }
        },
        { $sort: { total: 1 } },

    ])
    console.log(customerSales)
    if (!customerSales) {
        return res.status(404).json({
            message: 'error customer sales',
        })


    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        customerSales
    })

}

exports.salesPerMonth = async (req, res, next) => {
    // select monthname(paidAt) sum(price * quantity)
    // from orders
    // group by month(date_placed), year(date_placed)
    const salesPerMonth = await Order.aggregate([

        {
            $group: {
                // _id: {month: { $month: "$paidAt" } },
                _id: {
                    year: { $year: "$paidAt" },
                    month: { $month: "$paidAt" }
                },
                total: { $sum: "$totalPrice" },
            },
        },

        {
            $addFields: {
                month: {
                    $let: {
                        vars: {
                            monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', ' Sept', 'Oct', 'Nov', 'Dec']
                        },
                        in: {
                            $arrayElemAt: ['$$monthsInString', "$_id.month"]
                        }
                    }
                }
            }
        },
        { $sort: { "_id.month": 1 } },
        {
            $project: {
                _id: 0,
                month: true,
                total: true,
            }
        }

    ])
    if (!salesPerMonth) {
        return res.status(404).json({
            message: 'error sales per month',
        })
    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        salesPerMonth
    })

}