const parsePricingTiersPayload = (value) => {
  if (value === undefined || value === null) {
    return { tiers: value };
  }

  if (typeof value === 'string') {
    try {
      return { tiers: JSON.parse(value) };
    } catch (error) {
      return { error: 'Pricing tiers must be valid JSON' };
    }
  }

  return { tiers: value };
};

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const normalizePricingTiers = (tiersInput, options = {}) => {
  if (!Array.isArray(tiersInput) || tiersInput.length === 0) {
    return { error: 'At least one pricing tier is required' };
  }

  const tiers = tiersInput.map((tier, index) => ({
    minQuantity: toNumberOrNull(tier.minQuantity),
    maxQuantity: toNumberOrNull(tier.maxQuantity),
    price_usd: toNumberOrNull(tier.price_usd ?? tier.price),
    inputIndex: index,
  }));

  for (const tier of tiers) {
    if (!Number.isInteger(tier.minQuantity) || tier.minQuantity < 1) {
      return { error: `Tier ${tier.inputIndex + 1}: minQuantity must be a positive integer` };
    }
    if (!Number.isFinite(tier.price_usd) || tier.price_usd <= 0) {
      return { error: `Tier ${tier.inputIndex + 1}: price_usd must be greater than 0` };
    }
    if (tier.maxQuantity !== null) {
      if (!Number.isInteger(tier.maxQuantity)) {
        return { error: `Tier ${tier.inputIndex + 1}: maxQuantity must be an integer` };
      }
      if (tier.maxQuantity < tier.minQuantity) {
        return { error: `Tier ${tier.inputIndex + 1}: maxQuantity cannot be less than minQuantity` };
      }
    }
  }

  tiers.sort((a, b) => a.minQuantity - b.minQuantity);

  const seen = new Set();
  for (const tier of tiers) {
    if (seen.has(tier.minQuantity)) {
      return { error: `Duplicate minQuantity ${tier.minQuantity} is not allowed` };
    }
    seen.add(tier.minQuantity);
  }

  if (tiers[0].minQuantity > 1) {
    const firstMin = tiers[0].minQuantity;
    const basePrice = Number(options.basePrice);
    const fallbackPrice = Number.isFinite(basePrice) && basePrice > 0
      ? basePrice
      : tiers[0].price_usd;
    tiers.unshift({
      minQuantity: 1,
      maxQuantity: firstMin - 1,
      price_usd: fallbackPrice,
      inputIndex: -1,
    });
  }

  for (let i = 0; i < tiers.length; i += 1) {
    const tier = tiers[i];
    const nextTier = tiers[i + 1];

    if (tier.maxQuantity === null && nextTier) {
      if (nextTier.minQuantity <= tier.minQuantity) {
        return { error: 'Pricing tier ranges cannot overlap' };
      }
      tier.maxQuantity = nextTier.minQuantity - 1;
    }

    if (nextTier) {
      if (tier.maxQuantity === null) {
        return { error: 'Unlimited tier must be the last tier' };
      }
      if (tier.maxQuantity >= nextTier.minQuantity) {
        return { error: 'Pricing tier ranges cannot overlap' };
      }
      if (tier.maxQuantity + 1 < nextTier.minQuantity) {
        return { error: 'Pricing tier ranges must be continuous with no gaps' };
      }
    }
  }

  const unlimitedIndex = tiers.findIndex((tier) => tier.maxQuantity === null);
  if (unlimitedIndex !== -1 && unlimitedIndex !== tiers.length - 1) {
    return { error: 'Unlimited tier must be the last tier' };
  }
  if (tiers.filter((tier) => tier.maxQuantity === null).length > 1) {
    return { error: 'Only one unlimited tier is allowed' };
  }

  return {
    tiers: tiers.map(({ inputIndex, ...tier }) => tier),
  };
};

const getPriceForQuantity = (product, quantity) => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) return 0;

  const tiers = Array.isArray(product?.pricingTiers) ? product.pricingTiers : [];
  if (!tiers.length) return 0;

  const tier = tiers.find(
    (t) => qty >= t.minQuantity && (t.maxQuantity == null || qty <= t.maxQuantity)
  );

  const basePrice = Number(product?.basePrice);
  const fallbackPrice = Number.isFinite(basePrice) && basePrice > 0
    ? basePrice
    : Number(tiers[0]?.price_usd) || 0;

  return tier?.price_usd || fallbackPrice;
};

module.exports = {
  parsePricingTiersPayload,
  normalizePricingTiers,
  getPriceForQuantity,
};
