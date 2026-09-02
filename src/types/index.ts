export type ModuleId =
  | 'dashboard'
  | 'chat'
  | 'sms'
  | 'watu-wangu'
  | 'auto-reply'
  | 'history'
  | 'memory'
  | 'files'
  | 'vision'
  | 'studio'
  | 'gallery'
  | 'voice'
  | 'share'
  | 'notifications'
  | 'account'
  | 'settings'
  | 'usage'
  | 'help';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 or preview url
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  error?: string;
  modelUsed?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isFavorite: boolean;
  tags?: string[];
  summary?: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: 'preference' | 'fact' | 'work' | 'personal' | 'instruction';
  reason: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // text or base64
  uploadedAt: string;
  summary?: string;
  tags?: string[];
}

export type StoredFile = DocumentFile;

export interface FileAnalysisResponse {
  result: string;
  filesAnalyzed?: string[];
  mode: 'summary' | 'qa' | 'extract' | 'compare' | 'action_items';
}

export interface VisionAnalysisItem {
  id: string;
  imageUrl: string;
  name: string;
  analysis: string;
  taskType: 'general' | 'ocr' | 'diagram' | 'describe' | 'detailed_qa';
  timestamp: string;
  userPrompt?: string;
}

export interface StudioImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  style: string;
  mode?: string;
  createdAt: string;
  provider?: string;
  model?: string;
  metadata?: Record<string, any>;
}

export interface SharedItem {
  id: string;
  shareId: string;
  title: string;
  type: string;
  data: any;
  createdAt: string;
  views: number;
}

export interface VoiceMessage {
  id: string;
  speaker: 'user' | 'model' | 'mkuu';
  transcript: string;
  timestamp: string;
  audioUrl?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'system' | 'chat' | 'files' | 'studio' | 'security' | 'usage' | 'sms';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  plan: 'Pro Workspace' | 'Free Starter' | 'Enterprise';
  joinedDate: string;
  twoFactorEnabled: boolean;
  activeSessionsCount: number;
  isOwner: boolean;
  ownerEmail?: string;
  preferredTitle: string; // e.g. "Boss Max", "Max", "Mr. Max", "Sir", custom
  addressingStyle: 'owner_respectful' | 'professional' | 'friendly' | 'neutral' | 'custom';
  customAddressingTitle?: string;
  syncWithMemory?: boolean;
}

export interface UsageMetrics {
  totalTokens: number;
  requestsCount: number;
  averageLatencyMs: number;
  totalRequests: number;
  chatTurns: number;
  visionQueries: number;
  filesProcessed: number;
  studioGenerations: number;
  voiceSeconds: number;
  estimatedTokens: number;
  lastActive: string;
  providerNotice: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  preferredModel?: string;
  streaming: boolean;
  streamSpeed: 'normal' | 'fast' | 'instant';
  temperature: number;
  defaultSystemPrompt: string;
  memoryEnabled: boolean;
  voiceOutput: boolean;
  voicePitch: number;
  voiceRate: number;
  preferredVoice: string;
  soundEffects: boolean;
  notificationsEnabled: boolean;
  autoSaveHistory: boolean;
  searchProviderStub: string;
  imageProviderStub: string;
}

export interface SearchQueryResult {
  query: string;
  enabled: boolean;
  provider: string;
  status: 'placeholder_ready' | 'active' | 'disabled';
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
    sourceDomain: string;
  }>;
  summary?: string;
  message: string;
  timestamp: string;
}

// -------------------------------------------------------------
// SMS & AUTO REPLY INTERFACES
// -------------------------------------------------------------

export type PermissionState = 'granted' | 'required' | 'denied' | 'permanently_denied';

export interface SmsPermissions {
  readSms: PermissionState;
  receiveSms: PermissionState;
  sendSms: PermissionState;
  notifications: PermissionState;
}

export interface SimCard {
  id: string;
  slotIndex: number; // 0 for SIM 1, 1 for SIM 2
  slotLabel: 'SIM 1' | 'SIM 2';
  carrierName: string;
  displayName: string;
  phoneNumber?: string;
  isAvailable: boolean;
  signalStrength?: number; // 1-5
}

export interface SmsMessage {
  id: string;
  threadId: string;
  sender: string; // phone number or name
  senderName?: string;
  recipient: string;
  recipientName?: string;
  content: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  simSlot: 'SIM 1' | 'SIM 2';
  simId: string;
  status: 'received' | 'sent' | 'failed' | 'pending';
  isAutoReply?: boolean;
}

export interface SmsConversation {
  id: string;
  phoneNumber: string;
  contactName?: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  simSlot: 'SIM 1' | 'SIM 2';
  messages: SmsMessage[];
}

export type WatuWanguRelationship = 'Familia' | 'Kazi / Biashara' | 'Marafiki' | 'VIP / Mkuu' | 'Dharura / Emergency' | 'Mengineyo';
export type AutoReplyBehavior = 'ai_custom' | 'custom_template' | 'never_reply' | 'standard';

export interface WatuWanguContact {
  id: string;
  name: string;
  nickname?: string;
  phoneNumber: string;
  relationship: WatuWanguRelationship;
  autoReplyBehavior: AutoReplyBehavior;
  customReplyMessage?: string;
  isPriority: boolean;
  notes?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AutoReplyAudience = 'everyone' | 'selected_contacts' | 'selected_numbers' | 'watu_wangu_only' | 'exclude_watu_wangu';
export type AutoReplyScheduleType = 'always' | 'custom';
export type AutoReplyStyle = 'ai_generated' | 'custom_message' | 'ai_with_instructions';

export interface ScheduleRule {
  days: number[]; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
  description: string;
}

export interface AutoReplySettings {
  enabled: boolean;
  killSwitchActive: boolean; // Emergency Master Kill Switch
  firstTimeConfirmed: boolean;
  selectedSimSlot: 'SIM 1' | 'SIM 2';
  selectedSimId: string;
  audience: AutoReplyAudience;
  selectedContacts: Array<{ name: string; phoneNumber: string }>;
  selectedNumbers: string[];
  excludedNumbers: string[];
  scheduleType: AutoReplyScheduleType;
  schedules: ScheduleRule[];
  replyStyle: AutoReplyStyle;
  customMessage: string;
  aiInstructions: string;
  notificationsEnabled: boolean;
}

export type AutoReplyLogStatus = 'sent' | 'failed' | 'processing' | 'skipped';

export interface AutoReplyLog {
  id: string;
  sender: string;
  senderName?: string;
  incomingMessage: string;
  generatedResponse?: string;
  simSlot: 'SIM 1' | 'SIM 2';
  simCarrier?: string;
  timestamp: string;
  status: AutoReplyLogStatus;
  statusReason?: string;
  latencyMs?: number;
  modelUsed?: string;
  ruleMatched?: string;
}

export interface SmsNotificationSettings {
  enabled: boolean;
  newSms: boolean;
  autoReplySent: boolean;
  autoReplyFailed: boolean;
  permissionWarnings: boolean;
  simUnavailableWarnings: boolean;
}

