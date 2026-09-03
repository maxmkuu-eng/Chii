import {
  SmsPermissions,
  SimCard,
  SmsConversation,
  SmsMessage,
  AutoReplySettings,
  AutoReplyLog,
  SmsNotificationSettings,
  PermissionState,
  WatuWanguContact,
} from '../types';
import { getApiUrl } from './api';

/** MKUU AI Android SMS & Native Bridge Layer. */
class MkuuSmsBridgeService {
  private isAndroidNative(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).MkuuAndroidSms ||
      (window as any).BongoAndroidSms ||
      (window as any).Capacitor?.isPluginAvailable?.('MkuuSms') ||
      /Android/i.test(navigator.userAgent)
    );
  }

  public getEnvironmentDetails(): {
    platform: 'android_native' | 'android_web' | 'web_sandbox';
    hasTelephony: boolean;
    supportsDualSim: boolean;
    supportsDirectSmsSending: boolean;
    description: string;
  } {
    const isAndroid = this.isAndroidNative();
    return {
      platform: isAndroid ? 'android_native' : 'web_sandbox',
      hasTelephony: true,
      supportsDualSim: true,
      supportsDirectSmsSending: true,
      description: isAndroid
        ? 'Native Android Telephony Subsystem Active'
        : 'Engineered Android Telephony Bridge & Isolated Server Module',
    };
  }

  async getPermissions(): Promise<SmsPermissions> {
    try {
      const res = await fetch(getApiUrl('/api/sms/permissions'));
      if (!res.ok) throw new Error('Failed to fetch SMS permissions');
      const data = await res.json();
      return data.permissions;
    } catch {
      return { readSms: 'granted', receiveSms: 'granted', sendSms: 'granted', notifications: 'granted' };
    }
  }

  async updatePermission(key: keyof SmsPermissions, state: PermissionState): Promise<SmsPermissions> {
    const res = await fetch(getApiUrl('/api/sms/permissions'), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: state }),
    });
    if (!res.ok) throw new Error('Failed to update permission state');
    return (await res.json()).permissions;
  }

  // -------------------------------------------------------------
  // DUAL-SIM MANAGEMENT
  // -------------------------------------------------------------

  async getSimCards(): Promise<SimCard[]> {
    // The APK is the source of truth for physical SIM state. Never show
    // server/sample numbers when native Android can provide the real lines.
    if (typeof window !== 'undefined') {
      const native = (window as any).MkuuAndroidSms;
      if (native?.getSimCards) {
        try {
          const raw = native.getSimCards();
          const sims = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (Array.isArray(sims)) return sims as SimCard[];
        } catch {
          // Fall through to server only when the native bridge is unavailable.
        }
      }
    }

    try {
      const res = await fetch(getApiUrl('/api/sms/sims'));
      if (!res.ok) throw new Error('Failed to fetch SIM cards');
      const data = await res.json();
      return Array.isArray(data.sims) ? data.sims : [];
    } catch {
      return [];
    }
  }

  async updateSimCards(updates: Partial<SimCard>[]): Promise<SimCard[]> {
    const res = await fetch(getApiUrl('/api/sms/sims'), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error('Failed to update SIM configuration');
    return (await res.json()).sims;
  }

  // -------------------------------------------------------------
  // SMS CONVERSATIONS, DELETION & SENDING
  // -------------------------------------------------------------

  async getConversations(): Promise<SmsConversation[]> {
    const res = await fetch(getApiUrl('/api/sms/inbox'));
    if (!res.ok) throw new Error('Failed to fetch SMS inbox');
    return (await res.json()).conversations || [];
  }

  async getConversation(id: string): Promise<SmsConversation> {
    const res = await fetch(getApiUrl(`/api/sms/threads/${id}`));
    if (!res.ok) throw new Error('Failed to fetch SMS conversation');
    return (await res.json()).conversation;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/api/sms/threads/${id}`), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete SMS thread');
    return (await res.json()).success;
  }

  async batchDeleteConversations(threadIds: string[]): Promise<{ deletedCount: number; remainingCount: number }> {
    const res = await fetch(getApiUrl('/api/sms/threads/batch-delete'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ threadIds }),
    });
    if (!res.ok) throw new Error('Failed to batch delete SMS threads');
    return res.json();
  }

  async clearAllConversations(): Promise<void> {
    const res = await fetch(getApiUrl('/api/sms/inbox'), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear SMS inbox');
  }

  async deleteMessage(threadId: string, messageId: string): Promise<{ success: boolean; conversation: SmsConversation | null }> {
    const res = await fetch(getApiUrl(`/api/sms/threads/${threadId}/messages/${messageId}`), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete SMS message');
    return res.json();
  }

  async sendSms(params: { recipient: string; recipientName?: string; content: string; simSlot: 'SIM 1' | 'SIM 2' }): Promise<{ success: boolean; message: SmsMessage; thread: SmsConversation }> {
    // Send from the actual Android subscription selected by Auto Reply.
    const native = typeof window !== 'undefined' ? (window as any).MkuuAndroidSms : null;
    if (native?.sendSms) {
      const slotIndex = params.simSlot === 'SIM 2' ? 1 : 0;
      const raw = native.sendSms(params.recipient, params.content, slotIndex);
      const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!result?.success) throw new Error(result?.error || 'SMS imeshindwa kutumwa kupitia SIM iliyochaguliwa.');
      const now = new Date().toISOString();
      const simId = `android-sim-${slotIndex}`;
      const message: SmsMessage = {
        id: `local-${Date.now()}`,
        threadId: `local-${params.recipient}`,
        sender: 'Me', recipient: params.recipient, recipientName: params.recipientName,
        content: params.content, timestamp: now, direction: 'outgoing',
        simSlot: params.simSlot, simId, status: 'sent',
      };
      const thread: SmsConversation = {
        id: message.threadId, phoneNumber: params.recipient, contactName: params.recipientName,
        lastMessage: params.content, lastTimestamp: now, unreadCount: 0,
        simSlot: params.simSlot, messages: [message],
      };
      return { success: true, message, thread };
    }

    const res = await fetch(getApiUrl('/api/sms/send'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to send SMS' }));
      throw new Error(err.error || `Failed to send SMS (Status ${res.status})`);
    }
    return res.json();
  }

  async toggleKillSwitch(active?: boolean): Promise<{ killSwitchActive: boolean; enabled: boolean }> {
    const res = await fetch(getApiUrl('/api/sms/auto-reply/kill-switch'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }),
    });
    if (!res.ok) throw new Error('Failed to toggle emergency kill switch');
    return res.json();
  }

  async getAutoReplySettings(): Promise<AutoReplySettings> {
    const res = await fetch(getApiUrl('/api/sms/auto-reply/settings'));
    if (!res.ok) throw new Error('Failed to fetch Auto Reply settings');
    return (await res.json()).settings;
  }

  async updateAutoReplySettings(settings: Partial<AutoReplySettings>): Promise<AutoReplySettings> {
    const res = await fetch(getApiUrl('/api/sms/auto-reply/settings'), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update Auto Reply settings');
    return (await res.json()).settings;
  }

  async getWatuWangu(): Promise<WatuWanguContact[]> {
    const res = await fetch(getApiUrl('/api/sms/watu-wangu'));
    if (!res.ok) throw new Error('Failed to fetch Watu Wangu contacts');
    return (await res.json()).contacts || [];
  }

  async addWatuWangu(contact: Omit<WatuWanguContact, 'id' | 'createdAt'>): Promise<WatuWanguContact> {
    const res = await fetch(getApiUrl('/api/sms/watu-wangu'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contact),
    });
    if (!res.ok) throw new Error('Failed to add contact to Watu Wangu');
    return (await res.json()).contact;
  }

  async updateWatuWangu(id: string, updates: Partial<WatuWanguContact>): Promise<WatuWanguContact> {
    const res = await fetch(getApiUrl(`/api/sms/watu-wangu/${id}`), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update Watu Wangu contact');
    return (await res.json()).contact;
  }

  async deleteWatuWangu(id: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/api/sms/watu-wangu/${id}`), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete Watu Wangu contact');
    return (await res.json()).success;
  }

  async simulateIncomingSms(params: { sender: string; senderName?: string; content: string; simSlot: 'SIM 1' | 'SIM 2' }): Promise<{ savedMessage: SmsMessage; autoReplyAttempted: boolean; autoReplySent: boolean; log?: AutoReplyLog; reason?: string }> {
    const res = await fetch(getApiUrl('/api/sms/auto-reply/simulate-incoming'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to process incoming SMS' }));
      throw new Error(err.error || 'Failed to simulate incoming SMS event');
    }
    return res.json();
  }

  async getAutoReplyLogs(): Promise<AutoReplyLog[]> {
    const res = await fetch(getApiUrl('/api/sms/auto-reply/history'));
    if (!res.ok) throw new Error('Failed to fetch Auto Reply logs');
    return (await res.json()).logs || [];
  }

  async clearAutoReplyLogs(): Promise<void> {
    const res = await fetch(getApiUrl('/api/sms/auto-reply/history'), { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear Auto Reply history');
  }

  async getNotificationSettings(): Promise<SmsNotificationSettings> {
    const res = await fetch(getApiUrl('/api/sms/notifications/settings'));
    if (!res.ok) throw new Error('Failed to fetch notification settings');
    return (await res.json()).settings;
  }

  async updateNotificationSettings(settings: Partial<SmsNotificationSettings>): Promise<SmsNotificationSettings> {
    const res = await fetch(getApiUrl('/api/sms/notifications/settings'), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update notification settings');
    return (await res.json()).settings;
  }
}

export const smsBridge = new MkuuSmsBridgeService();
