import { generateContentWithFallback, AI_CONFIG } from "./ai.js";
import { pushNotification } from "./notificationsService.js";
import { incrementUsage } from "./accountService.js";

export type PermissionState = 'granted' | 'required' | 'denied' | 'permanently_denied';

export interface SmsPermissions {
  readSms: PermissionState;
  receiveSms: PermissionState;
  sendSms: PermissionState;
  notifications: PermissionState;
}

export interface SimCard {
  id: string;
  slotIndex: number;
  slotLabel: 'SIM 1' | 'SIM 2';
  carrierName: string;
  displayName: string;
  phoneNumber?: string;
  isAvailable: boolean;
  signalStrength?: number;
}

export interface SmsMessage {
  id: string;
  threadId: string;
  sender: string;
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

export interface WatuWanguContact {
  id: string;
  name: string;
  nickname?: string;
  phoneNumber: string;
  relationship: 'Familia' | 'Kazi / Biashara' | 'Marafiki' | 'VIP / Mkuu' | 'Dharura / Emergency' | 'Mengineyo';
  autoReplyBehavior: 'ai_custom' | 'custom_template' | 'never_reply' | 'standard';
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
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
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

// -------------------------------------------------------------
// IN-MEMORY DATA STORE WITH PERSISTENT DEFAULTS
// -------------------------------------------------------------

let simCards: SimCard[] = [
  {
    id: 'sim_1',
    slotIndex: 0,
    slotLabel: 'SIM 1',
    carrierName: 'Vodacom TZ',
    displayName: 'SIM 1 — Vodacom TZ',
    phoneNumber: '+255 754 200 110',
    isAvailable: true,
    signalStrength: 5,
  },
  {
    id: 'sim_2',
    slotIndex: 1,
    slotLabel: 'SIM 2',
    carrierName: 'Airtel TZ',
    displayName: 'SIM 2 — Airtel TZ',
    phoneNumber: '+255 788 340 890',
    isAvailable: true,
    signalStrength: 4,
  },
];

let permissions: SmsPermissions = {
  readSms: 'granted',
  receiveSms: 'granted',
  sendSms: 'granted',
  notifications: 'granted',
};

let autoReplySettings: AutoReplySettings = {
  enabled: false,
  killSwitchActive: false,
  firstTimeConfirmed: false,
  selectedSimSlot: 'SIM 1',
  selectedSimId: 'sim_1',
  audience: 'everyone',
  selectedContacts: [
    { name: 'Alex Johnson', phoneNumber: '+255 754 888 111' },
    { name: 'Dr. Miller (Clinic)', phoneNumber: '+255 765 222 333' },
    { name: 'Sarah M. (Operations)', phoneNumber: '+255 712 456 789' },
  ],
  selectedNumbers: ['+255 754 888 111', '+255 765 222 333'],
  excludedNumbers: ['100', '1500', 'VODACOM', 'AIRTEL_PROMO', '+255 700 000 000'],
  scheduleType: 'always',
  schedules: [
    {
      days: [1, 2, 3, 4, 5],
      startHour: 18,
      startMinute: 0,
      endHour: 7,
      endMinute: 0,
      description: 'Mon–Fri 18:00–07:00 (After Hours)',
    },
    {
      days: [0, 6],
      startHour: 0,
      startMinute: 0,
      endHour: 23,
      endMinute: 59,
      description: 'Sat–Sun All day (Weekend)',
    },
  ],
  replyStyle: 'ai_with_instructions',
  customMessage: "Hi, I'm currently away from my phone. I'll get back to you shortly.",
  aiInstructions: 'Keep replies polite, concise (under 160 characters), and professional. Mention that Max will review their message and follow up soon.',
  notificationsEnabled: true,
};

let watuWanguList: WatuWanguContact[] = [
  {
    id: 'watu_1',
    name: 'Mama (Grace)',
    nickname: 'Mama',
    phoneNumber: '+255 784 111 222',
    relationship: 'Familia',
    autoReplyBehavior: 'ai_custom',
    customReplyMessage: 'Habari Mama! Niko kwenye majukumu kidogo, nitakupigia punde tu nikipata nafasi.',
    isPriority: true,
    notes: 'Mama mzazi. Daima jibu kwa heshima na mapenzi makubwa.',
    avatarColor: 'amber',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'watu_2',
    name: 'Sarah M. (Operations)',
    nickname: 'Sarah Ops',
    phoneNumber: '+255 712 456 789',
    relationship: 'Kazi / Biashara',
    autoReplyBehavior: 'ai_custom',
    isPriority: true,
    notes: 'Meneja wa Operesheni za kampuni. Toa majibu ya haraka ya kikazi.',
    avatarColor: 'blue',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'watu_3',
    name: 'Dr. Miller (Clinic)',
    nickname: 'Daktari',
    phoneNumber: '+255 765 222 333',
    relationship: 'Dharura / Emergency',
    autoReplyBehavior: 'never_reply',
    isPriority: true,
    notes: 'Daktari wa dharura. Usijibu kwa AI, mtumie Max arifa ya haraka!',
    avatarColor: 'rose',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'watu_4',
    name: 'Alex Johnson',
    nickname: 'Alex',
    phoneNumber: '+255 754 888 111',
    relationship: 'VIP / Mkuu',
    autoReplyBehavior: 'ai_custom',
    isPriority: false,
    notes: 'Mwekezaji mkuu na mshirika wa mradi wa kimataifa.',
    avatarColor: 'emerald',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'watu_5',
    name: 'Dennis Kaka',
    nickname: 'Bro Dennis',
    phoneNumber: '+255 767 999 000',
    relationship: 'Marafiki',
    autoReplyBehavior: 'custom_template',
    customReplyMessage: 'Mkuu Dennis! Nipo busy kidogo kwa sasa, nitakuvutia waya baadaye.',
    isPriority: false,
    notes: 'Rafiki wa karibu sana.',
    avatarColor: 'purple',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

let notificationSettings: SmsNotificationSettings = {
  enabled: true,
  newSms: true,
  autoReplySent: true,
  autoReplyFailed: true,
  permissionWarnings: true,
  simUnavailableWarnings: true,
};

const now = Date.now();
const minutesAgo = (mins: number) => new Date(now - mins * 60000).toISOString();

let conversations: SmsConversation[] = [
  {
    id: 'thread_1',
    phoneNumber: '+255 754 888 111',
    contactName: 'Alex Johnson',
    lastMessage: 'Hey Max, did you get a chance to check the project scope document?',
    lastTimestamp: minutesAgo(12),
    unreadCount: 1,
    simSlot: 'SIM 1',
    messages: [
      {
        id: 'msg_1_1',
        threadId: 'thread_1',
        sender: '+255 754 888 111',
        senderName: 'Alex Johnson',
        recipient: '+255 754 200 110',
        content: 'Good morning! Quick question regarding the sprint milestone.',
        timestamp: minutesAgo(60),
        direction: 'incoming',
        simSlot: 'SIM 1',
        simId: 'sim_1',
        status: 'received',
      },
      {
        id: 'msg_1_2',
        threadId: 'thread_1',
        sender: '+255 754 200 110',
        recipient: '+255 754 888 111',
        content: 'Morning Alex. Sure, send over the link and I will take a look.',
        timestamp: minutesAgo(45),
        direction: 'outgoing',
        simSlot: 'SIM 1',
        simId: 'sim_1',
        status: 'sent',
      },
      {
        id: 'msg_1_3',
        threadId: 'thread_1',
        sender: '+255 754 888 111',
        senderName: 'Alex Johnson',
        recipient: '+255 754 200 110',
        content: 'Hey Max, did you get a chance to check the project scope document?',
        timestamp: minutesAgo(12),
        direction: 'incoming',
        simSlot: 'SIM 1',
        simId: 'sim_1',
        status: 'received',
      },
    ],
  },
  {
    id: 'thread_2',
    phoneNumber: '+255 765 222 333',
    contactName: 'Dr. Miller (Clinic)',
    lastMessage: 'Your appointment is confirmed for Thursday at 10:30 AM.',
    lastTimestamp: minutesAgo(180),
    unreadCount: 0,
    simSlot: 'SIM 1',
    messages: [
      {
        id: 'msg_2_1',
        threadId: 'thread_2',
        sender: '+255 765 222 333',
        senderName: 'Dr. Miller (Clinic)',
        recipient: '+255 754 200 110',
        content: 'Your appointment is confirmed for Thursday at 10:30 AM.',
        timestamp: minutesAgo(180),
        direction: 'incoming',
        simSlot: 'SIM 1',
        simId: 'sim_1',
        status: 'received',
      },
    ],
  },
  {
    id: 'thread_3',
    phoneNumber: '+255 712 456 789',
    contactName: 'Sarah M. (Operations)',
    lastMessage: 'Confirmed. We will launch the staging deployment this evening.',
    lastTimestamp: minutesAgo(320),
    unreadCount: 0,
    simSlot: 'SIM 2',
    messages: [
      {
        id: 'msg_3_1',
        threadId: 'thread_3',
        sender: '+255 712 456 789',
        senderName: 'Sarah M. (Operations)',
        recipient: '+255 788 340 890',
        content: 'Hi Max, are we still deploying staging tonight at 8 PM?',
        timestamp: minutesAgo(340),
        direction: 'incoming',
        simSlot: 'SIM 2',
        simId: 'sim_2',
        status: 'received',
      },
      {
        id: 'msg_3_2',
        threadId: 'thread_3',
        sender: '+255 788 340 890',
        recipient: '+255 712 456 789',
        content: 'Yes Sarah, everything tested green on staging build.',
        timestamp: minutesAgo(330),
        direction: 'outgoing',
        simSlot: 'SIM 2',
        simId: 'sim_2',
        status: 'sent',
      },
      {
        id: 'msg_3_3',
        threadId: 'thread_3',
        sender: '+255 712 456 789',
        senderName: 'Sarah M. (Operations)',
        recipient: '+255 788 340 890',
        content: 'Confirmed. We will launch the staging deployment this evening.',
        timestamp: minutesAgo(320),
        direction: 'incoming',
        simSlot: 'SIM 2',
        simId: 'sim_2',
        status: 'received',
      },
    ],
  },
];

let autoReplyLogs: AutoReplyLog[] = [
  {
    id: 'log_init_1',
    sender: '+255 754 888 111',
    senderName: 'Alex Johnson',
    incomingMessage: 'Hey Max, are you free for a 5 min sync?',
    generatedResponse: "Hi Alex! Max is currently in a meeting. He'll check your note and get back to you shortly.",
    simSlot: 'SIM 1',
    simCarrier: 'Vodacom TZ',
    timestamp: minutesAgo(50),
    status: 'sent',
    latencyMs: 820,
    modelUsed: 'gemini-3.7-flash',
    ruleMatched: 'Audience: Everyone | Schedule: Always',
  },
  {
    id: 'log_init_2',
    sender: '1500',
    senderName: 'Vodacom Promos',
    incomingMessage: 'Top up now to receive 50% extra bonus data!',
    simSlot: 'SIM 1',
    simCarrier: 'Vodacom TZ',
    timestamp: minutesAgo(120),
    status: 'skipped',
    statusReason: 'Sender matches excluded number list (1500)',
    ruleMatched: 'Excluded Sender List',
  },
];

// -------------------------------------------------------------
// SERVICE METHODS
// -------------------------------------------------------------

export function getSimCards(): SimCard[] {
  return simCards;
}

export function updateSimCards(updates: Partial<SimCard>[]): SimCard[] {
  simCards = simCards.map((sim, index) => {
    const update = updates.find(u => u.id === sim.id || u.slotIndex === index);
    return update ? { ...sim, ...update } : sim;
  });
  return simCards;
}

export function getSmsPermissions(): SmsPermissions {
  return permissions;
}

export function updateSmsPermissions(updates: Partial<SmsPermissions>): SmsPermissions {
  permissions = { ...permissions, ...updates };
  return permissions;
}

export function getAutoReplySettings(): AutoReplySettings {
  return autoReplySettings;
}

export function updateAutoReplySettings(updates: Partial<AutoReplySettings>): AutoReplySettings {
  autoReplySettings = { ...autoReplySettings, ...updates };
  return autoReplySettings;
}

export function getSmsNotificationSettings(): SmsNotificationSettings {
  return notificationSettings;
}

export function updateSmsNotificationSettings(updates: Partial<SmsNotificationSettings>): SmsNotificationSettings {
  notificationSettings = { ...notificationSettings, ...updates };
  return notificationSettings;
}

export function toggleEmergencyKillSwitch(forcedState?: boolean): { killSwitchActive: boolean; enabled: boolean } {
  const nextState = typeof forcedState === 'boolean' ? forcedState : !autoReplySettings.killSwitchActive;
  autoReplySettings.killSwitchActive = nextState;
  
  if (nextState) {
    // If kill switch is activated, disable the active auto-reply engine immediately
    autoReplySettings.enabled = false;
    pushNotification({
      title: '🚨 KILL SWITCH IMEWASHA',
      message: 'MKUU SMS & Auto Reply imesimamishwa kabisa kwa dharura. Hakuna jibu lolote litakalotumwa.',
      type: 'error',
      category: 'security',
    });
  } else {
    pushNotification({
      title: 'Kill Switch Imezimwa',
      message: 'Mfumo wa SMS & Auto Reply umerudishwa katika hali ya kawaida.',
      type: 'info',
      category: 'system',
    });
  }
  
  return {
    killSwitchActive: autoReplySettings.killSwitchActive,
    enabled: autoReplySettings.enabled,
  };
}

// -------------------------------------------------------------
// WATU WANGU (VIP & INNER CIRCLE) METHODS
// -------------------------------------------------------------

export function getWatuWangu(): WatuWanguContact[] {
  return [...watuWanguList].sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function addWatuWangu(contact: Omit<WatuWanguContact, 'id' | 'createdAt'>): WatuWanguContact {
  const newContact: WatuWanguContact = {
    ...contact,
    id: `watu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  watuWanguList.unshift(newContact);
  return newContact;
}

export function updateWatuWangu(id: string, updates: Partial<WatuWanguContact>): WatuWanguContact | null {
  const index = watuWanguList.findIndex(c => c.id === id);
  if (index === -1) return null;
  watuWanguList[index] = {
    ...watuWanguList[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return watuWanguList[index];
}

export function deleteWatuWangu(id: string): boolean {
  const initialLen = watuWanguList.length;
  watuWanguList = watuWanguList.filter(c => c.id !== id);
  return watuWanguList.length < initialLen;
}

export function findWatuWanguByNumber(phoneOrSender: string): WatuWanguContact | undefined {
  const clean = phoneOrSender.replace(/\D/g, '');
  if (!clean) return undefined;
  return watuWanguList.find(c => {
    const contactClean = c.phoneNumber.replace(/\D/g, '');
    return contactClean.includes(clean) || clean.includes(contactClean);
  });
}

// -------------------------------------------------------------
// INBOX & THREAD MANAGEMENT (DELETE / BATCH DELETE / CLEAR)
// -------------------------------------------------------------

export function getSmsConversations(): SmsConversation[] {
  return conversations.sort(
    (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
  );
}

export function getSmsConversation(threadId: string): SmsConversation | null {
  return conversations.find(c => c.id === threadId) || null;
}

export function deleteSmsConversation(threadId: string): boolean {
  const initialLen = conversations.length;
  conversations = conversations.filter(c => c.id !== threadId);
  return conversations.length < initialLen;
}

export function batchDeleteSmsConversations(threadIds: string[]): { deletedCount: number; remainingCount: number } {
  const set = new Set(threadIds);
  const initialLen = conversations.length;
  conversations = conversations.filter(c => !set.has(c.id));
  return {
    deletedCount: initialLen - conversations.length,
    remainingCount: conversations.length,
  };
}

export function clearAllSmsConversations(): boolean {
  conversations = [];
  return true;
}

export function deleteSmsMessage(threadId: string, messageId: string): { success: boolean; thread: SmsConversation | null } {
  const thread = conversations.find(c => c.id === threadId);
  if (!thread) return { success: false, thread: null };

  const initialMsgCount = thread.messages.length;
  thread.messages = thread.messages.filter(m => m.id !== messageId);

  if (thread.messages.length === 0) {
    // Thread is now empty, remove entire thread
    conversations = conversations.filter(c => c.id !== threadId);
    return { success: true, thread: null };
  }

  // Update last message & timestamp
  const lastMsg = thread.messages[thread.messages.length - 1];
  thread.lastMessage = lastMsg.content;
  thread.lastTimestamp = lastMsg.timestamp;

  return { success: true, thread };
}

export function getAutoReplyLogs(): AutoReplyLog[] {
  return autoReplyLogs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function clearAutoReplyLogs(): boolean {
  autoReplyLogs = [];
  return true;
}

// -------------------------------------------------------------
// MANUAL SMS SENDING
// -------------------------------------------------------------

export function sendManualSms(params: {
  recipient: string;
  recipientName?: string;
  content: string;
  simSlot: 'SIM 1' | 'SIM 2';
}): { success: boolean; message: SmsMessage; thread: SmsConversation; error?: string } {
  const { recipient, recipientName, content, simSlot } = params;

  if (!recipient || !content.trim()) {
    throw new Error('Recipient phone number and message content are required.');
  }

  // Verify permission
  if (permissions.sendSms !== 'granted') {
    throw new Error('SEND_SMS permission is not granted. Please allow SMS permissions in settings.');
  }

  // Verify SIM card availability
  const targetSim = simCards.find(s => s.slotLabel === simSlot);
  if (!targetSim || !targetSim.isAvailable) {
    throw new Error(`The selected SIM (${simSlot}) is currently unavailable or disconnected.`);
  }

  // Find or create conversation thread
  let thread = conversations.find(
    c => c.phoneNumber === recipient || c.id === `thread_${recipient.replace(/\D/g, '')}`
  );

  const timestamp = new Date().toISOString();
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const threadId = thread?.id || `thread_${recipient.replace(/\D/g, '') || Date.now()}`;

  const newMsg: SmsMessage = {
    id: msgId,
    threadId,
    sender: targetSim.phoneNumber || targetSim.slotLabel,
    recipient,
    recipientName,
    content: content.trim(),
    timestamp,
    direction: 'outgoing',
    simSlot,
    simId: targetSim.id,
    status: 'sent',
  };

  if (thread) {
    thread.messages.push(newMsg);
    thread.lastMessage = newMsg.content;
    thread.lastTimestamp = timestamp;
    thread.simSlot = simSlot;
  } else {
    thread = {
      id: threadId,
      phoneNumber: recipient,
      contactName: recipientName,
      lastMessage: newMsg.content,
      lastTimestamp: timestamp,
      unreadCount: 0,
      simSlot,
      messages: [newMsg],
    };
    conversations.unshift(thread);
  }

  return { success: true, message: newMsg, thread };
}

// -------------------------------------------------------------
// AUTOMATIC SMS RESPONSE PIPELINE
// -------------------------------------------------------------

function isScheduleActive(settings: AutoReplySettings): boolean {
  if (settings.scheduleType === 'always') return true;

  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return settings.schedules.some(schedule => {
    if (!schedule.days.includes(currentDay)) return false;

    const startMinutes = schedule.startHour * 60 + schedule.startMinute;
    const endMinutes = schedule.endHour * 60 + schedule.endMinute;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Overnight rule (e.g. 18:00 to 07:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  });
}

export async function processIncomingSmsPipeline(params: {
  sender: string;
  senderName?: string;
  content: string;
  simSlot?: 'SIM 1' | 'SIM 2';
}): Promise<{
  savedMessage: SmsMessage;
  autoReplyAttempted: boolean;
  autoReplySent: boolean;
  log?: AutoReplyLog;
  reason?: string;
}> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const incomingSimSlot = params.simSlot || 'SIM 1';
  const incomingSim = simCards.find(s => s.slotLabel === incomingSimSlot) || simCards[0];

  // 1. Ingest incoming SMS to conversation inbox
  let thread = conversations.find(
    c => c.phoneNumber === params.sender || (params.senderName && c.contactName === params.senderName)
  );

  const threadId = thread?.id || `thread_${params.sender.replace(/\D/g, '') || Date.now()}`;
  const incomingMsg: SmsMessage = {
    id: `msg_in_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    threadId,
    sender: params.sender,
    senderName: params.senderName,
    recipient: incomingSim.phoneNumber || incomingSim.slotLabel,
    content: params.content,
    timestamp,
    direction: 'incoming',
    simSlot: incomingSimSlot,
    simId: incomingSim.id,
    status: 'received',
  };

  if (thread) {
    thread.messages.push(incomingMsg);
    thread.lastMessage = incomingMsg.content;
    thread.lastTimestamp = timestamp;
    thread.unreadCount += 1;
    thread.simSlot = incomingSimSlot;
  } else {
    thread = {
      id: threadId,
      phoneNumber: params.sender,
      contactName: params.senderName,
      lastMessage: incomingMsg.content,
      lastTimestamp: timestamp,
      unreadCount: 1,
      simSlot: incomingSimSlot,
      messages: [incomingMsg],
    };
    conversations.unshift(thread);
  }

  // 1.5 CHECK EMERGENCY KILL SWITCH
  if (autoReplySettings.killSwitchActive) {
    const log: AutoReplyLog = {
      id: `log_${Date.now()}`,
      sender: params.sender,
      senderName: params.senderName,
      incomingMessage: params.content,
      simSlot: autoReplySettings.selectedSimSlot,
      timestamp,
      status: 'skipped',
      statusReason: '🚨 EMERGENCY KILL SWITCH ACTIVE: Auto Reply immediately halted by user command.',
      ruleMatched: 'Emergency Kill Switch Override',
    };
    autoReplyLogs.unshift(log);
    return {
      savedMessage: incomingMsg,
      autoReplyAttempted: false,
      autoReplySent: false,
      log,
      reason: 'Kill Switch is Active',
    };
  }

  // 1.8 CHECK WATU WANGU (INNER CIRCLE / VIP) SPECIFIC RULES
  const watuWanguContact = findWatuWanguByNumber(params.sender);
  if (watuWanguContact) {
    // If contact is flagged as priority or has "never_reply" setting
    if (watuWanguContact.autoReplyBehavior === 'never_reply') {
      const log: AutoReplyLog = {
        id: `log_${Date.now()}`,
        sender: params.sender,
        senderName: watuWanguContact.name,
        incomingMessage: params.content,
        simSlot: autoReplySettings.selectedSimSlot,
        timestamp,
        status: 'skipped',
        statusReason: `Watu Wangu Rule: ${watuWanguContact.name} (${watuWanguContact.nickname || watuWanguContact.relationship}) is marked as 'Kamwe Usijibu (Never Auto Reply)'. Direct alert dispatched to Max.`,
        ruleMatched: 'Watu Wangu Direct Alert Policy',
      };
      autoReplyLogs.unshift(log);

      pushNotification({
        title: `⭐ Watu Wangu SMS: ${watuWanguContact.name}`,
        message: `Ujumbe kutoka kwa ${watuWanguContact.nickname || watuWanguContact.name} (${watuWanguContact.relationship}): "${params.content.substring(0, 80)}"`,
        type: 'warning',
        category: 'sms',
      });

      return {
        savedMessage: incomingMsg,
        autoReplyAttempted: false,
        autoReplySent: false,
        log,
        reason: 'Watu Wangu Direct Alert Bypass',
      };
    }
  }

  // 2. CHECK PERMISSIONS
  if (permissions.readSms !== 'granted' || permissions.receiveSms !== 'granted' || permissions.sendSms !== 'granted') {
    const log: AutoReplyLog = {
      id: `log_${Date.now()}`,
      sender: params.sender,
      senderName: params.senderName,
      incomingMessage: params.content,
      simSlot: autoReplySettings.selectedSimSlot,
      timestamp,
      status: 'skipped',
      statusReason: 'SMS permissions not granted (READ, RECEIVE, or SEND denied)',
    };
    autoReplyLogs.unshift(log);

    if (notificationSettings.permissionWarnings) {
      pushNotification({
        title: 'SMS Permission Warning',
        message: 'Incoming SMS received but permissions are missing for Auto Reply.',
        type: 'warning',
        category: 'security',
      });
    }

    return { savedMessage: incomingMsg, autoReplyAttempted: false, autoReplySent: false, log, reason: log.statusReason };
  }

  // 3. CHECK AUTO REPLY MASTER TOGGLE
  if (!autoReplySettings.enabled) {
    const log: AutoReplyLog = {
      id: `log_${Date.now()}`,
      sender: params.sender,
      senderName: params.senderName,
      incomingMessage: params.content,
      simSlot: autoReplySettings.selectedSimSlot,
      timestamp,
      status: 'skipped',
      statusReason: 'Auto Reply is currently disabled (OFF)',
    };
    autoReplyLogs.unshift(log);
    return { savedMessage: incomingMsg, autoReplyAttempted: false, autoReplySent: false, log, reason: 'Auto Reply is OFF' };
  }

  // 4. CHECK SELECTED SIM CARD (DUAL-SIM REQUIREMENT)
  const selectedSim = simCards.find(s => s.slotLabel === autoReplySettings.selectedSimSlot);
  if (!selectedSim || !selectedSim.isAvailable) {
    const reason = `Selected Auto Reply SIM (${autoReplySettings.selectedSimSlot}) is unavailable or disconnected. Will NOT switch SIM automatically.`;
    const log: AutoReplyLog = {
      id: `log_${Date.now()}`,
      sender: params.sender,
      senderName: params.senderName,
      incomingMessage: params.content,
      simSlot: autoReplySettings.selectedSimSlot,
      timestamp,
      status: 'failed',
      statusReason: reason,
    };
    autoReplyLogs.unshift(log);

    if (notificationSettings.simUnavailableWarnings) {
      pushNotification({
        title: 'Auto Reply SIM Unavailable',
        message: `Could not send auto-reply via ${autoReplySettings.selectedSimSlot}. Please select an active SIM.`,
        type: 'error',
        category: 'system',
      });
    }

    return { savedMessage: incomingMsg, autoReplyAttempted: true, autoReplySent: false, log, reason };
  }

  // 5. CHECK AUDIENCE & EXCLUSION RULES
  // Excluded check
  const isExcluded = autoReplySettings.excludedNumbers.some(
    num => params.sender.includes(num) || (params.senderName && params.senderName.toUpperCase().includes(num.toUpperCase()))
  );
  if (isExcluded) {
    const log: AutoReplyLog = {
      id: `log_${Date.now()}`,
      sender: params.sender,
      senderName: params.senderName,
      incomingMessage: params.content,
      simSlot: autoReplySettings.selectedSimSlot,
      simCarrier: selectedSim.carrierName,
      timestamp,
      status: 'skipped',
      statusReason: `Sender (${params.sender}) matches excluded list`,
      ruleMatched: 'Excluded Numbers Rule',
    };
    autoReplyLogs.unshift(log);
    return { savedMessage: incomingMsg, autoReplyAttempted: true, autoReplySent: false, log, reason: log.statusReason };
  }

  // Audience matching
  if (autoReplySettings.audience === 'watu_wangu_only') {
    if (!watuWanguContact) {
      const log: AutoReplyLog = {
        id: `log_${Date.now()}`,
        sender: params.sender,
        senderName: params.senderName,
        incomingMessage: params.content,
        simSlot: autoReplySettings.selectedSimSlot,
        simCarrier: selectedSim.carrierName,
        timestamp,
        status: 'skipped',
        statusReason: 'Audience filter set to "Watu Wangu Tu (VIPs only)", but sender is not in Watu Wangu list.',
        ruleMatched: 'Watu Wangu Only Filter',
      };
      autoReplyLogs.unshift(log);
      return { savedMessage: incomingMsg, autoReplyAttempted: true, autoReplySent: false, log, reason: log.statusReason };
    }
  } else if (autoReplySettings.audience === 'exclude_watu_wangu') {
    if (watuWanguContact) {
      const log: AutoReplyLog = {
        id: `log_${Date.now()}`,
        sender: params.sender,
        senderName: params.senderName,
        incomingMessage: params.content,
        simSlot: autoReplySettings.selectedSimSlot,
        simCarrier: selectedSim.carrierName,
        timestamp,
        status: 'skipped',
        statusReason: 'Audience filter configured to exclude Watu Wangu from automated generic replies.',
        ruleMatched: 'Exclude Watu Wangu Filter',
      };
      autoReplyLogs.unshift(log);
      return { savedMessage: incomingMsg, autoReplyAttempted: true, autoReplySent: false, log, reason: log.statusReason };
    }
  } else if (autoReplySettings.audience === 'selected_contacts' || autoReplySettings.audience === 'selected_numbers') {
    const matchNumber = autoReplySettings.selectedNumbers.some(n => params.sender.replace(/\s+/g, '').includes(n.replace(/\s+/g, '')));
    const matchContact = autoReplySettings.selectedContacts.some(
      c => c.phoneNumber.replace(/\s+/g, '').includes(params.sender.replace(/\s+/g, '')) ||
           (params.senderName && c.name.toLowerCase() === params.senderName.toLowerCase())
    );

    if (!matchNumber && !matchContact) {
      const log: AutoReplyLog = {
        id: `log_${Date.now()}`,
        sender: params.sender,
        senderName: params.senderName,
        incomingMessage: params.content,
        simSlot: autoReplySettings.selectedSimSlot,
        simCarrier: selectedSim.carrierName,
        timestamp,
        status: 'skipped',
        statusReason: 'Sender not included in selected contacts/numbers allow-list',
        ruleMatched: 'Audience Filter',
      };
      autoReplyLogs.unshift(log);
      return { savedMessage: incomingMsg, autoReplyAttempted: true, autoReplySent: false, log, reason: log.statusReason };
    }
  }

  // 6. CHECK SCHEDULE
  if (!isScheduleActive(autoReplySettings)) {
    const log: AutoReplyLog = {
      id: `log_${Date.now()}`,
      sender: params.sender,
      senderName: params.senderName,
      incomingMessage: params.content,
      simSlot: autoReplySettings.selectedSimSlot,
      simCarrier: selectedSim.carrierName,
      timestamp,
      status: 'skipped',
      statusReason: 'Outside configured Auto Reply active schedule window',
      ruleMatched: 'Schedule Filter',
    };
    autoReplyLogs.unshift(log);
    return { savedMessage: incomingMsg, autoReplyAttempted: true, autoReplySent: false, log, reason: log.statusReason };
  }

  // 7. GENERATE RESPONSE (PRIVACY SAFE: ONLY REACHED WHEN ALL FILTERS PASS)
  let generatedReply = '';
  let modelUsed = 'rule-template';

  try {
    if (watuWanguContact?.autoReplyBehavior === 'custom_template' && watuWanguContact.customReplyMessage) {
      generatedReply = watuWanguContact.customReplyMessage;
      modelUsed = 'watu-wangu-custom-template';
    } else if (autoReplySettings.replyStyle === 'custom_message') {
      generatedReply = autoReplySettings.customMessage || "Hi, I'm currently unavailable. I will reply as soon as possible.";
    } else {
      // AI-driven generation with Watu Wangu personalization if applicable
      const relationshipContext = watuWanguContact
        ? `\nSPECIAL CONTEXT: This person is in Max's "Watu Wangu" (VIP Inner Circle).
Name: ${watuWanguContact.name}
Nickname/Salutation: ${watuWanguContact.nickname || 'Rafiki'}
Relationship: ${watuWanguContact.relationship}
Personal Notes: ${watuWanguContact.notes || 'None'}
Please address them warmly and acknowledge their relationship with Max with utmost care and respect.`
        : '';

      const prompt = `You are MKUU AI, an automated SMS auto-responder responding on behalf of Max.
Generate a friendly, professional, and concise SMS reply to the following incoming text message.

Incoming SMS From: ${watuWanguContact?.name || params.senderName || params.sender}
Incoming Message: "${params.content}"
${relationshipContext}

User's Specific Instructions for Auto Reply:
"${autoReplySettings.aiInstructions || 'Keep replies short, polite, and under 160 characters. Acknowledge the message and state that Max will respond soon.'}"

SMS Constraints:
- Keep the response direct, clear, and under 160 characters when possible.
- Do NOT use markdown code blocks or complicated formatting.
- Do NOT include quotes or prefixes like "Auto-reply:".`;

      const { response, modelUsed: usedModel } = await generateContentWithFallback({
        preferredModel: AI_CONFIG.defaultTextModel,
        contents: prompt,
      });

      modelUsed = usedModel;
      generatedReply = response.text?.trim() || "Hi, I received your message and will get back to you shortly.";
      incrementUsage("chat", 120);
    }
  } catch (genError: any) {
    console.error('[MKUU SMS] AI Generation notice, falling back to custom message:', genError?.message || genError);
    generatedReply = autoReplySettings.customMessage || "Hi, I received your message and will respond as soon as I am available.";
    modelUsed = 'fallback-template';
  }

  // 8. SEND OUTGOING AUTO-REPLY SMS
  const outgoingReplyMsg: SmsMessage = {
    id: `msg_auto_${Date.now()}`,
    threadId,
    sender: selectedSim.phoneNumber || selectedSim.slotLabel,
    recipient: params.sender,
    recipientName: params.senderName,
    content: generatedReply,
    timestamp: new Date().toISOString(),
    direction: 'outgoing',
    simSlot: autoReplySettings.selectedSimSlot,
    simId: selectedSim.id,
    status: 'sent',
    isAutoReply: true,
  };

  thread.messages.push(outgoingReplyMsg);
  thread.lastMessage = generatedReply;
  thread.lastTimestamp = outgoingReplyMsg.timestamp;

  const latencyMs = Date.now() - startTime;

  // 9. LOG SUCCESSFUL AUTO REPLY
  const log: AutoReplyLog = {
    id: `log_${Date.now()}`,
    sender: params.sender,
    senderName: params.senderName,
    incomingMessage: params.content,
    generatedResponse: generatedReply,
    simSlot: autoReplySettings.selectedSimSlot,
    simCarrier: selectedSim.carrierName,
    timestamp: outgoingReplyMsg.timestamp,
    status: 'sent',
    latencyMs,
    modelUsed,
    ruleMatched: `Audience: ${autoReplySettings.audience} | Style: ${autoReplySettings.replyStyle}`,
  };

  autoReplyLogs.unshift(log);

  // 10. NOTIFY USER IF CONFIGURED
  if (notificationSettings.autoReplySent && autoReplySettings.notificationsEnabled) {
    pushNotification({
      title: 'SMS Auto Reply Sent',
      message: `Auto-replied to ${params.senderName || params.sender} using ${autoReplySettings.selectedSimSlot} (${selectedSim.carrierName}).`,
      type: 'success',
      category: 'system',
    });
  }

  return {
    savedMessage: incomingMsg,
    autoReplyAttempted: true,
    autoReplySent: true,
    log,
  };
}
