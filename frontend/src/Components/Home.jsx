import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import Product from './Product/Product'
// import products from '../products.json'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import MetaData from './Layout/MetaData'
import Loader from './Layout/Loader';
import Pagination from '@mui/material/Pagination';
import axios from 'axios'

import { useDispatch, useSelector } from 'react-redux'
import { getProducts } from '../actions/productActions'

const Home = () => {
    // console.log(products)
    // const [products, setProducts] = useState([])
    const [price, setPrice] = useState([1, 1000]);
    // const [loading, setLoading] = useState(true)
    // const [productsCount, setProductsCount] = useState(0)
    // const [resPerPage, setResPerPage] = useState(0)
    // const [filteredProductsCount, setFilteredProductsCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [activeCategory, setActiveCategory] = useState('All bakes')
    const [ratingFilter, setRatingFilter] = useState('all')
    const [reviewFilter, setReviewFilter] = useState('all')
    let { keyword } = useParams();
    const dispatch = useDispatch();
    const { loading, products, error, productsCount, resPerPage, filteredProductsCount } = useSelector(state => state.products);

    let count = productsCount;

    if (keyword) {
        count = filteredProductsCount
    }



    // const getProducts = async (keyword = '', price, page = 1) => {

    //     let link = `http://localhost:4001/api/v1/products?keyword=${keyword}&price[gte]=${price[0]}&price[lte]=${price[1]}&page=${page}`
    //     // http://localhost:4001/api/v1/products?keyword=''
    //     // http://localhost:4001/api/v1/products?keyword=adid&page=1&price[gte]=100&price[lte]=1000
    //     let res = await axios.get(link)
    //     console.log(res.data.products)
    //     setProducts(res.data.products)
    //     setProductsCount(res.data.productsCount)
    //     setFilteredProductsCount(res.data.filteredProductsCount)
    //     setResPerPage(res.data.resPerPage)
    //     setLoading(false)
    // }

    const handleChange = (event, newValue) => {
        setPrice(newValue);
    };

    const categories = useMemo(() => {
        const uniqueCategories = new Map();
        (products || []).forEach((product) => {
            const category = product.category;
            if (!category?._id || !category?.name || uniqueCategories.has(category._id)) {
                return;
            }
            uniqueCategories.set(category._id, {
                value: category._id,
                label: category.name
            });
        });

        return [{ value: 'All bakes', label: 'All bakes' }, ...Array.from(uniqueCategories.values())];
    }, [products])
    const visibleProducts = (products || []).filter((product) => {
        const matchesCategory = activeCategory === 'All bakes' || product.category?._id === activeCategory
        const matchesRating = ratingFilter === 'all' || Number(product.rating || 0) >= Number(ratingFilter)
        const matchesReviews = reviewFilter === 'all' || Number(product.numOfReviews || 0) >= Number(reviewFilter)
        return matchesCategory && matchesRating && matchesReviews
    })

    function valuetext(price) {
        return `P${price.toString()}`;
    }
    // getProducts()
    // useEffect(() => {
    //     // getProducts(keyword, price, currentPage)
    // }, [keyword, price, currentPage]);
    useEffect(() => {
        dispatch(getProducts(currentPage, keyword, price, activeCategory, ratingFilter, reviewFilter))
    }, [currentPage, keyword, price, activeCategory, ratingFilter, reviewFilter, dispatch]);

    return (
        <>
            <MetaData title={'shop Here'} />
            {loading ? <Loader /> : (
                <main className="bakery-storefront">
                    <section className="bakery-welcome">
                        <div className="bakery-welcome-copy">
                            <p className="bakery-welcome-kicker">CRUMB & CO. · SMALL-BATCH BAKERY</p>
                            <h1>A little joy,<br />fresh from the oven.</h1>
                            <p className="bakery-welcome-description">Cookies, pastries, and sweet little reasons to slow down. Find your new favorite, baked fresh for you.</p>
                            <a className="bakery-welcome-button" href="#products">Browse the bakes <span aria-hidden="true">&rarr;</span></a>
                        </div>
                        <div className="bakery-welcome-photo">
                            <img
                                src={products?.[0]?.images?.[0]?.url || 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=85'}
                                alt="Freshly baked cookies"
                            />
                            <span>Made for your<br />happy place</span>
                        </div>
                    </section>

                    <div className="container container-fluid bakery-catalog">
                        <div className="bakery-catalog-heading">
                            <div>
                                <p className="bakery-welcome-kicker">FROM OUR OVEN TO YOU</p>
                                <h2 id="products_heading">Find your favorite</h2>
                            </div>
                            <span>Freshly baked, always worth sharing.</span>
                        </div>
                        <section id="products" className="container mt-4">
                    {/* <div className="row">
                        {products && products.map(product => (
                            <Product key={product._id} product={product} />
                            // <Product product={product} />


                        ))}
                    </div> */}
                    <nav className="bakery-category-chips" aria-label="Filter products by category">
                        {categories.map((category) => (
                            <button
                                key={category.value}
                                type="button"
                                className={activeCategory === category.value ? 'active' : ''}
                                aria-pressed={activeCategory === category.value}
                                onClick={() => setActiveCategory(category.value)}
                            >
                                {category.label}
                            </button>
                        ))}
                    </nav>
                    {error && <p className="alert alert-danger" role="alert">{error}</p>}
                    <div className="row">
                        {keyword ? (
                            <>
                                <div className="col-6 col-md-3 mt-5 mb-5">
                                    <Box sx={{ width: 150 }}>
                                        <Slider
                                            getAriaLabel={() => 'Price Filter'}
                                            value={price}
                                            onChange={handleChange}
                                            valueLabelDisplay="on"
                                            getAriaValueText={valuetext}
                                            min={1}
                                            max={1000}
                                        />
                                    </Box>
                                    <div className="mt-4">
                                        <label htmlFor="rating-filter" className="d-block mb-2 fw-bold">Rating</label>
                                        <select
                                            id="rating-filter"
                                            className="form-control"
                                            value={ratingFilter}
                                            onChange={(event) => setRatingFilter(event.target.value)}
                                        >
                                            <option value="all">All ratings</option>
                                            <option value="3">3.0+ stars</option>
                                            <option value="4">4.0+ stars</option>
                                            <option value="5">5 stars only</option>
                                        </select>
                                    </div>
                                    <div className="mt-4">
                                        <label htmlFor="review-filter" className="d-block mb-2 fw-bold">Reviews</label>
                                        <select
                                            id="review-filter"
                                            className="form-control"
                                            value={reviewFilter}
                                            onChange={(event) => setReviewFilter(event.target.value)}
                                        >
                                            <option value="all">All products</option>
                                            <option value="10">10+ reviews</option>
                                            <option value="20">20+ reviews</option>
                                            <option value="50">50+ reviews</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-6 col-md-9">
                                    <div className="row">
                                        {visibleProducts.map(product => (
                                            <Product key={product._id} product={product} />
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            visibleProducts.map(product => (
                                <Product key={product._id} product={product} />
                            ))
                        )}

                    </div>
                    {resPerPage < count && (
                        <div className="d-flex justify-content-center mt-5">
                            <Stack spacing={2}>
                                <Pagination
                                    count={Math.ceil(count / resPerPage)}
                                    page={currentPage}
                                    onChange={(event, value) => setCurrentPage(value)}
                                    // onChange={setCurrentPageNo}
                                    color="primary"
                                    variant="outlined"
                                    shape="rounded"
                                    showFirstButton
                                    showLastButton
                                    size="large"
                                    sx={{
                                        backgroundColor: 'white',

                                    }}
                                />
                            </Stack>
                        </div>
                    )}
                        </section>
                    </div>
                </main>
            )}
        </>
    )
}

export default Home