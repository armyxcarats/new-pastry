const Cart = require('../models/cart');
const Product = require('../models/product');

const buildCartKey = (productId, customizations, customMessage) => {
    const options = [
        ...customizations.map(({ type, label }) => [type, label]),
        ['message', customMessage]
    ].sort();
    return `${productId}:${JSON.stringify(options)}`;
};

exports.getCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'stock');
        const items = (cart?.items || []).map((item) => {
            const customizations = item.selectedOptions?.customizations || [];
            const customMessage = item.selectedOptions?.customMessage || '';
            const productId = item.product?._id
                ? item.product._id.toString()
                : String(item.product || '');
            return {
                cartKey: buildCartKey(productId, customizations, customMessage),
                product: productId,
                name: item.name,
                image: item.image || '',
                quantity: item.quantity,
                price: item.unitPrice,
                stock: item.product?.stock || 0,
                addOns: item.addOns.map((addOn) => ({
                    _id: addOn.addOn.toString(),
                    name: addOn.name,
                    price: addOn.price,
                    quantity: addOn.quantity
                })),
                customizations,
                customMessage
            };
        });
        return res.status(200).json({ success: true, items });
    } catch (error) {
        return next(error);
    }
};

exports.saveCart = async (req, res, next) => {
    try {
        const submittedItems = req.body.items;
        if (!Array.isArray(submittedItems) || submittedItems.length > 50) {
            return res.status(400).json({ success: false, message: 'Cart must contain no more than 50 items.' });
        }
        if (!submittedItems.length) {
            await Cart.findOneAndUpdate(
                { user: req.user._id },
                { $set: { items: [], updatedAt: new Date() }, $setOnInsert: { user: req.user._id } },
                { upsert: true, new: true, runValidators: true }
            );
            return res.status(200).json({ success: true, items: [] });
        }

        const productIds = [...new Set(submittedItems.map((item) => String(item.product || '')))];
        const products = await Product.find({ _id: { $in: productIds } }).populate('addOns');
        const productsById = new Map(products.map((product) => [String(product._id), product]));
        const items = [];
        const quantitiesByProduct = new Map();

        for (const submitted of submittedItems) {
            const product = productsById.get(String(submitted.product || ''));
            const quantity = Number(submitted.quantity);
            if (!product || product.isAvailable === false || !Number.isInteger(quantity)
                || quantity < 1 || quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: 'A cart product is unavailable or has an invalid quantity.'
                });
            }
            const productId = String(product._id);
            quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + quantity);

            const selectedTypes = new Set();
            const customizations = [];
            let optionsPrice = 0;
            for (const selection of submitted.customizations || []) {
                const option = product.customizationOptions.find((candidate) => candidate.type === selection.type);
                const value = option?.values?.find((candidate) => candidate.label === selection.label);
                if (!option || !value || selectedTypes.has(option.type)) {
                    return res.status(400).json({ success: false, message: `Invalid product option for ${product.name}.` });
                }
                selectedTypes.add(option.type);
                optionsPrice += Number(value.priceAdjustment || 0);
                customizations.push({
                    name: option.name,
                    type: option.type,
                    label: value.label,
                    priceAdjustment: Number(value.priceAdjustment || 0)
                });
            }

            for (const [productId, requestedQuantity] of quantitiesByProduct) {
                if (requestedQuantity > productsById.get(productId).stock) {
                    return res.status(400).json({
                        success: false,
                        message: `${productsById.get(productId).name} does not have enough stock for those cart quantities.`
                    });
                }
            }

            const customMessage = String(submitted.customMessage || '').trim();
            if (customMessage.length > 200) {
                return res.status(400).json({ success: false, message: 'Cart instructions must be 200 characters or fewer.' });
            }

            if (!Array.isArray(submitted.addOns || [])) {
                return res.status(400).json({ success: false, message: `Invalid add-ons for ${product.name}.` });
            }
            const activeAddOns = new Map(
                product.addOns
                    .filter((addOn) => addOn && addOn.isActive !== false)
                    .map((addOn) => [String(addOn._id), addOn])
            );
            const addOns = [];
            for (const selection of submitted.addOns || []) {
                const addOn = activeAddOns.get(String(selection._id || ''));
                const addOnQuantity = Number(selection.quantity);
                if (!addOn || !Number.isInteger(addOnQuantity) || addOnQuantity < 1 || addOnQuantity > 99) {
                    return res.status(400).json({ success: false, message: `Invalid add-ons for ${product.name}.` });
                }
                addOns.push({
                    addOn: addOn._id,
                    name: addOn.name,
                    price: Number(addOn.price),
                    quantity: addOnQuantity
                });
            }
            const unitPrice = Number(product.price) + optionsPrice;
            const addOnsPrice = addOns.reduce((total, addOn) => total + addOn.price * addOn.quantity, 0);
            items.push({
                product: product._id,
                name: product.name,
                image: product.images[0]?.url || '',
                quantity,
                unitPrice,
                selectedOptions: {
                    size: customizations.find((option) => option.type === 'size')?.label,
                    flavor: customizations.find((option) => option.type === 'flavor')?.label,
                    filling: customizations.find((option) => option.type === 'filling')?.label,
                    customMessage,
                    customizations
                },
                addOns,
                subtotal: (unitPrice + addOnsPrice) * quantity
            });
        }

        const cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items, updatedAt: new Date() }, $setOnInsert: { user: req.user._id } },
            { upsert: true, new: true, runValidators: true }
        );
        return res.status(200).json({ success: true, itemCount: cart.items.length });
    } catch (error) {
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        return next(error);
    }
};
