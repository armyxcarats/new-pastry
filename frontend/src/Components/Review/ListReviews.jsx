const ListReviews = ({ reviews, currentUserId, onEdit, onDelete }) => {
    return (
        <div className="reviews w-75">

            <h3>Customer reviews</h3>
            <hr />
            {reviews && reviews.map(review => (
                <div key={review._id} className="review-card my-3">
                    <div className="rating-outer">
                        <div className="rating-inner" style={{ width: `${(review.rating / 5) * 100}%` }}></div>
                    </div>
                    <p className="review_user">by {review.user?.name || review.name || 'Customer'}</p>
                    <p className="review_comment">{review.comment}</p>
                    {review.createdAt && (
                        <small className="text-muted">{new Date(review.createdAt).toLocaleDateString()}</small>
                    )}
                    {currentUserId && String(review.user?._id || review.user) === String(currentUserId) && (
                        <div className="product-review-actions">
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => onEdit(review)}>
                                Edit
                            </button>
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => onDelete(review._id)}>
                                Delete
                            </button>
                        </div>
                    )}
                    <hr />
                </div>
            ))}
        </div>
    )

}



export default ListReviews