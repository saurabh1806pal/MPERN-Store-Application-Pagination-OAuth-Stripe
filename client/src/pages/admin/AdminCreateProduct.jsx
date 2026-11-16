
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";

import { useProducts } from "../../context/ProductContext";

const AdminCreateProduct = () => {
    const navigate = useNavigate();
    const { createProduct, uploadProductImages } = useProducts();

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

    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Clean up image preview URLs
    useEffect(() => {
        return () => {
            images.forEach((image) => URL.revokeObjectURL(image.preview));
        };
    }, [images]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Highlights
    const addHighlight = () => {
        setFormData((prev) => ({
            ...prev,
            highlights: [...prev.highlights, ""],
        }));
    };

    const updateHighlight = (index, value) => {
        const updated = [...formData.highlights];
        updated[index] = value;

        setFormData((prev) => ({
            ...prev,
            highlights: updated,
        }));
    };

    const removeHighlight = (index) => {
        setFormData((prev) => ({
            ...prev,
            highlights: prev.highlights.filter((_, i) => i !== index),
        }));
    };

    // Specifications
    const addSpecification = () => {
        setFormData((prev) => ({
            ...prev,
            specifications: [...prev.specifications, { key: "", value: "" }],
        }));
    };

    const updateSpecification = (index, field, value) => {
        const updated = [...formData.specifications];
        updated[index][field] = value;

        setFormData((prev) => ({
            ...prev,
            specifications: updated,
        }));
    };

    const removeSpecification = (index) => {
        setFormData((prev) => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index),
        }));
    };

    // Image selection
    const handleImageSelection = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        console.log("Selected files:", selectedFiles);
    console.log("Current images:", images.length);

        if (images.length + selectedFiles.length > 5) {
            setError("You can upload a maximum of 5 images.");
            e.target.value = "";
            return;
        }

        const validFiles = selectedFiles.filter((file) => {
            return file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024;
        });

        if (validFiles.length !== selectedFiles.length) {
            setError("Only image files up to 5 MB each are allowed.");
        } else {
            setError("");
        }

        const newImages = validFiles.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setImages((prev) => [...prev, ...newImages]);

        // Allow selecting the same file again
        e.target.value = "";
    };

    const removeImage = (index) => {
        setImages((prev) => {
            const imageToRemove = prev[index];

            URL.revokeObjectURL(imageToRemove.preview);

            return prev.filter((_, i) => i !== index);
        });
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (images.length === 0) {
            setError("Please select at least one product image.");
            return;
        }

        try {
            setLoading(true);

            const specifications = Object.fromEntries(
                formData.specifications
                    .filter((item) => item.key.trim() && item.value.trim())
                    .map((item) => [item.key.trim(), item.value.trim()])
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

            // 1. Create product
            const result = await createProduct(productData);

            const product =
                result.product ??
                result.data?.product ??
                result.data ??
                result;

            const productId = product._id ?? product.id;

            if (!productId) {
                throw new Error(
                    "Product was created, but the server did not return its ID."
                );
            }

            // 2. Upload product images
            await uploadProductImages(
                productId,
                images.map((image) => image.file)
            );

            // 3. Navigate back to product listing
            navigate("/admin/products");
        } catch (err) {
            console.error("Product creation failed:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to create product."
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-black";

    const labelClass = "mb-2 block text-sm font-medium text-gray-700";

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">

            {/* Header */}
            <div className="mx-auto max-w-5xl">
                <button
                    type="button"
                    onClick={() => navigate("/admin/products")}
                    className="mb-5 flex items-center gap-2 text-sm text-gray-500 hover:text-black"
                >
                    <ArrowLeft size={17} />
                    Back to Products
                </button>

                <h1 className="text-2xl font-bold text-gray-900">
                    Create Product
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                    Add a new product to your store.
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
                            <label className={labelClass}>Product Name *</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Enter product name"
                                required
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Price (₹) *</label>
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
                            <label className={labelClass}>Quantity *</label>
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
                            <label className={labelClass}>Category *</label>
                            <input
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="e.g. Electronics, Clothing"
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className={labelClass}>Description *</label>
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
                            <label className={labelClass}>Short Description</label>
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
                            <label className={labelClass}>Detailed Description</label>
                            <textarea
                                name="detailedDescription"
                                value={formData.detailedDescription}
                                onChange={handleChange}
                                className={inputClass}
                                rows="5"
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
                            <label className={labelClass}>Brand Name</label>
                            <input
                                name="brandName"
                                value={formData.brandName}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Enter brand name"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Brand Description</label>
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
                                        updateHighlight(index, e.target.value)
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
                                        updateSpecification(index, "key", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Specification (e.g. Color)"
                                />

                                <input
                                    value={spec.value}
                                    onChange={(e) =>
                                        updateSpecification(index, "value", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Value (e.g. Black)"
                                />

                                <button
                                    type="button"
                                    onClick={() => removeSpecification(index)}
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

                {/* Product Images */}
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-2 text-lg font-semibold">
                        Product Images *
                    </h2>

                    <p className="mb-5 text-sm text-gray-500">
                        Upload up to 5 images. Maximum 5 MB per image.
                    </p>

                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 hover:border-black">
                        <Upload size={28} className="mb-3 text-gray-400" />
                        <span className="text-sm font-medium">
                            Click to select images
                        </span>
                        <span className="mt-1 text-xs text-gray-400">
                            PNG, JPG, WEBP
                        </span>

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelection}
                            className="hidden"
                        />
                    </label>

                    {images.length > 0 && (
                        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                            {images.map((image, index) => (
                                <div key={image.preview} className="relative">
                                    <img
                                        src={image.preview}
                                        alt={`Product preview ${index + 1}`}
                                        className="h-28 w-full rounded-lg border object-cover"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute -right-2 -top-2 rounded-full bg-black p-1 text-white"
                                    >
                                        <X size={14} />
                                    </button>

                                    {index === 0 && (
                                        <span className="mt-1 block text-center text-xs font-medium text-green-600">
                                            Primary Image
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
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
                        disabled={loading}
                        className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Creating Product..." : "Create Product"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCreateProduct;
