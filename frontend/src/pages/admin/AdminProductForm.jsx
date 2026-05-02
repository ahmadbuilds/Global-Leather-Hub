import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

const CATEGORIES = [
  { value: "", label: "Select Category" },
  { value: "leather-jackets", label: "Leather Jackets" },
  { value: "leather-belts", label: "Leather Belts" },
  { value: "leather-wallets", label: "Leather Wallets" },
];

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const EMPTY_TIER = { minQuantity: "", maxQuantity: "", price: "" };
const EMPTY_SPEC = { label: "", value: "" };
const normalizePricingTiers = (tiers = []) =>
  tiers
    .map((t) => ({
      minQuantity: t.minQuantity != null ? String(t.minQuantity) : "",
      maxQuantity: t.maxQuantity != null ? String(t.maxQuantity) : "",
      price:
        t.price_usd != null
          ? String(t.price_usd)
          : t.price != null
            ? String(t.price)
            : "",
    }))
    .sort((a, b) => Number(a.minQuantity || 0) - Number(b.minQuantity || 0));

const parseTierNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const buildTierPayload = (tiers = []) => {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { error: "At least one pricing tier is required." };
  }

  const parsed = tiers.map((tier, index) => ({
    minQuantity: parseTierNumber(tier.minQuantity),
    maxQuantity: parseTierNumber(tier.maxQuantity),
    price: parseTierNumber(tier.price),
    inputIndex: index,
  }));

  for (const tier of parsed) {
    if (!Number.isInteger(tier.minQuantity) || tier.minQuantity < 1) {
      return {
        error: `Tier ${tier.inputIndex + 1}: min quantity must be a positive integer.`,
      };
    }
    if (!Number.isFinite(tier.price) || tier.price <= 0) {
      return {
        error: `Tier ${tier.inputIndex + 1}: price per unit must be greater than 0.`,
      };
    }
    if (tier.maxQuantity !== null) {
      if (!Number.isInteger(tier.maxQuantity)) {
        return {
          error: `Tier ${tier.inputIndex + 1}: max quantity must be an integer.`,
        };
      }
      if (tier.maxQuantity < tier.minQuantity) {
        return {
          error: `Tier ${tier.inputIndex + 1}: max quantity cannot be less than min quantity.`,
        };
      }
    }
  }

  parsed.sort((a, b) => a.minQuantity - b.minQuantity);

  const seen = new Set();
  for (const tier of parsed) {
    if (seen.has(tier.minQuantity)) {
      return {
        error: `Duplicate min quantity ${tier.minQuantity} is not allowed.`,
      };
    }
    seen.add(tier.minQuantity);
  }

  if (parsed[0].minQuantity > 1) {
    parsed.unshift({
      minQuantity: 1,
      maxQuantity: parsed[0].minQuantity - 1,
      price: parsed[0].price,
      inputIndex: -1,
    });
  }

  for (let i = 0; i < parsed.length; i += 1) {
    const tier = parsed[i];
    const nextTier = parsed[i + 1];

    if (tier.maxQuantity === null && nextTier) {
      if (nextTier.minQuantity <= tier.minQuantity) {
        return { error: "Pricing tier ranges cannot overlap." };
      }
      tier.maxQuantity = nextTier.minQuantity - 1;
    }

    if (nextTier) {
      if (tier.maxQuantity === null) {
        return { error: "Unlimited tier must be the last tier." };
      }
      if (tier.maxQuantity >= nextTier.minQuantity) {
        return { error: "Pricing tier ranges cannot overlap." };
      }
      if (tier.maxQuantity + 1 < nextTier.minQuantity) {
        return {
          error: "Pricing tier ranges must be continuous with no gaps.",
        };
      }
    }
  }

  const unlimitedIndex = parsed.findIndex((tier) => tier.maxQuantity === null);
  if (unlimitedIndex !== -1 && unlimitedIndex !== parsed.length - 1) {
    return { error: "Unlimited tier must be the last tier." };
  }
  if (parsed.filter((tier) => tier.maxQuantity === null).length > 1) {
    return { error: "Only one unlimited tier is allowed." };
  }

  return {
    tiers: parsed.map(({ inputIndex, ...tier }) => tier),
  };
};

const normalizeIntegerInput = (value) => {
  if (value === "") return "";
  if (!/^\d+$/.test(value)) return null;
  return value.replace(/^0+(?=\d)/, "");
};

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    moq: "",
    status: "active",
    material: "",
    fit: "",
  });
  const [pricingTiers, setPricingTiers] = useState([{ ...EMPTY_TIER }]);
  const [specifications, setSpecifications] = useState([{ ...EMPTY_SPEC }]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [sizeInput, setSizeInput] = useState("");
  const [availableColors, setAvailableColors] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [highlightInput, setHighlightInput] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setFetching(true);
      const { data } = await api.get(`/admin/products/${id}`);
      const product = data.data.product;
      setFormData({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        moq: String(product.moq || ""),
        status: product.status || "active",
        material: product.material || "",
        fit: product.fit || "",
      });
      const normalizedTiers = normalizePricingTiers(product.pricingTiers || []);
      setPricingTiers(
        normalizedTiers.length > 0 ? normalizedTiers : [{ ...EMPTY_TIER }],
      );
      setSpecifications(
        product.specifications?.length > 0
          ? product.specifications.map((s) => ({
              label: s.label,
              value: s.value,
            }))
          : [{ ...EMPTY_SPEC }],
      );
      setAvailableSizes(product.availableSizes || []);
      setAvailableColors(product.availableColors || []);
      setHighlights(product.highlights || []);
      setExistingImages(product.images || []);
    } catch (err) {
      toast.error("Failed to load product.");
      navigate("/admin/products");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "moq") {
      const normalized = normalizeIntegerInput(value);
      if (normalized === null) return;
      setFormData((prev) => ({ ...prev, [name]: normalized }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // ── Pricing Tiers ──
  const handleTierChange = (index, field, value) => {
    let nextValue = value;
    if (field === "minQuantity" || field === "maxQuantity") {
      const normalized = normalizeIntegerInput(value);
      if (normalized === null) return;
      nextValue = normalized;
    }

    setPricingTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: nextValue };

      if (field === "minQuantity" && index > 0) {
        const nextMin = Number(nextValue);
        const prevMax = updated[index - 1].maxQuantity;
        if (
          (prevMax === "" || prevMax === null || prevMax === undefined) &&
          Number.isFinite(nextMin) &&
          nextMin > 1
        ) {
          updated[index - 1] = {
            ...updated[index - 1],
            maxQuantity: String(nextMin - 1),
          };
        }
      }

      return updated;
    });
    if (errors.pricingTiers)
      setErrors((prev) => ({ ...prev, pricingTiers: null }));
  };
  const addTier = () => setPricingTiers((prev) => [...prev, { ...EMPTY_TIER }]);
  const removeTier = (index) => {
    if (pricingTiers.length <= 1) return;
    setPricingTiers((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Specifications ──
  const handleSpecChange = (index, field, value) => {
    setSpecifications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };
  const addSpec = () =>
    setSpecifications((prev) => [...prev, { ...EMPTY_SPEC }]);
  const removeSpec = (index) => {
    if (specifications.length <= 1) return;
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Tag-style inputs (sizes, colors, highlights) ──
  const addTag = (setter, input, setInput, max) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setter((prev) => {
      if (prev.length >= max || prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
    setInput("");
  };
  const removeTag = (setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Images ──
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalImages =
      existingImages.length -
      imagesToRemove.length +
      newImages.length +
      files.length;
    if (totalImages > 5) {
      toast.error("Maximum 5 images allowed per product.");
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const removeNewImage = (index) =>
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  const removeExistingImage = (publicId) =>
    setImagesToRemove((prev) => [...prev, publicId]);
  const restoreExistingImage = (publicId) =>
    setImagesToRemove((prev) => prev.filter((id) => id !== publicId));

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Product name is required.";
    else if (formData.name.trim().length < 3)
      errs.name = "Name must be at least 3 characters.";

    if (!formData.description.trim())
      errs.description = "Description is required.";
    else if (formData.description.trim().length < 10)
      errs.description = "Description must be at least 10 characters.";

    if (!formData.category) errs.category = "Category is required.";

    if (!formData.moq) errs.moq = "MOQ is required.";
    else if (isNaN(formData.moq) || parseInt(formData.moq) < 1)
      errs.moq = "MOQ must be a positive number.";

    const activeExistingImagesCount = existingImages.filter(
      (img) => !imagesToRemove.includes(img.publicId),
    ).length;
    const totalImages = activeExistingImagesCount + newImages.length;
    if (totalImages === 0)
      errs.images = "At least one product image is required.";

    const tierResult = buildTierPayload(pricingTiers);
    if (tierResult.error) {
      errs.pricingTiers = tierResult.error;
    }

    setErrors(errs);
    return {
      valid: Object.keys(errs).length === 0,
      tiersPayload: tierResult.tiers,
    };
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (!validation.valid) return;

    try {
      setLoading(true);

      const formPayload = new FormData();
      formPayload.append("name", formData.name.trim());
      formPayload.append("description", formData.description.trim());
      formPayload.append("category", formData.category);
      formPayload.append("moq", formData.moq);
      formPayload.append("status", formData.status);
      if (formData.material.trim())
        formPayload.append("material", formData.material.trim());
      if (formData.fit.trim()) formPayload.append("fit", formData.fit.trim());

      const tiersPayload = validation.tiersPayload || [];
      formPayload.append("pricingTiers", JSON.stringify(tiersPayload));

      // Clean empty specs
      const validSpecs = specifications.filter(
        (s) => s.label.trim() && s.value.trim(),
      );
      formPayload.append("specifications", JSON.stringify(validSpecs));
      formPayload.append("availableSizes", JSON.stringify(availableSizes));
      formPayload.append("availableColors", JSON.stringify(availableColors));
      formPayload.append("highlights", JSON.stringify(highlights));

      if (isEditing && imagesToRemove.length > 0) {
        formPayload.append("removeImages", JSON.stringify(imagesToRemove));
      }

      for (const file of newImages) {
        formPayload.append("images", file);
      }

      if (isEditing) {
        await api.put(`/admin/products/${id}`, formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated successfully.");
      } else {
        await api.post("/admin/products", formPayload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product created successfully.");
      }

      navigate("/admin/products");
    } catch (err) {
      const message =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Failed to save product.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-tan animate-spin" />
      </div>
    );
  }

  const activeExistingImages = existingImages.filter(
    (img) => !imagesToRemove.includes(img.publicId),
  );
  const totalImageCount = activeExistingImages.length + newImages.length;
  const tierPreview = buildTierPayload(pricingTiers);
  const previewTiers = tierPreview.error ? [] : tierPreview.tiers || [];
  const previewBasePrice = previewTiers[0]?.price || 0;

  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate("/admin/products")}
          className="p-2 rounded-xl hover:bg-linen text-fog hover:text-espresso transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1
            className="text-espresso leading-tight"
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 400,
            }}
          >
            {isEditing ? "Edit Product" : "Add Product"}
          </h1>
          <p className="text-fog text-sm mt-0.5">
            {isEditing
              ? "Update product details and images."
              : "Fill in the details to create a new product."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ═══ Basic Info ═══ */}
        <div className="card space-y-5">
          <h2
            className="text-espresso text-base"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Basic Information
          </h2>

          <div>
            <label className="text-xs font-medium text-espresso tracking-wide block mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`field ${errors.name ? "field-error" : ""}`}
              placeholder="e.g. Premium Biker Leather Jacket"
            />
            {errors.name && (
              <p className="text-rust text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-espresso tracking-wide block mb-1.5">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`field resize-none ${errors.description ? "field-error" : ""}`}
              placeholder="Describe the product materials, features, and specifications..."
            />
            {errors.description && (
              <p className="text-rust text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-espresso tracking-wide block mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`field ${errors.category ? "field-error" : ""}`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-rust text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.category}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-espresso tracking-wide block mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="field"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:w-1/2">
            <label className="text-xs font-medium text-espresso tracking-wide block mb-1.5">
              Minimum Order Quantity (MOQ) *
            </label>
            <input
              type="number"
              name="moq"
              value={formData.moq}
              onChange={handleChange}
              className={`field ${errors.moq ? "field-error" : ""}`}
              placeholder="e.g. 50"
              min="1"
            />
            {errors.moq && (
              <p className="text-rust text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.moq}
              </p>
            )}
          </div>
        </div>

        {/* ═══ Material & Fit ═══ */}
        <div className="card space-y-5">
          <h2
            className="text-espresso text-base"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Material & Fit
          </h2>

          <div>
            <label className="text-xs font-medium text-espresso tracking-wide block mb-1.5">
              Material
            </label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleChange}
              className="field"
              placeholder="e.g. 100% Top-Grain Cowhide Leather (1.2mm thickness)"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-espresso tracking-wide block mb-1.5">
              Fit
            </label>
            <input
              type="text"
              name="fit"
              value={formData.fit}
              onChange={handleChange}
              className="field"
              placeholder="e.g. Standard European/US sizing"
            />
          </div>
        </div>

        {/* ═══ Key Specifications ═══ */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2
              className="text-espresso text-base"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400,
              }}
            >
              Key Specifications
            </h2>
            <button
              type="button"
              onClick={addSpec}
              className="btn-ghost text-xs text-tan"
            >
              <Plus className="w-3.5 h-3.5" /> Add Spec
            </button>
          </div>
          <p className="text-fog text-xs -mt-2">
            Add specification details like outer material, inner lining,
            hardware, pockets, etc.
          </p>

          <div className="space-y-3">
            {specifications.map((spec, i) => (
              <div
                key={i}
                className="flex items-end gap-3 p-4 bg-linen/40 rounded-xl border border-border/40"
              >
                <div className="flex-1">
                  <label className="text-[11px] text-fog block mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={spec.label}
                    onChange={(e) =>
                      handleSpecChange(i, "label", e.target.value)
                    }
                    className="field py-2.5 text-[13px]"
                    placeholder="e.g. Outer Material"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="text-[11px] text-fog block mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) =>
                      handleSpecChange(i, "value", e.target.value)
                    }
                    className="field py-2.5 text-[13px]"
                    placeholder="e.g. 100% Top-Grain Cowhide Leather (1.2mm)"
                  />
                </div>
                {specifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSpec(i)}
                    className="p-2 rounded-lg hover:bg-rust/10 text-fog hover:text-rust transition-colors mb-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Available Sizes ═══ */}
        <div className="card space-y-4">
          <h2
            className="text-espresso text-base"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Available Sizes
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(setAvailableSizes, sizeInput, setSizeInput, 20);
                }
              }}
              className="field flex-1"
              placeholder="Type a size and press Enter (e.g. S, M, L, XL)"
            />
            <button
              type="button"
              onClick={() =>
                addTag(setAvailableSizes, sizeInput, setSizeInput, 20)
              }
              className="btn-outline text-[13px] py-2.5 px-4"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {availableSizes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-linen text-espresso border border-border rounded-full px-3 py-1.5"
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removeTag(setAvailableSizes, i)}
                    className="text-fog hover:text-rust transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Available Colors ═══ */}
        <div className="card space-y-4">
          <h2
            className="text-espresso text-base"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Available Colors
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(setAvailableColors, colorInput, setColorInput, 20);
                }
              }}
              className="field flex-1"
              placeholder="Type a color and press Enter (e.g. Matte Black)"
            />
            <button
              type="button"
              onClick={() =>
                addTag(setAvailableColors, colorInput, setColorInput, 20)
              }
              className="btn-outline text-[13px] py-2.5 px-4"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {availableColors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-tan/10 text-sienna border border-tan/25 rounded-full px-3 py-1.5"
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => removeTag(setAvailableColors, i)}
                    className="text-fog hover:text-rust transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Product Highlights ═══ */}
        <div className="card space-y-4">
          <h2
            className="text-espresso text-base"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}
          >
            Product Highlights
          </h2>
          <p className="text-fog text-xs -mt-2">
            Short selling points, e.g. "Authentic YKK zippers", "Quilted thermal
            lining"
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={highlightInput}
              onChange={(e) => setHighlightInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(setHighlights, highlightInput, setHighlightInput, 10);
                }
              }}
              className="field flex-1"
              placeholder="Type a highlight and press Enter"
            />
            <button
              type="button"
              onClick={() =>
                addTag(setHighlights, highlightInput, setHighlightInput, 10)
              }
              className="btn-outline text-[13px] py-2.5 px-4"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {highlights.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {highlights.map((hl, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-sage/10 text-sage border border-sage/20 rounded-full px-3 py-1.5"
                >
                  {hl}
                  <button
                    type="button"
                    onClick={() => removeTag(setHighlights, i)}
                    className="text-fog hover:text-rust transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Bulk Pricing ═══ */}
        <div className="card space-y-5">
          <div className="flex items-center justify-between">
            <h2
              className="text-espresso text-base"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400,
              }}
            >
              Bulk Pricing Tiers *
            </h2>
            <button
              type="button"
              onClick={addTier}
              className="btn-ghost text-xs text-tan"
            >
              <Plus className="w-3.5 h-3.5" /> Add Tier
            </button>
          </div>
          <p className="text-fog text-xs -mt-2">
            Define quantity breaks for bulk pricing. The lowest tier is shown as
            the starting price.
          </p>

          {errors.pricingTiers && (
            <p className="text-rust text-xs flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.pricingTiers}
            </p>
          )}

          <div className="space-y-3">
            {pricingTiers.map((tier, i) => (
              <div
                key={i}
                className="flex items-end gap-3 p-4 bg-linen/40 rounded-xl border border-border/40"
              >
                <div className="flex-1">
                  <label className="text-[11px] text-fog block mb-1">
                    Min Qty *
                  </label>
                  <input
                    type="number"
                    value={tier.minQuantity}
                    onChange={(e) =>
                      handleTierChange(i, "minQuantity", e.target.value)
                    }
                    className="field py-2.5 text-[13px]"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-fog block mb-1">
                    Max Qty
                  </label>
                  <input
                    type="number"
                    value={tier.maxQuantity}
                    onChange={(e) =>
                      handleTierChange(i, "maxQuantity", e.target.value)
                    }
                    className="field py-2.5 text-[13px]"
                    placeholder="Optional"
                    min="1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] text-fog block mb-1">
                    Price/Unit ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tier.price}
                    onChange={(e) =>
                      handleTierChange(i, "price", e.target.value)
                    }
                    className="field py-2.5 text-[13px]"
                    placeholder="0.00"
                    min="0.01"
                  />
                </div>
                {pricingTiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(i)}
                    className="p-2 rounded-lg hover:bg-rust/10 text-fog hover:text-rust transition-colors mb-0.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!tierPreview.error && previewTiers.length > 0 && (
            <div className="mt-4 border border-border/60 rounded-xl overflow-hidden bg-paper">
              <div className="grid grid-cols-3 px-4 py-2 text-[10px] uppercase tracking-widest text-fog/70 bg-linen/40">
                <span>Range</span>
                <span className="text-right">Price</span>
                <span className="text-right">Savings</span>
              </div>
              {previewTiers.map((tier, idx) => {
                const savings =
                  previewBasePrice > 0
                    ? Math.max(
                        0,
                        Math.round(
                          ((previewBasePrice - tier.price) / previewBasePrice) *
                            100,
                        ),
                      )
                    : 0;
                return (
                  <div
                    key={`preview-${idx}`}
                    className="grid grid-cols-3 px-4 py-2 text-xs border-t border-border/60"
                  >
                    <span className="text-espresso">
                      {tier.maxQuantity != null
                        ? `${tier.minQuantity}-${tier.maxQuantity}`
                        : `${tier.minQuantity}+`}
                    </span>
                    <span className="text-right text-espresso font-medium">
                      ${Number(tier.price).toFixed(2)}
                    </span>
                    <span className="text-right text-sage font-medium">
                      {savings > 0 ? `${savings}%` : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ Images ═══ */}
        <div className="card space-y-5">
          <div>
            <h2
              className="text-espresso text-base"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 400,
              }}
            >
              Images ({totalImageCount}/5) *
            </h2>
            {errors.images && (
              <p className="text-rust text-xs mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.images}
              </p>
            )}
          </div>

          {existingImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {existingImages.map((img) => {
                const isRemoved = imagesToRemove.includes(img.publicId);
                return (
                  <div
                    key={img.publicId}
                    className={`relative rounded-xl overflow-hidden border ${
                      isRemoved ? "border-rust/40 opacity-40" : "border-border"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt="Product"
                      className="w-full h-24 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        isRemoved
                          ? restoreExistingImage(img.publicId)
                          : removeExistingImage(img.publicId)
                      }
                      className={`absolute top-1.5 right-1.5 p-1 rounded-full text-white transition-colors ${
                        isRemoved
                          ? "bg-sage hover:bg-sage/80"
                          : "bg-espresso/60 hover:bg-rust"
                      }`}
                    >
                      {isRemoved ? (
                        <Plus className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {newImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {newImages.map((file, i) => (
                <div
                  key={i}
                  className="relative rounded-xl overflow-hidden border border-tan/40"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New ${i + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-espresso/60 hover:bg-rust text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-tan text-paper px-1.5 py-0.5 rounded-full font-medium">
                    NEW
                  </span>
                </div>
              ))}
            </div>
          )}

          {totalImageCount < 5 && (
            <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-tan hover:bg-linen/20 transition-all duration-300">
              <Upload className="w-5 h-5 text-fog" />
              <span className="text-fog text-sm">
                Click to upload images ({5 - totalImageCount} remaining)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* ═══ Submit ═══ */}
        <div className="flex items-center gap-3 justify-end pb-8">
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="btn-outline text-[13px] py-2.5 px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-[13px] py-2.5 px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{isEditing ? "Update Product" : "Create Product"}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
