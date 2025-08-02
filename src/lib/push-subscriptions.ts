// In-memory storage for push subscriptions (in production, use a database)
const pushSubscriptions = new Map<string, any>();

export function storePushSubscription(userId: string, subscription: any) {
  pushSubscriptions.set(userId, subscription);
  console.log(`💾 Stored push subscription for user: ${userId}`);
}

export function getPushSubscription(userId: string) {
  return pushSubscriptions.get(userId);
}

export function removePushSubscription(userId: string) {
  pushSubscriptions.delete(userId);
  console.log(`🗑️ Removed push subscription for user: ${userId}`);
} 