import React from 'react';
import { X, User, Sparkles, Check, Palette } from 'lucide-react';
import { LibrarianAvatar } from '../types/game';
import { synthAudio } from '../audio/synthAudio';

interface AvatarEditorModalProps {
  avatar: LibrarianAvatar;
  onUpdateAvatar: (updated: LibrarianAvatar) => void;
  onClose: () => void;
}

const HAIRSTYLES = [
  { id: 'classic_bun', label: 'Classic Bun & Pin' },
  { id: 'scholar_beret', label: 'Scholar Beret' },
  { id: 'messy_curls', label: 'Messy Curls' },
  { id: 'side_part', label: 'Neat Part' },
  { id: 'wizard_hat', label: 'Whimsical Hat' },
  { id: 'headphones', label: 'Reader Headphones' },
];

const HAIR_COLORS = [
  { color: '#854d0e', name: 'Auburn' },
  { color: '#451a03', name: 'Chestnut' },
  { color: '#171717', name: 'Raven' },
  { color: '#d97706', name: 'Honey Blonde' },
  { color: '#94a3b8', name: 'Silver' },
  { color: '#7c3aed', name: 'Lavender' },
];

const SKIN_TONES = [
  { color: '#fef08a', name: 'Porcelain' },
  { color: '#fcd34d', name: 'Warm Golden' },
  { color: '#d97706', name: 'Amber Bronze' },
  { color: '#92400e', name: 'Rich Caramel' },
  { color: '#451a03', name: 'Deep Espresso' },
];

const EYEWEAR = [
  { id: 'round_wire', label: 'Round Wire Frames' },
  { id: 'tortoise_shell', label: 'Tortoiseshell' },
  { id: 'half_moon', label: 'Half-Moon Spectacles' },
  { id: 'none', label: 'No Glasses' },
];

const OUTFIT_STYLES = [
  { id: 'cardigan', label: 'Knit Cardigan' },
  { id: 'tweed_vest', label: 'Tweed Waistcoat' },
  { id: 'scholar_robe', label: 'Archivist Robe' },
  { id: 'cozy_turtleneck', label: 'Wool Turtleneck' },
];

const OUTFIT_COLORS = [
  { color: '#166534', name: 'Forest Green' },
  { color: '#831843', name: 'Burgundy Wine' },
  { color: '#1e3a8a', name: 'Midnight Navy' },
  { color: '#9a3412', name: 'Terracotta' },
  { color: '#4c1d95', name: 'Royal Plum' },
  { color: '#292524', name: 'Aged Charcoal' },
];

const ACCESSORIES = [
  { id: 'cuppa_tea', label: 'Steaming Cuppa Tea' },
  { id: 'feather_quill', label: 'Goose Feather Quill' },
  { id: 'brass_lantern', label: 'Brass Lantern' },
  { id: 'vintage_tome', label: 'Antique Grimoire' },
];

export const AvatarEditorModal: React.FC<AvatarEditorModalProps> = ({
  avatar,
  onUpdateAvatar,
  onClose,
}) => {
  const [formData, setFormData] = React.useState<LibrarianAvatar>({ ...avatar });

  const handleChange = <K extends keyof LibrarianAvatar>(key: K, value: LibrarianAvatar[K]) => {
    synthAudio.playBookPickup();
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onUpdateAvatar(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 pointer-events-auto select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-stone-900 border border-amber-900/60 rounded-3xl shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-amber-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-amber-100">
                Librarian Avatar Tailor
              </h2>
              <p className="text-xs text-stone-400">
                Customize your appearance, cozy knitwear, spectacles, and handheld trinket.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-cinzel font-semibold text-amber-300 mb-1.5">
              Librarian Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 font-cinzel"
              placeholder="e.g. Librarian Elspeth"
            />
          </div>

          {/* Hairstyle */}
          <div>
            <label className="block text-xs font-cinzel font-semibold text-amber-300 mb-2">
              Hairstyle & Headwear
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {HAIRSTYLES.map((h) => {
                const isSelected = formData.hairstyle === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => handleChange('hairstyle', h.id as any)}
                    className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-semibold'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {h.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hair Color */}
          <div>
            <label className="block text-xs font-cinzel font-semibold text-amber-300 mb-2">
              Hair Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {HAIR_COLORS.map((col) => {
                const isSelected = formData.hairColor.toLowerCase() === col.color.toLowerCase();
                return (
                  <button
                    key={col.color}
                    onClick={() => handleChange('hairColor', col.color)}
                    title={col.name}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      isSelected ? 'scale-110 border-amber-300 shadow-md ring-2 ring-amber-500/40' : 'border-stone-700'
                    }`}
                    style={{ backgroundColor: col.color }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skin Tone */}
          <div>
            <label className="block text-xs font-cinzel font-semibold text-amber-300 mb-2">
              Skin Tone
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {SKIN_TONES.map((tone) => {
                const isSelected = formData.skinTone.toLowerCase() === tone.color.toLowerCase();
                return (
                  <button
                    key={tone.color}
                    onClick={() => handleChange('skinTone', tone.color)}
                    title={tone.name}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      isSelected ? 'scale-110 border-amber-300 shadow-md ring-2 ring-amber-500/40' : 'border-stone-700'
                    }`}
                    style={{ backgroundColor: tone.color }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-stone-900" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Eyewear */}
          <div>
            <label className="block text-xs font-cinzel font-semibold text-amber-300 mb-2">
              Spectacles
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EYEWEAR.map((item) => {
                const isSelected = formData.eyewear === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleChange('eyewear', item.id as any)}
                    className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-semibold'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outfit Color Palette */}
          <div>
            <label className="block text-xs font-cinzel font-semibold text-amber-300 mb-2">
              Cardigan & Robe Color
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {OUTFIT_COLORS.map((col) => {
                const isSelected = formData.outfitColor.toLowerCase() === col.color.toLowerCase();
                return (
                  <button
                    key={col.color}
                    onClick={() => handleChange('outfitColor', col.color)}
                    title={col.name}
                    className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                      isSelected ? 'scale-110 border-amber-300 shadow-md ring-2 ring-amber-500/40' : 'border-stone-700'
                    }`}
                    style={{ backgroundColor: col.color }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Handheld Accessory */}
          <div>
            <label className="block text-xs font-cinzel font-semibold text-amber-300 mb-2">
              Handheld Accessory
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ACCESSORIES.map((item) => {
                const isSelected = formData.accessory === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleChange('accessory', item.id as any)}
                    className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-semibold'
                        : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={() => {
              synthAudio.playButtonClick();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-cinzel font-semibold transition-all cursor-pointer shadow"
          >
            Apply & Return to Library
          </button>
        </div>
      </div>
    </div>
  );
};
