const product = require("../models/product");
class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        // http://localhost:5173?keyword=apple
        const keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        } : {}

        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        const queryCopy = { ...this.queryStr };
        const removeFields = ['keyword', 'page', 'sortBy'];
        removeFields.forEach((field) => delete queryCopy[field]);

        const filters = {};
        const priceFilter = {};

        if (queryCopy.category) {
            filters.category = queryCopy.category;
            delete queryCopy.category;
        }

        if (queryCopy['price[gte]'] || queryCopy['price[lte]']) {
            if (queryCopy['price[gte]']) {
                priceFilter.$gte = Number(queryCopy['price[gte]']);
            }
            if (queryCopy['price[lte]']) {
                priceFilter.$lte = Number(queryCopy['price[lte]']);
            }
            filters.price = priceFilter;
            delete queryCopy['price[gte]'];
            delete queryCopy['price[lte]'];
        }

        if (queryCopy['rating[gte]'] || queryCopy['rating[lte]']) {
            filters.rating = {};
            if (queryCopy['rating[gte]']) {
                filters.rating.$gte = Number(queryCopy['rating[gte]']);
            }
            if (queryCopy['rating[lte]']) {
                filters.rating.$lte = Number(queryCopy['rating[lte]']);
            }
            delete queryCopy['rating[gte]'];
            delete queryCopy['rating[lte]'];
        }

        const reviewKeys = ['numOfReviews[gte]', 'numOfReviews[lte]', 'reviews[gte]', 'reviews[lte]'];
        const reviewFilter = {};
        for (const key of reviewKeys) {
            if (!queryCopy[key]) continue;
            const operator = key.includes('lte') ? '$lte' : '$gte';
            reviewFilter[operator] = Number(queryCopy[key]);
            delete queryCopy[key];
        }

        if (Object.keys(reviewFilter).length) {
            filters.numOfReviews = reviewFilter;
        }

        this.query = this.query.find(filters);
        return this;
    }

    sort() {
        const sortOptions = {
            'price-asc': { price: 1, _id: 1 },
            'price-desc': { price: -1, _id: 1 }
        };
        const sortOrder = sortOptions[this.queryStr.sortBy];
        if (sortOrder) {
            this.query = this.query.sort(sortOrder);
        }
        return this;
    }

    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
}
module.exports = APIFeatures