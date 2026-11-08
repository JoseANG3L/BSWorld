const PUBLISHED_STATUSES = new Set(['aceptado', 'published']);

export const getPublishedContentStats = (items) => {
  const publishedItems = items.filter((item) =>
    PUBLISHED_STATUSES.has(item.estado || item.status) &&
    (item.visibilidad === 'publico' || item.visibilidad === 'public') &&
    !item.parent_id
  );

  const byType = publishedItems.reduce((counts, item) => {
    const type = item.tipo || 'otro';
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});

  return { total: publishedItems.length, byType };
};
