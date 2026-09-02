import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Power, AlertOctagon, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface KillSwitchControlProps {
  killSwitchActive: boolean;
  onStatusChange: (newStatus: { killSwitchActive: boolean; enabled: boolean }) => void;
  compact?: boolean;
}

export const KillSwitchControl: React.FC<KillSwitchControlProps> = ({
  killSwitchActive,
  onStatusChange,
  compact = false,
}) => {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleToggle = async (forcedState?: boolean) => {
    try {
      setLoading(true);
      const targetState = typeof forcedState === 'boolean' ? forcedState : !killSwitchActive;
      const res = await api.sms.toggleKillSwitch(targetState);
      onStatusChange(res);
      
      if (res.killSwitchActive) {
        showToast({
          title: '🚨 KILL SWITCH IMEWASHA!',
          message: 'MKUU SMS & Auto Reply imesimamishwa kabisa kwa dharura.',
          type: 'error',
        });
      } else {
        showToast({
          title: 'Kill Switch Imezimwa',
          message: 'Mfumo wa SMS na Auto Reply umerudishwa katika hali ya kawaida.',
          type: 'success',
        });
      }
    } catch (err: any) {
      showToast({
        title: 'Hitilafu ya Kill Switch',
        message: err.message || 'Haikuweza kubadilisha hali ya Kill Switch',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!killSwitchActive) {
              setShowConfirmModal(true);
            } else {
              handleToggle(false);
            }
          }}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
            killSwitchActive
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-600/30'
              : 'bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/40'
          }`}
          title={killSwitchActive ? 'Kill Switch is ACTIVE - Click to restore normal operation' : 'Activate Emergency Kill Switch'}
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : killSwitchActive ? (
            <AlertOctagon className="w-3.5 h-3.5 text-white" />
          ) : (
            <Power className="w-3.5 h-3.5" />
          )}
          <span>{killSwitchActive ? 'KILL SWITCH ON' : 'KILL SWITCH'}</span>
        </button>

        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#141418] border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Washa Emergency Kill Switch?</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Ukiamilisha Kill Switch, MKUU SMS & Auto Reply itasitishwa mara moja. Hakuna jibu la kiotomatiki litakalotumwa kwa mtu yeyote hadi utakapoirudisha wewe mwenyewe.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Ghairi
                </button>
                <button
                  onClick={() => handleToggle(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Ndio, Simamisha Kila Kitu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        killSwitchActive
          ? 'bg-red-950/20 border-red-500/50 shadow-lg shadow-red-900/10'
          : 'bg-[#111114] border-slate-800'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              killSwitchActive
                ? 'bg-red-600/20 border-red-500/60 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {killSwitchActive ? (
              <AlertOctagon className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">MKUU SMS & Auto Reply Kill Switch</h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  killSwitchActive
                    ? 'bg-red-500 text-white'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {killSwitchActive ? '🚨 IMEWASHA (DHARURA)' : 'Hali ya Kawaida'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
              {killSwitchActive
                ? 'Mfumo wote wa SMS na majibu ya kiotomatiki umesitishwa mara moja. Hakuna ujumbe unaotumwa.'
                : 'Kitufe cha dharura cha kusimamisha mara moja huduma yote ya Auto Reply na utumaji wa SMS endapo unahitaji ukimya kamili.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!killSwitchActive) {
              setShowConfirmModal(true);
            } else {
              handleToggle(false);
            }
          }}
          disabled={loading}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 ${
            killSwitchActive
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20'
          }`}
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : killSwitchActive ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Rudisha Mfumo Kawaida (Zima Kill Switch)</span>
            </>
          ) : (
            <>
              <Power className="w-4 h-4" />
              <span>Washa Kill Switch (Sitisha Mara Moja)</span>
            </>
          )}
        </button>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Thibitisha Kuwasha Kill Switch</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Hii itasimamisha utumaji wowote wa majibu ya kiotomatiki ya MKUU AI mara moja. Unataka kuendelea?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Ghairi
              </button>
              <button
                onClick={() => handleToggle(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Ndio, Washa Kill Switch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
