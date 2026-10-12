import { Check, CircleAlert, Info } from 'lucide-preact';
import type * as Real from '../../lib/icons';

// Widget stand-in: the real map carries every toolbar glyph; only the toasts reach it here.
const iconMap: Record<string, typeof Check> = { check: Check, alert: CircleAlert, info: Info };

export const Icon: typeof Real.Icon = ({ name, size = 18, strokeWidth = 2 }) => {
  const Comp = iconMap[name];
  return Comp ? <Comp size={size} strokeWidth={strokeWidth} /> : null;
};

export const BrandIcon: typeof Real.BrandIcon = () => null;
