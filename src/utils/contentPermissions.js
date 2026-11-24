export function canManageContent(user, aporte) {
  const userId = user?.id || user?.uid;
  const ownerId = aporte && typeof aporte === 'object' ? (aporte.uid || aporte.id) : aporte;
  return Boolean(userId && (user.role === 'admin' || (ownerId && String(userId) === String(ownerId))));
}
