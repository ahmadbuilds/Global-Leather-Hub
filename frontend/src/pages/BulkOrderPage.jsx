import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Calculator, Send, ArrowLeft } from "lucide-react";
import api from "../utils/api";
import { formatCurrency } from '../utils/currency';
import toast from "react-hot-toast";
import { useAuth } from "../context/authContext";

export default function BulkOrderPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?limit=100');
        setProducts(data.data.products);
      } catch (err) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addProduct = (product) => {
    if (selectedProducts.find(p => p._id === product._id)) {
      toast.error('Product already added');
      return;
    }
    setSelectedProducts([...selectedProducts, {
      ...product,
      quantity: product.moq || 1,
      customizations: '',
      notes: ''
    }]);
  };

  const updateProduct = (productId, field, value) => {
    setSelectedProducts(selectedProducts.map(p =>
      p._id === productId ? { ...p, [field]: value } : p
    ));
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      const tier = product.pricingTiers?.find(t =>
        product.quantity >= t.minQuantity &&
        (!t.maxQuantity || product.quantity <= t.maxQuantity)
      );
      const price = tier?.pricePerUnit || product.pricingTiers?.[0]?.pricePerUnit || 0;
      return total + (product.quantity * price);
    }, 0);
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const invalidProducts = selectedProducts.filter(p => p.quantity < (p.moq || 1));
    if (invalidProducts.length > 0) {
      toast.error(`Some products are below minimum order quantity`);
      return;
    }

    setSubmitting(true);
    try {
      const quotationData = {
        products: selectedProducts.map(p => ({
          productId: p._id,
          name: p.name,
          quantity: p.quantity,
          customizations: p.customizations,
          notes: p.notes
        })),
        totalEstimatedValue: calculateTotal(),
        currency: user?.preferredCurrency || 'USD'
      };

      await api.post('/bulk-orders', quotationData);
      toast.success('Bulk order quotation request submitted!');
      setSelectedProducts([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quotation request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas pt-24 pb-16 flex items-center justify-center">
        <div className="text-fog">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-espresso pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="mb-8">
          <Link to="/products" className="btn-ghost mb-6 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </Link>
          <h1 className="text-3xl md:text-4xl mb-4 text-espresso" style={{ fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>
            Bulk Order Quotation
          </h1>
          <p className="text-fog text-lg max-w-2xl">
            Request customized quotes for large orders with special pricing, customizations, and bulk discounts.
            Prices and currency follow your profile preference for international wholesale ordering.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h3 className="text-xl mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Available Products</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div key={product._id} className="border border-border rounded-xl p-4 hover:bg-linen/30 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <span className="badge-tan text-[10px]">MOQ {product.moq}</span>
                    </div>
                    <p className="text-xs text-fog mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        from {formatCurrency(product.pricingTiers?.[0]?.pricePerUnit || 0, user?.preferredCurrency)}
                      </span>
                      <button
                        onClick={() => addProduct(product)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Products */}
            {selectedProducts.length > 0 && (
              <div className="card">
                <h3 className="text-xl mb-4" style={{ fontFamily: '"Playfair Display", serif' }}>Selected Products</h3>
                <div className="space-y-4">
                  {selectedProducts.map((product) => (
                    <div key={product._id} className="border border-border rounded-xl p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium">{product.name}</h4>
                        <button
                          onClick={() => removeProduct(product._id)}
                          className="text-rust hover:text-red-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-xs text-fog uppercase tracking-wide mb-1">Quantity</label>
                          <input
                            type="number"
                            min={product.moq || 1}
                            value={product.quantity}
                            onChange={(e) => updateProduct(product._id, 'quantity', Number(e.target.value))}
                            className="field text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-fog uppercase tracking-wide mb-1">Estimated Price</label>
                          <div className="text-sm font-medium py-2">
                            {formatCurrency(calculateProductPrice(product) * product.quantity, user?.preferredCurrency)}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-fog uppercase tracking-wide mb-1">Customizations</label>
                          <textarea
                            value={product.customizations}
                            onChange={(e) => updateProduct(product._id, 'customizations', e.target.value)}
                            placeholder="e.g. Custom colors, logos, packaging..."
                            className="field text-sm h-16"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-fog uppercase tracking-wide mb-1">Additional Notes</label>
                          <textarea
                            value={product.notes}
                            onChange={(e) => updateProduct(product._id, 'notes', e.target.value)}
                            placeholder="Special requirements or questions..."
                            className="field text-sm h-16"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary & Submit */}
          <div className="space-y-6">
            <div className="card sticky top-24">
              <h3 className="text-xl mb-4 flex items-center gap-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                <Calculator className="w-5 h-5" />
                Quotation Summary
              </h3>

              {selectedProducts.length === 0 ? (
                <p className="text-fog text-sm">Add products to get started</p>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {selectedProducts.map((product) => (
                      <div key={product._id} className="flex justify-between text-sm">
                        <span className="text-fog">{product.name} × {product.quantity}</span>
                        <span>{formatCurrency(calculateProductPrice(product) * product.quantity, user?.preferredCurrency)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rule"></div>

                  <div className="flex justify-between font-medium">
                    <span>Estimated Total ({user?.preferredCurrency || 'USD'})</span>
                    <span className="text-sienna">{formatCurrency(calculateTotal(), user?.preferredCurrency || 'USD')}</span>
                  </div>

                  <p className="text-xs text-fog/70">
                    This is an estimate. Final pricing will be provided in your quotation.
                  </p>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || selectedProducts.length === 0}
                    className="btn-primary w-full justify-center py-3"
                  >
                    {submitting ? 'Submitting...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Quotation
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="card bg-linen/50">
              <h4 className="font-medium mb-2">Bulk Order Benefits</h4>
              <ul className="text-sm text-fog space-y-1">
                <li>• Volume discounts</li>
                <li>• Custom branding options</li>
                <li>• Flexible payment terms</li>
                <li>• Priority shipping</li>
                <li>• Dedicated account manager</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate product price based on quantity tier
function calculateProductPrice(product) {
  const tier = product.pricingTiers?.find(t =>
    product.quantity >= t.minQuantity &&
    (!t.maxQuantity || product.quantity <= t.maxQuantity)
  );
  return tier?.pricePerUnit || product.pricingTiers?.[0]?.pricePerUnit || 0;
}