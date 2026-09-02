import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Star,
  Search,
  Trash2,
  Edit2,
  Phone,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  Check,
  X,
  Plus,
  Send,
  Heart,
  Briefcase,
  UserCheck,
  Tag,
  Info,
} from 'lucide-react';
import { WatuWanguContact, AutoReplyBehavior, WatuWanguRelationship } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface WatuWanguManagerProps {
  onSelectContactToCompose?: (phoneNumber: string, name: string) => void;
}

const RELATIONSHIP_TAGS: WatuWanguRelationship[] = [
  'Familia',
  'Kazi / Biashara',
  'Marafiki',
  'VIP / Mkuu',
  'Dharura / Emergency',
  'Mengineyo',
];

const AVATAR_COLORS = [
  { id: 'amber', bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'purple', bg: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'emerald', bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { id: 'blue', bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'rose', bg: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { id: 'cyan', bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
];

export const WatuWanguManager: React.FC<WatuWanguManagerProps> = ({ onSelectContactToCompose }) => {
  const { showToast } = useApp();
  const [contacts, setContacts] = useState<WatuWanguContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');

  // Modal State for Add/Edit
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<WatuWanguContact | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formPhoneNumber, setFormPhoneNumber] = useState('');
  const [formRelationship, setFormRelationship] = useState<WatuWanguRelationship>('Familia');
  const [formBehavior, setFormBehavior] = useState<AutoReplyBehavior>('ai_custom');
  const [formCustomReply, setFormCustomReply] = useState('');
  const [formIsPriority, setFormIsPriority] = useState(true);
  const [formNotes, setFormNotes] = useState('');
  const [formAvatarColor, setFormAvatarColor] = useState('amber');
  const [saving, setSaving] = useState(false);

  // Delete Confirmation Modal
  const [contactToDelete, setContactToDelete] = useState<WatuWanguContact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const data = await api.sms.getWatuWangu();
      setContacts(data);
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Watu Wangu',
        message: err.message || 'Haikuweza kupakia orodha ya Watu Wangu',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const openAddModal = () => {
    setEditingContact(null);
    setFormName('');
    setFormNickname('');
    setFormPhoneNumber('');
    setFormRelationship('Familia');
    setFormBehavior('ai_custom');
    setFormCustomReply('');
    setFormIsPriority(true);
    setFormNotes('');
    setFormAvatarColor('amber');
    setShowModal(true);
  };

  const openEditModal = (contact: WatuWanguContact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormNickname(contact.nickname || '');
    setFormPhoneNumber(contact.phoneNumber);
    setFormRelationship(contact.relationship);
    setFormBehavior(contact.autoReplyBehavior);
    setFormCustomReply(contact.customReplyMessage || '');
    setFormIsPriority(contact.isPriority);
    setFormNotes(contact.notes || '');
    setFormAvatarColor(contact.avatarColor || 'amber');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhoneNumber.trim() || saving) return;

    try {
      setSaving(true);
      if (editingContact) {
        await api.sms.updateWatuWangu(editingContact.id, {
          name: formName.trim(),
          nickname: formNickname.trim() || undefined,
          phoneNumber: formPhoneNumber.trim(),
          relationship: formRelationship,
          autoReplyBehavior: formBehavior,
          customReplyMessage: formBehavior === 'custom_template' ? formCustomReply.trim() : undefined,
          isPriority: formIsPriority,
          notes: formNotes.trim() || undefined,
          avatarColor: formAvatarColor,
        });
        showToast({
          title: 'Watu Wangu Imesasishwa',
          message: `${formName} amesasishwa kikamilifu`,
          type: 'success',
        });
      } else {
        await api.sms.addWatuWangu({
          name: formName.trim(),
          nickname: formNickname.trim() || undefined,
          phoneNumber: formPhoneNumber.trim(),
          relationship: formRelationship,
          autoReplyBehavior: formBehavior,
          customReplyMessage: formBehavior === 'custom_template' ? formCustomReply.trim() : undefined,
          isPriority: formIsPriority,
          notes: formNotes.trim() || undefined,
          avatarColor: formAvatarColor,
        });
        showToast({
          title: 'Mtu Ameongezwa Kwenye Watu Wangu',
          message: `${formName} ameongezwa kwenye orodha ya VIP`,
          type: 'success',
        });
      }
      setShowModal(false);
      await loadContacts();
    } catch (err: any) {
      showToast({
        title: 'Hitilafu',
        message: err.message || 'Haikuweza kuhifadhi taarifa',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contactToDelete || deleting) return;
    try {
      setDeleting(true);
      await api.sms.deleteWatuWangu(contactToDelete.id);
      showToast({
        title: 'Ameondolewa',
        message: `${contactToDelete.name} ameondolewa kwenye Watu Wangu`,
        type: 'info',
      });
      setContactToDelete(null);
      await loadContacts();
    } catch (err: any) {
      showToast({
        title: 'Hitilafu',
        message: err.message || 'Haikuweza kufuta mtu huyu',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePriority = async (contact: WatuWanguContact) => {
    try {
      await api.sms.updateWatuWangu(contact.id, { isPriority: !contact.isPriority });
      await loadContacts();
      showToast({
        title: !contact.isPriority ? 'Kipaumbele Kimewekwa' : 'Kipaumbele Kimeondolewa',
        message: `${contact.name} sasa ${!contact.isPriority ? 'ni Priority VIP' : 'yuko hali ya kawaida'}`,
        type: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Hitilafu', message: err.message || 'Haikuweza kubadili kipaumbele', type: 'error' });
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nickname && c.nickname.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.relationship && c.relationship.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = selectedTag === 'all' || c.relationship.toLowerCase() === selectedTag.toLowerCase();

      return matchesSearch && matchesTag;
    });
  }, [contacts, searchQuery, selectedTag]);

  const priorityCount = useMemo(() => contacts.filter(c => c.isPriority).length, [contacts]);
  const neverReplyCount = useMemo(() => contacts.filter(c => c.autoReplyBehavior === 'never_reply').length, [contacts]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0A0A0B]">
      {/* Header Banner */}
      <div className="border-b border-slate-800 bg-[#111114] p-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Watu Wangu (Inner Circle & VIPs)</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  {contacts.length} Watu
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Orodha ya watu wako wa karibu, familia, viongozi na washirika wa biashara yenye kanuni maalum za majibu ya SMS.
              </p>
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Ongeza Mtu Wangu</span>
          </button>
        </div>

        {/* Quick Metric Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-[#0D0D10] border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Watu wa Kipaumbele</p>
              <p className="text-sm font-extrabold text-white">{priorityCount} VIPs</p>
            </div>
          </div>

          <div className="bg-[#0D0D10] border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Kamwe Usijibu (Max Direct)</p>
              <p className="text-sm font-extrabold text-white">{neverReplyCount} Watu</p>
            </div>
          </div>

          <div className="bg-[#0D0D10] border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Majibu ya AI Yaliyoboreshwa</p>
              <p className="text-sm font-extrabold text-white">
                {contacts.filter(c => c.autoReplyBehavior === 'ai_custom').length} Watu
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-6 py-3 border-b border-slate-800 bg-[#0E0E12] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tafuta jina, namba ya simu, au uhusiano..."
            className="w-full bg-[#131317] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Relationship filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedTag === 'all'
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Wote ({contacts.length})
          </button>
          {RELATIONSHIP_TAGS.map(tag => {
            const count = contacts.filter(c => c.relationship.toLowerCase() === tag.toLowerCase()).length;
            if (count === 0 && selectedTag !== tag) return null;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-amber-500 text-black'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Contacts List Grid */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-[#111114] border border-slate-800/80 rounded-2xl">
            <Users className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-300">Hakuna Mtu Wangu Aliyepatikana</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery
                ? 'Hakuna mtu anayelingana na utafutaji wako. Jaribu kubadilisha maneno ya utafutaji.'
                : 'Bado hujaongeza mtu yeyote kwenye orodha ya Watu Wangu. Bofya kitufe cha juu kuongeza mtu sasa.'}
            </p>
            {!searchQuery && (
              <button
                onClick={openAddModal}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Ongeza Mtu wa Kwanza</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map(contact => {
              const colorObj = AVATAR_COLORS.find(c => c.id === contact.avatarColor) || AVATAR_COLORS[0];
              return (
                <div
                  key={contact.id}
                  className={`bg-[#111114] border rounded-2xl p-4 transition-all hover:border-slate-700 flex flex-col justify-between ${
                    contact.isPriority
                      ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-transparent'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Card Header: Avatar, Name & Priority Star */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm border shrink-0 ${colorObj.bg}`}
                        >
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white truncate">{contact.name}</h3>
                          </div>
                          <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{contact.phoneNumber}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTogglePriority(contact)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          contact.isPriority
                            ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                            : 'text-slate-600 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                        title={contact.isPriority ? 'Mtu wa Kipaumbele (Bonyeza kubadili)' : 'Weka Kipaumbele'}
                      >
                        <Star className={`w-4 h-4 ${contact.isPriority ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Nickname & Relationship Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {contact.relationship}
                      </span>
                      {contact.nickname && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          "{contact.nickname}"
                        </span>
                      )}
                      {contact.isPriority && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          ⭐ VIP
                        </span>
                      )}
                    </div>

                    {/* Auto Reply Behavior Status Badge */}
                    <div className="bg-[#0D0D10] border border-slate-800/80 rounded-xl p-2.5 mb-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-semibold">Kanuni ya Majibu:</span>
                        {contact.autoReplyBehavior === 'never_reply' && (
                          <span className="text-red-400 font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Kamwe Usijibu
                          </span>
                        )}
                        {contact.autoReplyBehavior === 'ai_custom' && (
                          <span className="text-purple-400 font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI ya Heshima
                          </span>
                        )}
                        {contact.autoReplyBehavior === 'custom_template' && (
                          <span className="text-cyan-400 font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Ujumbe Maalum
                          </span>
                        )}
                        {contact.autoReplyBehavior === 'standard' && (
                          <span className="text-slate-400 font-bold">Kawaida</span>
                        )}
                      </div>

                      {contact.autoReplyBehavior === 'custom_template' && contact.customReplyMessage && (
                        <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-1">
                          "{contact.customReplyMessage}"
                        </p>
                      )}

                      {contact.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          <span className="text-slate-500">Maelezo:</span> {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(contact)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Hariri Taarifa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setContactToDelete(contact)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Ondoa kwenye Watu Wangu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {onSelectContactToCompose && (
                      <button
                        onClick={() => onSelectContactToCompose(contact.phoneNumber, contact.name)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Tuma SMS</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* ADD / EDIT MODAL */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingContact ? 'Hariri Mtu Wangu' : 'Ongeza Mtu Mpya Kwenye Watu Wangu'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Weka mipangilio ya VIP na jinsi MKUU AI inavyopaswa kumjibu.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
              {/* Name & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jina Kamili <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="mf. Mama, John Mtei, Dkt. Alex"
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jina la Utani / Msimbo (Salutation)
                  </label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={e => setFormNickname(e.target.value)}
                    placeholder="mf. Bro, Mkuu, Boss, Honey"
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Phone Number & Relationship */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Namba ya Simu <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhoneNumber}
                    onChange={e => setFormPhoneNumber(e.target.value)}
                    placeholder="+255 754 000 111"
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Aina ya Uhusiano
                  </label>
                  <select
                    value={formRelationship}
                    onChange={e => setFormRelationship(e.target.value as WatuWanguRelationship)}
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  >
                    {RELATIONSHIP_TAGS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto Reply Behavior Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tabia ya MKUU SMS Auto Reply kwa Mtu Huyu
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setFormBehavior('ai_custom')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formBehavior === 'ai_custom'
                        ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                        : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI ya Heshima & Mazingira</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      MKUU AI itamjibu kwa lugha ya heshima inayomtambua kama mtu wako wa karibu.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormBehavior('never_reply')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formBehavior === 'never_reply'
                        ? 'bg-red-500/10 border-red-500/40 text-red-300'
                        : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs text-red-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Kamwe Usijibu Kiotomatiki</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      AI haitajibu SMS yake kabisa. Ujumbe utaingia na utapewa taarifa ya dharura mara moja.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormBehavior('custom_template')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formBehavior === 'custom_template'
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                        : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Ujumbe Maalum Uliopangwa</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tuma ujumbe maalum uliouandika wewe mwenyewe kila anapotuma SMS.
                    </p>
                  </div>

                  <div
                    onClick={() => setFormBehavior('standard')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      formBehavior === 'standard'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-[#0D0D10] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>Kanuni ya Kawaida</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tumia mipangilio ya kawaida ya Auto Reply ya mfumo wote.
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom message textarea if custom_template is chosen */}
              {formBehavior === 'custom_template' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ujumbe Maalum wa Kumjibu Mtu Huyu
                  </label>
                  <textarea
                    rows={2}
                    value={formCustomReply}
                    onChange={e => setFormCustomReply(e.target.value)}
                    placeholder="mf. Habari Mama, niko kwenye kikao nitakupigia mara tu nikitoka."
                    className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              {/* Notes for AI Context */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maelezo kwa ajili ya AI (AI Context Notes)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="mf. Ni mzazi, au Mkurugenzi mkuu wa kampuni - jibu kwa upole na weka heshima ya hali ya juu."
                  className="w-full bg-[#0D0D10] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Priority Toggle & Color Picker */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPriority}
                    onChange={e => setFormIsPriority(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 border-slate-700 bg-slate-900 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Weka Alama ya VIP / Kipaumbele cha Juu
                  </span>
                </label>

                {/* Color Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 mr-1">Rangi:</span>
                  {AVATAR_COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormAvatarColor(c.id)}
                      className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${c.bg} ${
                        formAvatarColor === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141418]' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim() || !formPhoneNumber.trim() || saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black transition-all shadow-md shadow-amber-500/10 flex items-center gap-1.5"
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingContact ? 'Hifadhi Mabadiliko' : 'Ongeza Mtu Wangu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Ondoa "{contactToDelete.name}" kwenye Watu Wangu?
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Mtu huyu hataondolewa kwenye kumbukumbu ya simu yako ya kawaida, lakini ataondolewa kwenye kanuni maalum za VIP za MKUU AI.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Ghairi
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-md shadow-red-600/30 flex items-center gap-1.5"
              >
                {deleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Ndio, Ondoa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
