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
  Smartphone,
  Wifi,
  Battery,
  PhoneCall,
  Sliders,
  Share2,
  Download,
  Upload,
  Clock,
  ChevronRight,
  Maximize2,
  Minimize2,
  Delete,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { WatuWanguContact, AutoReplyBehavior, WatuWanguRelationship } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

const RELATIONSHIP_TAGS: WatuWanguRelationship[] = [
  'Familia',
  'Kazi / Biashara',
  'Marafiki',
  'VIP / Mkuu',
  'Dharura / Emergency',
  'Mengineyo',
];

const AVATAR_COLORS = [
  { id: 'amber', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'purple', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'emerald', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'blue', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'rose', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
  { id: 'cyan', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
];

export const WatuWanguModule: React.FC = () => {
  const { showToast, navigateTo } = useApp();
  const [contacts, setContacts] = useState<WatuWanguContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | 'all'>('all');
  const [phoneFrameMode, setPhoneFrameMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'contacts' | 'dialer' | 'stats'>('contacts');

  // Dialpad state
  const [dialedNumber, setDialedNumber] = useState('');

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

  // Selected Contact Detail View
  const [selectedContactDetail, setSelectedContactDetail] = useState<WatuWanguContact | null>(null);

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

  const openAddModal = (initialPhone?: string) => {
    setEditingContact(null);
    setFormName('');
    setFormNickname('');
    setFormPhoneNumber(initialPhone || '');
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
          message: `${formName} (${formPhoneNumber}) amehifadhiwa kikamilifu`,
          type: 'success',
        });
      }
      setShowModal(false);
      setDialedNumber('');
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
        title: 'Namba Imefutwa',
        message: `${contactToDelete.name} (${contactToDelete.phoneNumber}) ameondolewa kabisa.`,
        type: 'info',
      });
      setContactToDelete(null);
      if (selectedContactDetail?.id === contactToDelete.id) {
        setSelectedContactDetail(null);
      }
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

  const handleTogglePriority = async (contact: WatuWanguContact, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.sms.updateWatuWangu(contact.id, { isPriority: !contact.isPriority });
      await loadContacts();
      showToast({
        title: !contact.isPriority ? 'Kipaumbele Kimewekwa' : 'Kipaumbele Kimeondolewa',
        message: `${contact.name} sasa ${!contact.isPriority ? 'ni Priority VIP' : 'yuko kawaida'}`,
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
        (c.relationship && c.relationship.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTag = selectedTag === 'all' || c.relationship.toLowerCase() === selectedTag.toLowerCase();

      return matchesSearch && matchesTag;
    });
  }, [contacts, searchQuery, selectedTag]);

  const priorityCount = useMemo(() => contacts.filter(c => c.isPriority).length, [contacts]);
  const neverReplyCount = useMemo(() => contacts.filter(c => c.autoReplyBehavior === 'never_reply').length, [contacts]);
  const aiReplyCount = useMemo(() => contacts.filter(c => c.autoReplyBehavior === 'ai_custom').length, [contacts]);

  const handleDialClick = (digit: string) => {
    setDialedNumber(prev => prev + digit);
  };

  const handleDialBackspace = () => {
    setDialedNumber(prev => prev.slice(0, -1));
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 overflow-y-auto">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900">Watu Wangu & Namba Zangu</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {contacts.length} Namba
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Orodha kamili ya namba za simu, VIPs, na kanuni maalum za SMS Auto-Reply
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPhoneFrameMode(!phoneFrameMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
            title={phoneFrameMode ? 'Badili kuwa Full Screen' : 'Badili kuwa Muundo wa Simu'}
          >
            {phoneFrameMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{phoneFrameMode ? 'Full Screen' : 'Phone UI'}</span>
          </button>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ongeza Namba</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3 sm:p-6 flex justify-center items-start overflow-y-auto">
        {/* Phone Container if phoneFrameMode, or Full Width Container */}
        <div
          className={`w-full transition-all duration-300 ${
            phoneFrameMode
              ? 'max-w-md bg-white rounded-3xl shadow-2xl border-4 border-gray-300 overflow-hidden flex flex-col min-h-[760px] h-[85vh]'
              : 'max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[700px]'
          }`}
        >
          {/* Smartphone Status Bar (Simu ya Mkononi Header) */}
          <div className="bg-gray-900 text-white px-5 py-2 flex items-center justify-between text-[11px] font-semibold select-none shrink-0">
            <span>09:41</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider text-emerald-400">5G</span>
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Smartphone App Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="MKUU AI"
                  className="w-7 h-7 rounded-lg object-cover border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sm font-extrabold text-gray-900">Watu Wangu Phone UI</span>
              </div>

              {/* Navigation Tabs inside Phone UI */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'contacts' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Namba ({contacts.length})
                </button>
                <button
                  onClick={() => setActiveTab('dialer')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'dialer' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Dialpad
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'stats' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Vipengele
                </button>
              </div>
            </div>

            {/* Search Input */}
            {activeTab === 'contacts' && (
              <div className="relative mt-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tafuta jina, namba, kundi..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Category Pills */}
            {activeTab === 'contacts' && (
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedTag === 'all'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Wote ({contacts.length})
                </button>
                {RELATIONSHIP_TAGS.map(tag => {
                  const count = contacts.filter(c => c.relationship.toLowerCase() === tag.toLowerCase()).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag} {count > 0 ? `(${count})` : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Phone Screen Body Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 scrollbar-thin">
            {/* TAB 1: CONTACTS LIST */}
            {activeTab === 'contacts' && (
              <>
                {loading ? (
                  <div className="py-12 text-center text-gray-500 space-y-2">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs">Inapakia namba za Watu Wangu...</p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 space-y-3 bg-white rounded-2xl p-6 border border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-gray-800">Hakuna namba iliyopatikana</p>
                      <p className="text-xs text-gray-500">
                        {searchQuery ? 'Hakuna matokeo ya utafutaji wako' : 'Bonyeza "Ongeza Namba" kuhifadhi mtu wa kwanza'}
                      </p>
                    </div>
                    <button
                      onClick={() => openAddModal()}
                      className="px-4 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                    >
                      Ongeza Namba Mpya
                    </button>
                  </div>
                ) : (
                  filteredContacts.map(contact => {
                    const avatarScheme = AVATAR_COLORS.find(c => c.id === contact.avatarColor) || AVATAR_COLORS[0];
                    return (
                      <div
                        key={contact.id}
                        onClick={() => setSelectedContactDetail(contact)}
                        className="bg-white rounded-2xl p-3 border border-gray-200 hover:border-gray-300 shadow-2xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div
                              className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-bold text-sm shrink-0 ${avatarScheme.bg}`}
                            >
                              {contact.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Contact Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs font-bold text-gray-900 truncate">
                                  {contact.name}
                                </h3>
                                {contact.nickname && (
                                  <span className="text-[10px] text-gray-500 truncate">
                                    "{contact.nickname}"
                                  </span>
                                )}
                                {contact.isPriority && (
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs font-mono font-semibold text-gray-700 tracking-tight">
                                {contact.phoneNumber}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                  {contact.relationship}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                                    contact.autoReplyBehavior === 'ai_custom'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : contact.autoReplyBehavior === 'never_reply'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {contact.autoReplyBehavior === 'ai_custom'
                                    ? 'AI Auto-Reply'
                                    : contact.autoReplyBehavior === 'never_reply'
                                    ? 'Silent / No Reply'
                                    : 'Template'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons (Call, SMS, Edit, Delete) */}
                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            {/* Call Button */}
                            <a
                              href={`tel:${contact.phoneNumber}`}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Piga Simu"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>

                            {/* SMS Button */}
                            <a
                              href={`sms:${contact.phoneNumber}`}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              title="Tuma SMS"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>

                            {/* Priority Toggle */}
                            <button
                              onClick={e => handleTogglePriority(contact, e)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                              title={contact.isPriority ? 'Ondoa Kipaumbele' : 'Weka Kipaumbele VIP'}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  contact.isPriority ? 'fill-amber-400 text-amber-500' : ''
                                }`}
                              />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(contact)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
                              title="Badilisha (Edit)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* DELETE BUTTON with 1-click confirmation modal */}
                            <button
                              onClick={() => setContactToDelete(contact)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Futa Namba Hii (Delete)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {contact.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 italic truncate">
                            📝 {contact.notes}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {/* TAB 2: DIALPAD & QUICK SAVE */}
            {activeTab === 'dialer' && (
              <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-4">
                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Piga / Hifadhi Namba Mpya</span>
                  <div className="text-2xl font-mono font-bold text-gray-900 h-9 flex items-center justify-center tracking-wider">
                    {dialedNumber || <span className="text-gray-300">Ingiza Namba...</span>}
                  </div>
                </div>

                {/* Dialpad Keypad Grid */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {[
                    { num: '1', sub: '' },
                    { num: '2', sub: 'ABC' },
                    { num: '3', sub: 'DEF' },
                    { num: '4', sub: 'GHI' },
                    { num: '5', sub: 'JKL' },
                    { num: '6', sub: 'MNO' },
                    { num: '7', sub: 'PQRS' },
                    { num: '8', sub: 'TUV' },
                    { num: '9', sub: 'WXYZ' },
                    { num: '*', sub: '' },
                    { num: '0', sub: '+' },
                    { num: '#', sub: '' },
                  ].map(btn => (
                    <button
                      key={btn.num}
                      onClick={() => handleDialClick(btn.num)}
                      className="h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex flex-col items-center justify-center text-gray-900 font-bold transition-all cursor-pointer"
                    >
                      <span className="text-base leading-none">{btn.num}</span>
                      {btn.sub && <span className="text-[8px] font-normal text-gray-500">{btn.sub}</span>}
                    </button>
                  ))}
                </div>

                {/* Dialpad Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  {dialedNumber && (
                    <button
                      onClick={handleDialBackspace}
                      className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                      title="Backspace"
                    >
                      <Delete className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => openAddModal(dialedNumber)}
                    disabled={!dialedNumber}
                    className="flex-1 max-w-xs py-3 rounded-2xl bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Hifadhi Kwenye Watu Wangu</span>
                  </button>

                  {dialedNumber && (
                    <a
                      href={`tel:${dialedNumber}`}
                      className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md"
                      title="Piga Sasa"
                    >
                      <PhoneCall className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: FEATURES & STATS OVERVIEW */}
            {activeTab === 'stats' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="text-xs font-bold">VIP Priority</span>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{priorityCount}</p>
                    <p className="text-[10px] text-gray-500">Watu wenye kipaumbele cha juu</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-bold">AI Auto-Reply</span>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{aiReplyCount}</p>
                    <p className="text-[10px] text-gray-500">Majibu ya kiakili ya AI</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-rose-600 mb-1">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-xs font-bold">Kamwe Usijibu</span>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{neverReplyCount}</p>
                    <p className="text-[10px] text-gray-500">Hujibiwi na AI, Max pekee</p>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-bold">Jumla ya Namba</span>
                    </div>
                    <p className="text-xl font-extrabold text-gray-900">{contacts.length}</p>
                    <p className="text-[10px] text-gray-500">Namba zote zilizosaviwa</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Kuhusu Mpangilio wa Watu Wangu</span>
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Watu Wangu ni orodha maalum inayompa MKUU AI maelekezo ya jinsi ya kuwasiliana na watu wako wa karibu. 
                    Unaweza kuweka namba za familia, wafanyakazi, wateja wakuu, na kuamua endapo AI ijibu moja kwa moja au usubiri wewe mwenyewe ujibu.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Smartphone Bottom Navigation Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-2.5 flex items-center justify-between text-gray-500 shrink-0 select-none">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeTab === 'contacts' ? 'text-black font-bold' : 'hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px]">Watu Wangu</span>
            </button>

            <button
              onClick={() => setActiveTab('dialer')}
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeTab === 'dialer' ? 'text-black font-bold' : 'hover:text-gray-900'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span className="text-[10px]">Dialpad</span>
            </button>

            <button
              onClick={() => openAddModal()}
              className="flex flex-col items-center gap-0.5 text-black font-bold cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center -mt-3 shadow-md hover:scale-105 transition-transform">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px]">Ongeza</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex flex-col items-center gap-0.5 cursor-pointer ${
                activeTab === 'stats' ? 'text-black font-bold' : 'hover:text-gray-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span className="text-[10px]">Mipangilio</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT CONTACT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl border border-gray-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {editingContact ? 'Badilisha Namba ya Mtu' : 'Ongeza Namba Mpya'}
                  </h3>
                  <p className="text-[11px] text-gray-500">Hifadhi taarifa na kanuni za Auto-Reply</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Jina Kamili *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Mf. Mhandisi Juma, Mama, Mkurugenzi..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Namba ya Simu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhoneNumber}
                    onChange={e => setFormPhoneNumber(e.target.value)}
                    placeholder="+255 7XX XXX XXX"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 font-mono text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Jina la Utani (Nickname)
                  </label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={e => setFormNickname(e.target.value)}
                    placeholder="Mf. Baba, Mkuu..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kundi / Uhusiano
                </label>
                <select
                  value={formRelationship}
                  onChange={e => setFormRelationship(e.target.value as WatuWanguRelationship)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black bg-white"
                >
                  {RELATIONSHIP_TAGS.map(tag => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tabia ya Majibu ya SMS (Auto-Reply)
                </label>
                <select
                  value={formBehavior}
                  onChange={e => setFormBehavior(e.target.value as AutoReplyBehavior)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black bg-white"
                >
                  <option value="ai_custom">✨ AI Smart Reply (Majibu ya Akili ya Kiswahili)</option>
                  <option value="custom_template">📝 Ujumbe Maalum Uliopangwa (Template)</option>
                  <option value="never_reply">🚫 Kamwe Usijibu (Max Pekee Ndio Atajibu)</option>
                </select>
              </div>

              {formBehavior === 'custom_template' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ujumbe Maalum wa Kujibiwa
                  </label>
                  <textarea
                    rows={2}
                    value={formCustomReply}
                    onChange={e => setFormCustomReply(e.target.value)}
                    placeholder="Mf. Habari Boss, niko kwenye kikao nitakupigia baadaye."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                  <div>
                    <span className="text-xs font-bold text-gray-900">Kipaumbele cha VIP</span>
                    <p className="text-[10px] text-gray-600">Arifa za papo hapo mtu huyu anapopiga/kutuma SMS</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formIsPriority}
                  onChange={e => setFormIsPriority(e.target.checked)}
                  className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Maelezo Binafsi (Notes)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Mf. Msimamizi wa mradi wa Dodoma, simu za dharura"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {saving ? 'Inahifadhi...' : editingContact ? 'Sasisha Namba' : 'Hifadhi Namba'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {contactToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-3xl border border-gray-200 shadow-2xl p-5 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">Futa Namba ya Mtu Huyu?</h3>
              <p className="text-xs text-gray-600">
                Una uhakika unataka kumfuta <strong className="text-gray-900 font-bold">{contactToDelete.name}</strong> ({contactToDelete.phoneNumber}) kutoka kwenye orodha ya Watu Wangu?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Ghairi (Cancel)
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-sm"
              >
                {deleting ? 'Inafuta...' : 'Ndio, Futa Kabisa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
