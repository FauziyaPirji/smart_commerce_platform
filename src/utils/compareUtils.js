// Adds a product to comparison list stored in localStorage
export const addToCompare = (product) => {
  if (!product) return;
  const pId = String(product._id || product.id);

  try {
    const stored = JSON.parse(localStorage.getItem("compare") || "[]");
    const exists = stored.some((item) => String(item._id || item.id) === pId);

    if (exists) {
      alert(`"${product.name}" is already in your comparison list.`);
      return;
    }

    if (stored.length >= 4) {
      alert("You can compare up to 4 products at a time. Please remove one first.");
      return;
    }

    const updated = [...stored, product];
    localStorage.setItem("compare", JSON.stringify(updated));
    window.dispatchEvent(new Event("compareUpdated"));
    alert(`"${product.name}" added to comparison!`);
  } catch (err) {
    console.error("Compare storage error:", err);
  }
};

// Removes a product from comparison list
export const removeFromCompare = (productId) => {
  const pId = String(productId);
  try {
    const stored = JSON.parse(localStorage.getItem("compare") || "[]");
    const updated = stored.filter((item) => String(item._id || item.id) !== pId);
    localStorage.setItem("compare", JSON.stringify(updated));
    window.dispatchEvent(new Event("compareUpdated"));
  } catch (err) {
    console.error("Compare remove error:", err);
  }
};