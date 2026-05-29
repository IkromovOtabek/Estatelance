import React from 'react';
import {
  Camera, Armchair, Megaphone, Scales, Cube, PaintBrush,
  Wrench, Broom, ClipboardText, Code, Translate, Truck,
  Calculator, ShieldCheck, Briefcase,
} from '@phosphor-icons/react';

const ICON_MAP: Record<string, React.ReactElement> = {
  VISUALS:     <Camera />,
  STAGING:     <Armchair />,
  MARKETING:   <Megaphone />,
  LEGAL:       <Scales />,
  RENDERING:   <Cube />,
  DESIGN:      <PaintBrush />,
  REPAIR:      <Wrench />,
  CLEANING:    <Broom />,
  INSPECTION:  <ClipboardText />,
  IT:          <Code />,
  TRANSLATION: <Translate />,
  MOVING:      <Truck />,
  ACCOUNTING:  <Calculator />,
  SECURITY:    <ShieldCheck />,
  OTHER:       <Briefcase />,
};

export function getCatIcon(category: string, size: number = 18): React.ReactElement {
  const base = ICON_MAP[category] ?? ICON_MAP.OTHER!;
  return React.cloneElement(base, { size });
}
