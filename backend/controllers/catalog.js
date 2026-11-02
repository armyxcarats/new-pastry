const Category = require('../models/category');
const AddOn = require('../models/addon');

const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const badRequest = (res, message) => res.status(400).json({ success: false, message });

exports.getCatalogManagement = async (req, res, next) => {
    try {
        const [categories, addOns] = await Promise.all([
            Category.find().populate('parentCategory', 'name').sort({ name: 1 }),
            AddOn.find().sort({ name: 1 })
        ]);
        return res.status(200).json({ success: true, categories, addOns });
    } catch (error) {
        return next(error);
    }
};

exports.createCategory = async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        if (!name || name.length > 50) return badRequest(res, 'Category name is required and must be at most 50 characters.');
        const parentCategory = req.body.parentCategory || null;
        if (parentCategory) {
            const parent = await Category.findById(parentCategory);
            if (!parent || parent.parentCategory) {
                return badRequest(res, 'A subcategory must belong to an existing top-level category.');
            }
        }
        const category = await Category.create({
            name,
            slug: slugify(name),
            description: String(req.body.description || '').trim(),
            parentCategory
        });
        return res.status(201).json({ success: true, category });
    } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000) {
            return badRequest(res, error.code === 11000 ? 'A category with this name already exists.' : error.message);
        }
        return next(error);
    }
};

exports.updateCategory = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
        const name = String(req.body.name ?? category.name).trim();
        const parentCategory = req.body.parentCategory === undefined
            ? category.parentCategory
            : req.body.parentCategory || null;
        if (!name || name.length > 50) return badRequest(res, 'Category name is required and must be at most 50 characters.');
        if (parentCategory) {
            if (String(parentCategory) === String(category._id)) return badRequest(res, 'A category cannot be its own parent.');
            const parent = await Category.findById(parentCategory);
            if (!parent || parent.parentCategory) {
                return badRequest(res, 'Subcategories can only belong to top-level categories.');
            }
            const childCategories = await Category.exists({ parentCategory: category._id });
            if (childCategories) return badRequest(res, 'A category with subcategories cannot become a subcategory.');
        }
        category.name = name;
        category.slug = slugify(name);
        category.description = String(req.body.description ?? category.description).trim();
        category.parentCategory = parentCategory;
        if (req.body.isActive !== undefined) category.isActive = req.body.isActive === true || req.body.isActive === 'true';
        await category.save();
        return res.status(200).json({ success: true, category });
    } catch (error) {
        if (error.name === 'ValidationError' || error.code === 11000) {
            return badRequest(res, error.code === 11000 ? 'A category with this name already exists.' : error.message);
        }
        return next(error);
    }
};

exports.setCategoryActive = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
        category.isActive = req.body.isActive === true || req.body.isActive === 'true';
        await category.save();
        if (!category.parentCategory) {
            await Category.updateMany(
                { parentCategory: category._id },
                { $set: { isActive: category.isActive } }
            );
        }
        return res.status(200).json({ success: true, category });
    } catch (error) {
        return next(error);
    }
};

exports.createAddOn = async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const category = String(req.body.category || '');
        const price = Number(req.body.price);
        if (!name || !['cake', 'pastry', 'cookies', 'drinks', 'party'].includes(category)
            || !Number.isFinite(price) || price < 0) {
            return badRequest(res, 'Enter an add-on name, valid category, and non-negative price.');
        }
        const addOn = await AddOn.create({
            name,
            category,
            description: String(req.body.description || '').trim(),
            price,
            isActive: req.body.isActive !== false
        });
        return res.status(201).json({ success: true, addOn });
    } catch (error) {
        if (error.name === 'ValidationError') return badRequest(res, error.message);
        return next(error);
    }
};

exports.updateAddOn = async (req, res, next) => {
    try {
        const addOn = await AddOn.findById(req.params.id);
        if (!addOn) return res.status(404).json({ success: false, message: 'Add-on not found.' });
        const name = String(req.body.name ?? addOn.name).trim();
        const category = String(req.body.category ?? addOn.category);
        const price = Number(req.body.price ?? addOn.price);
        if (!name || !['cake', 'pastry', 'cookies', 'drinks', 'party'].includes(category)
            || !Number.isFinite(price) || price < 0) {
            return badRequest(res, 'Enter an add-on name, valid category, and non-negative price.');
        }
        addOn.name = name;
        addOn.category = category;
        addOn.price = price;
        addOn.description = String(req.body.description ?? addOn.description).trim();
        if (req.body.isActive !== undefined) addOn.isActive = req.body.isActive === true || req.body.isActive === 'true';
        await addOn.save();
        return res.status(200).json({ success: true, addOn });
    } catch (error) {
        if (error.name === 'ValidationError') return badRequest(res, error.message);
        return next(error);
    }
};

exports.setAddOnActive = async (req, res, next) => {
    try {
        const addOn = await AddOn.findById(req.params.id);
        if (!addOn) return res.status(404).json({ success: false, message: 'Add-on not found.' });
        addOn.isActive = req.body.isActive === true || req.body.isActive === 'true';
        await addOn.save();
        return res.status(200).json({ success: true, addOn });
    } catch (error) {
        return next(error);
    }
};
