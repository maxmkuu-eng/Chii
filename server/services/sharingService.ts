export interface SharedResource {
  shareId: string;
  title: string;
  resourceType: "conversation" | "document_analysis" | "vision_analysis" | "image";
  content: any;
  createdAt: string;
  expiresAt?: string;
  isPublic: boolean;
}

// In-memory sharing store
const sharedStore = new Map<string, SharedResource>();

export function createShareLink(resourceType: SharedResource["resourceType"], title: string, content: any): { shareId: string; shareUrl: string } {
  const shareId = "share_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const resource: SharedResource = {
    shareId,
    title,
    resourceType,
    content,
    createdAt: new Date().toISOString(),
    isPublic: true,
  };
  sharedStore.set(shareId, resource);
  
  return {
    shareId,
    shareUrl: `/share/${shareId}`
  };
}

export function getSharedResource(shareId: string): SharedResource | null {
  return sharedStore.get(shareId) || null;
}
