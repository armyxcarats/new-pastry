const OPTION_TYPES = ['size', 'flavor', 'filling']

const ProductCustomizationEditor = ({ options, onChange }) => {
    const updateOption = (index, changes) => {
        onChange(options.map((option, optionIndex) => (
            optionIndex === index ? { ...option, ...changes } : option
        )))
    }

    const updateValue = (optionIndex, valueIndex, changes) => {
        onChange(options.map((option, currentOptionIndex) => (
            currentOptionIndex !== optionIndex
                ? option
                : {
                    ...option,
                    values: option.values.map((value, currentValueIndex) => (
                        currentValueIndex === valueIndex ? { ...value, ...changes } : value
                    ))
                }
        )))
    }

    return (
        <section className="mb-4" aria-label="Product customization options">
            <h2 className="h5">Customer options and price adjustments</h2>
            <p className="small text-muted">Set the size, flavor, and filling choices offered for this product.</p>
            {options.map((option, optionIndex) => (
                <fieldset key={`${option.type}-${optionIndex}`} className="border rounded p-3 mb-3">
                    <legend className="h6 w-auto px-2">{option.name || 'Product option'}</legend>
                    <div className="form-row">
                        <div className="form-group col-md-5">
                            <label htmlFor={`option-type-${optionIndex}`}>Option type</label>
                            <select id={`option-type-${optionIndex}`} className="form-control" value={option.type}
                                onChange={(event) => updateOption(optionIndex, {
                                    type: event.target.value,
                                    name: event.target.value.charAt(0).toUpperCase() + event.target.value.slice(1)
                                })}>
                                {OPTION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div className="form-group col-md-5">
                            <label htmlFor={`option-name-${optionIndex}`}>Display name</label>
                            <input id={`option-name-${optionIndex}`} className="form-control" required
                                value={option.name}
                                onChange={(event) => updateOption(optionIndex, { name: event.target.value })} />
                        </div>
                        <div className="col-md-2 d-flex align-items-end mb-3">
                            <button type="button" className="btn btn-outline-danger"
                                onClick={() => onChange(options.filter((_, index) => index !== optionIndex))}>
                                Remove
                            </button>
                        </div>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-sm">
                            <thead><tr><th>Choice</th><th>Price adjustment (₱)</th><th>Action</th></tr></thead>
                            <tbody>
                                {option.values.map((value, valueIndex) => (
                                    <tr key={`${optionIndex}-${valueIndex}`}>
                                        <td>
                                            <input className="form-control" required maxLength="80"
                                                aria-label={`${option.name} choice ${valueIndex + 1}`}
                                                value={value.label}
                                                onChange={(event) => updateValue(optionIndex, valueIndex, { label: event.target.value })} />
                                        </td>
                                        <td>
                                            <input className="form-control" type="number" step="0.01"
                                                aria-label={`${option.name} price adjustment ${valueIndex + 1}`}
                                                value={value.priceAdjustment}
                                                onChange={(event) => updateValue(optionIndex, valueIndex, {
                                                    priceAdjustment: Number(event.target.value)
                                                })} />
                                        </td>
                                        <td>
                                            <button type="button" className="btn btn-sm btn-outline-danger"
                                                disabled={option.values.length <= 1}
                                                onClick={() => updateOption(optionIndex, {
                                                    values: option.values.filter((_, index) => index !== valueIndex)
                                                })}>
                                                Remove choice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-primary"
                        onClick={() => updateOption(optionIndex, {
                            values: [...option.values, { label: '', priceAdjustment: 0 }]
                        })}>
                        Add choice
                    </button>
                </fieldset>
            ))}
            <button type="button" className="btn btn-outline-primary"
                disabled={options.length >= OPTION_TYPES.length}
                onClick={() => {
                    const type = OPTION_TYPES.find((item) => !options.some((option) => option.type === item))
                    if (type) onChange([...options, {
                        name: type.charAt(0).toUpperCase() + type.slice(1),
                        type,
                        values: [{ label: '', priceAdjustment: 0 }]
                    }])
                }}>
                Add product option
            </button>
        </section>
    )
}

export default ProductCustomizationEditor
