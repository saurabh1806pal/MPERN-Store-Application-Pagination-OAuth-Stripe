import { useParams } from "react-router-dom";

function ProductDetails() {
    const { id } = useParams();

    return(
        <div className="p-8">
            <h1 className="text-3xl font-bold">
                Product Details for Product ID: {id}
            </h1>
            <p className="mt-2 text-slate-500">
                Here you can find detailed information about the product with ID: {id}.
            </p>
        </div>
    )
}

export default ProductDetails;