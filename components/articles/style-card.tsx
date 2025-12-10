'use client';

import { useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { StyleCardModern } from './modern/style-card-modern';
import { StyleCardWin95 } from './win95/style-card-win95';
import type { ArticleStyle } from '@/lib/types';

interface StyleCardProps {
  style: ArticleStyle;
  onDelete?: (id: string) => Promise<void>;
}

export function StyleCard(props: StyleCardProps) {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  if (designMode === 'win95') {
    return <StyleCardWin95 {...props} />;
  }

  return <StyleCardModern {...props} />;
}
