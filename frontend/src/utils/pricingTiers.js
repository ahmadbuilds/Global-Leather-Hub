export const normalizePricingTiers = (tiers = []) => {
  if (!Array.isArray(tiers)) return [];

  return tiers
    .map((tier) => ({
      minQuantity: Number(tier.minQuantity),
      maxQuantity:
        tier.maxQuantity === null || tier.maxQuantity === undefined || tier.maxQuantity === ""
          ? null
          : Number(tier.maxQuantity),
      price: Number(tier.price),
    }))
    .filter(
      (tier) =>
        Number.isFinite(tier.minQuantity) &&
        tier.minQuantity >= 1 &&
        Number.isFinite(tier.price) &&
        tier.price > 0
    )
    .sort((a, b) => a.minQuantity - b.minQuantity);
};

export const getActivePricingTier = (tiers, quantity) => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) return null;

  return (
    tiers.find(
      (tier) =>
        qty >= tier.minQuantity && (tier.maxQuantity == null || qty <= tier.maxQuantity)
    ) || null
  );
};

export const getNextPricingTier = (tiers, quantity) => {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) return null;

  return tiers.find((tier) => qty < tier.minQuantity) || null;
};

export const getPriceForQuantity = (product, quantity) => {
  const tiers = normalizePricingTiers(product?.pricingTiers || []);
  if (!tiers.length) return 0;

  const activeTier = getActivePricingTier(tiers, quantity);
  return activeTier?.price ?? tiers[0].price;
};

export const getTierLabel = (tier) => {
  if (!tier) return "";
  return tier.maxQuantity != null
    ? `${tier.minQuantity}-${tier.maxQuantity}`
    : `${tier.minQuantity}+`;
};
