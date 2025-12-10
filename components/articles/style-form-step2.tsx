'use client';

import { useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { StyleFormStep2Modern } from './modern/style-form-step2-modern';
import { StyleFormStep2Win95 } from './win95/style-form-step2-win95';

interface StyleFormStep2Props {
  initialSubjects?: string[];
  onSubmit: (subjects: string[]) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
  userId?: string;
  styleSamples?: string[];
}

export function StyleFormStep2(props: StyleFormStep2Props) {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  if (designMode === 'win95') {
    return <StyleFormStep2Win95 {...props} />;
  }

  return <StyleFormStep2Modern {...props} />;
}
