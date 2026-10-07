export function filterItems(items, { search = "", tier = "all", keyword = "all" } = {}) {
  const q = search.trim().toLowerCase();

  return items.filter(item => {
    const haystack = `${item.name || ""} ${item.description || ""}`.toLowerCase();
    const searchMatch = !q || haystack.includes(q);
    const tierMatch = tier === "all" || String(item.tier) === String(tier);
    const keywords = item.keywords || [];
    const keywordMatch = keyword === "all" || keywords.includes(keyword);
    return searchMatch && tierMatch && keywordMatch;
  });
}
