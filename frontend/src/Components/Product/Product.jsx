import { Link } from 'react-router-dom';

const Product = ({ product }) => {
    const imageUrl = product.images?.[0]?.url
    const canOrder = Number(product.stock) > 0 && product.isAvailable !== false

    return (
        <div className="col-sm-12 col-md-6 col-lg-3 my-3">
            <article className="card bakery-product-card">
                <Link to={`/product/${product._id}`} className="bakery-product-photo">
                    {imageUrl ? (
                        <img
                            className="card-img-top"
                            src={imageUrl}
                            alt={product.name}
                            loading="lazy"
                        />
                    ) : (
                        <div className="card-img-top bakery-product-image-placeholder" aria-hidden="true">
                            Fresh from our oven
                        </div>
                    )}
                    {canOrder ? (
                        <span className="bakery-product-ribbon">Baked with love</span>
                    ) : (
                        <span className="bakery-product-ribbon bakery-product-ribbon-sold-out">
                            {product.isAvailable === false ? 'Unavailable' : 'Sold out'}
                        </span>
                    )}
                </Link>
                <div className="card-body d-flex flex-column">
                    <p className="bakery-product-category">{product.category?.name || 'Bakery favorite'}</p>
                    <h5 className="card-title">
                        <Link to={`/product/${product._id}`}>{product.name}</Link>
                    </h5>
                    <div className="ratings">
                        <div className="rating-outer">
                            <div className="rating-inner" style={{ width: `${((product.rating || 0) / 5) * 100}%` }}></div>
                        </div>
                        <span id="no_of_reviews">{product.numOfReviews || 0} reviews</span>
                    </div>
                    {!canOrder && (
                        <p className="bakery-product-stock-status" role="status">
                            {product.isAvailable === false ? 'Not available to order' : 'Currently out of stock'}
                        </p>
                    )}
                    <p className="card-text bakery-product-price">₱{Number(product.price || 0).toFixed(2)}</p>
                    {canOrder ? (
                        <Link to={`/product/${product._id}`} className="btn btn-block bakery-product-button">
                            Make it yours <span aria-hidden="true">→</span>
                        </Link>
                    ) : (
                        <Link to={`/product/${product._id}`} className="btn btn-block bakery-product-button" aria-disabled="true">
                            View product
                        </Link>
                    )}
                </div>
            </article>
        </div>
    )
}

export default Product