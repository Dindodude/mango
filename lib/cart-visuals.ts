const accents = [
  "bg-mango-100 text-mango-700 border-mango-200",
  "bg-leaf-50 text-leaf-700 border-leaf-100",
  "bg-coral-50 text-coral-700 border-coral-100",
  "bg-stone-100 text-stone-700 border-stone-200"
];

function hash(input: string) {
  return [...input].reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function cartItemCode(productId: string, name: string) {
  const prefix = name.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "ITEM";
  return `${prefix}-${productId.slice(0, 4).toUpperCase()}`;
}

export function cartItemAccent(productId: string) {
  return accents[hash(productId) % accents.length];
}
