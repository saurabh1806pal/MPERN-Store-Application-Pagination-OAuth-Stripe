
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Trash2,
    LoaderCircle,
    GripVertical,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { useProducts } from "../../context/ProductContext";

const AdminEditProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const {
        fetchProductById,
        updateProduct,
        reorderProductImages,
    } = useProducts();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        shortDescription: "",
        detailedDescription: "",
        price: "",
        category: "",
        quantity: "",
        brandName: "",
        brandDescription: "",
        highlights: [""],
        specifications: [{ key: "", value: "" }],
    });

    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingImageOrder, setSavingImageOrder] = useState(false);
    const [imageOrderChanged, setImageOrderChanged] = useState(false);
    const [draggedImageIndex, setDraggedImageIndex] = useState(null);
    const [error, setError] = useState("");

    // Fetch existing product
    useEffect(() => {
        let isMounted = true;

        const loadProduct = async () => {
            try {
                setLoading(true);
                setError("");

                const product = await fetchProductById(id);

                if (!isMounted) return;

                const brand =
                    typeof product.brand === "object" &&
                    product.brand !== null
                        ? product.brand
                        : {
                            name: product.brand || "",
                            description: "",
                        };

                const specifications =
                    product.specifications instanceof Map
                        ? Object.fromEntries(product.specifications)
                        : product.specifications || {};

                const specificationArray = Object.entries(
                    specifications
                ).map(([key, value]) => ({
                    key,
                    value: String(value ?? ""),
                }));

                setFormData({
                    name: product.name || "",
                    description: product.description || "",
                    shortDescription: product.shortDescription || "",
                    detailedDescription: product.detailedDescription || "",
                    price: product.price ?? "",
                    category: product.category || "",
                    quantity: product.quantity ?? "",
                    brandName: brand.name || "",
                    brandDescription: brand.description || "",
                    highlights: product.highlights?.length
                        ? product.highlights
                        : [""],
                    specifications: specificationArray.length
                        ? specificationArray
                        : [{ key: "", value: "" }],
                });

                setExistingImages(product.images || []);
                setImageOrderChanged(false);

            } catch (err) {
                console.error("Unable to load product:", err);

                if (isMounted) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load product details."
                    );
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadProduct();

        return () => {
            isMounted = false;
        };
    }, [id, fetchProductById]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Add highlight
    const addHighlight = () => {
        setFormData((prev) => ({
            ...prev,
            highlights: [...prev.highlights, ""],
        }));
    };

    // Update highlight
    const updateHighlight = (index, value) => {
        setFormData((prev) => ({
            ...prev,
            highlights: prev.highlights.map((item, i) =>
                i === index ? value : item
            ),
        }));
    };

    // Remove highlight
    const removeHighlight = (index) => {
        setFormData((prev) => ({
            ...prev,
            highlights: prev.highlights.filter((_, i) => i !== index),
        }));
    };

    // Add specification
    const addSpecification = () => {
        setFormData((prev) => ({
            ...prev,
            specifications: [
                ...prev.specifications,
                { key: "", value: "" },
            ],
        }));
    };

    // Update specification
    const updateSpecification = (index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            specifications: prev.specifications.map((item, i) =>
                i === index
                    ? { ...item, [field]: value }
                    : item
            ),
        }));
    };

    // Remove specification
    const removeSpecification = (index) => {
        setFormData((prev) => ({
            ...prev,
            specifications: prev.specifications.filter(
                (_, i) => i !== index
            ),
        }));
    };

    // Move image to another position
    const moveImage = (fromIndex, toIndex) => {
        if (
            fromIndex === toIndex ||
            toIndex < 0 ||
            toIndex >= existingImages.length
        ) {
            return;
        }

        setExistingImages((prev) => {
            const updatedImages = [...prev];

            const [movedImage] = updatedImages.splice(fromIndex, 1);

            updatedImages.splice(toIndex, 0, movedImage);

            return updatedImages;
        });

        setImageOrderChanged(true);
    };

    // Drag start
    const handleDragStart = (index) => {
        setDraggedImageIndex(index);
    };

    // Drop image
    const handleDrop = (targetIndex) => {
        if (draggedImageIndex === null) return;

        moveImage(draggedImageIndex, targetIndex);
        setDraggedImageIndex(null);
    };

    // Save image order
    const handleSaveImageOrder = async () => {
        try {
            setSavingImageOrder(true);
            setError("");

            const imageOrder = existingImages.map(
                (image) => image._id
            );

            if (imageOrder.some((imageId) => !imageId)) {
                throw new Error(
                    "An image is missing its ID. Cannot save image order."
                );
            }

            const response = await reorderProductImages(
                id,
                imageOrder
            );

            const updatedProduct =
                response.product || response.data?.product;

            if (updatedProduct?.images) {
                setExistingImages(updatedProduct.images);
            } else {
                // Keep the local order and update the primary preview.
                setExistingImages((prev) =>
                    prev.map((image, index) => ({
                        ...image,
                        isPrimary: index === 0,
                    }))
                );
            }

            setImageOrderChanged(false);

        } catch (err) {
            console.error("Image reordering failed:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to save image order."
            );
        } finally {
            setSavingImageOrder(false);
        }
    };

    // Submit updated product information
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setSaving(true);

            const specifications = Object.fromEntries(
                formData.specifications
                    .filter(
                        (item) =>
                            item.key.trim() &&
                            item.value.trim()
                    )
                    .map((item) => [
                        item.key.trim(),
                        item.value.trim(),
                    ])
            );

            const productData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                shortDescription: formData.shortDescription.trim(),
                detailedDescription: formData.detailedDescription.trim(),
                price: Number(formData.price),
                category: formData.category.trim(),
                quantity: Number(formData.quantity),

                brand: formData.brandName.trim()
                    ? {
                        name: formData.brandName.trim(),
                        description: formData.brandDescription.trim(),
                    }
                    : undefined,

                highlights: formData.highlights
                    .map((item) => item.trim())
                    .filter(Boolean),

                specifications,
            };

            await updateProduct(id, productData);

            navigate("/admin/products");

        } catch (err) {
            console.error("Product update failed:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update product."
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-black";

    const labelClass =
        "mb-2 block text-sm font-medium text-gray-700";

    // Loading screen
    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <LoaderCircle
                        className="animate-spin"
                        size={22}
                    />
                    Loading product details...
                </div>
            </div>
        );
    }

    // Product loading error
    if (error && !formData.name) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-12">
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-600">
                    {error}
                </div>

                <button
                    onClick={() => navigate("/admin/products")}
                    className="mt-5 text-sm font-medium text-gray-700 hover:text-black"
                >
                    ← Back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
            <div className="mx-auto max-w-5xl">

                {/* Header */}
                <button
                    type="button"
                    onClick={() => navigate("/admin/products")}
                    className="mb-5 flex items-center gap-2 text-sm text-gray-500 hover:text-black"
                >
                    <ArrowLeft size={17} />
                    Back to Products
                </button>

                <h1 className="text-2xl font-bold text-gray-900">
                    Edit Product
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Update your product information and save your changes.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="mx-auto mt-8 max-w-5xl space-y-7"
            >

                {/* Basic Information */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-5 text-lg font-semibold">
                        Basic Information
                    </h2>

                    <div className="grid gap-5 md:grid-cols-2">

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Product Name *
                            </label>

                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Price (₹) *
                            </label>

                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className={inputClass}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Quantity *
                            </label>

                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                className={inputClass}
                                min="0"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Category *
                            </label>

                            <input
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={inputClass}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Description *
                            </label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={inputClass}
                                rows="3"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Short Description
                            </label>

                            <textarea
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleChange}
                                className={inputClass}
                                rows="2"
                                maxLength="300"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>
                                Detailed Description
                            </label>

                            <textarea
                                name="detailedDescription"
                                value={formData.detailedDescription}
                                onChange={handleChange}
                                className={inputClass}
                                rows="7"
                                placeholder="Separate each description point using $$ENTER$$"
                            />
                        </div>
                    </div>
                </section>

                {/* Brand Information */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-5 text-lg font-semibold">
                        Brand Information
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className={labelClass}>
                                Brand Name
                            </label>

                            <input
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Brand Description
                            </label>

                            <textarea
                                name="brandDescription"
                                value={formData.brandDescription}
                                onChange={handleChange}
                                className={inputClass}
                                rows="3"
                            />
                        </div>
                    </div>
                </section>

                {/* Highlights */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-5 text-lg font-semibold">
                        Product Highlights
                    </h2>

                    <div className="space-y-3">
                        {formData.highlights.map((highlight, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    value={highlight}
                                    onChange={(e) =>
                                        updateHighlight(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                    placeholder={`Highlight ${index + 1}`}
                                />

                                <button
                                    type="button"
                                    onClick={() => removeHighlight(index)}
                                    className="rounded-lg border px-3 text-gray-500 hover:text-red-600"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addHighlight}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600"
                        >
                            <Plus size={16} />
                            Add Highlight
                        </button>
                    </div>
                </section>

                {/* Specifications */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-5 text-lg font-semibold">
                        Product Specifications
                    </h2>

                    <div className="space-y-3">
                        {formData.specifications.map((spec, index) => (
                            <div
                                key={index}
                                className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]"
                            >
                                <input
                                    value={spec.key}
                                    onChange={(e) =>
                                        updateSpecification(
                                            index,
                                            "key",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="Specification (e.g. Color)"
                                />

                                <input
                                    value={spec.value}
                                    onChange={(e) =>
                                        updateSpecification(
                                            index,
                                            "value",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                    placeholder="Value (e.g. Black)"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        removeSpecification(index)
                                    }
                                    className="rounded-lg border px-3 text-gray-500 hover:text-red-600"
                                >
                                    <Trash2 size={17} />
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addSpecification}
                            className="flex items-center gap-2 text-sm font-medium text-blue-600"
                        >
                            <Plus size={16} />
                            Add Specification
                        </button>
                    </div>
                </section>

                {/* Product Images and Reordering */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">

                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Product Images
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Drag images to rearrange them. The first image becomes the primary image.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSaveImageOrder}
                            disabled={
                                !imageOrderChanged ||
                                savingImageOrder
                            }
                            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {savingImageOrder && (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            )}

                            {savingImageOrder
                                ? "Saving Order..."
                                : "Save Image Order"}
                        </button>
                    </div>

                    {existingImages.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">

                            {existingImages.map((image, index) => (
                                <div
                                    key={
                                        image._id ||
                                        image.publicId ||
                                        index
                                    }
                                    draggable
                                    onDragStart={() =>
                                        handleDragStart(index)
                                    }
                                    onDragOver={(e) =>
                                        e.preventDefault()
                                    }
                                    onDrop={() =>
                                        handleDrop(index)
                                    }
                                    onDragEnd={() =>
                                        setDraggedImageIndex(null)
                                    }
                                    className={`group relative cursor-grab rounded-xl border p-2 transition active:cursor-grabbing ${
                                        draggedImageIndex === index
                                            ? "border-blue-500 opacity-40"
                                            : "border-gray-200 hover:border-gray-400"
                                    }`}
                                >
                                    {/* Drag Handle */}
                                    <div className="absolute left-3 top-3 z-10 rounded-md bg-white/90 p-1 text-gray-600 shadow-sm">
                                        <GripVertical size={16} />
                                    </div>

                                    {/* Image */}
                                    <img
                                        src={image.url}
                                        alt={
                                            image.alt ||
                                            `Product ${index + 1}`
                                        }
                                        draggable={false}
                                        className="h-28 w-full rounded-lg bg-gray-50 object-contain p-2"
                                    />

                                    {/* Primary Badge */}
                                    {index === 0 ? (
                                        <span className="mt-2 block rounded-md bg-green-50 px-2 py-1 text-center text-xs font-medium text-green-700">
                                            Primary Image
                                        </span>
                                    ) : (
                                        <span className="mt-2 block text-center text-xs text-gray-500">
                                            Image {index + 1}
                                        </span>
                                    )}

                                    {/* Reorder Controls */}
                                    <div className="mt-2 flex justify-center gap-2">
                                        <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() =>
                                                moveImage(
                                                    index,
                                                    index - 1
                                                )
                                            }
                                            className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                                            title="Move left"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                index ===
                                                existingImages.length - 1
                                            }
                                            onClick={() =>
                                                moveImage(
                                                    index,
                                                    index + 1
                                                )
                                            }
                                            className="rounded-md border p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                                            title="Move right"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">
                            No product images available.
                        </p>
                    )}

                    {imageOrderChanged && (
                        <p className="mt-4 text-sm text-amber-600">
                            You have unsaved image order changes.
                        </p>
                    )}
                </section>

                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3 pb-8">

                    <button
                        type="button"
                        onClick={() => navigate("/admin/products")}
                        className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium hover:bg-gray-100"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving && (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        )}

                        {saving
                            ? "Saving Changes..."
                            : "Save Changes"}
                    </button>

                </div>
            </form>
        </div>
    );
};

export default AdminEditProduct;
