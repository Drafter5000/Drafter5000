'use client';

import { useContext } from 'react';
import { DesignContext, type DesignMode } from '@/components/design-provider';
import { StyleFormStep3Modern } from './modern/style-form-step3-modern';
import { StyleFormStep3Win95 } from './win95/style-form-step3-win95';

interface Step3Data {
  name: string;
  email: string;
  display_name: string;
  preferred_language: string;
  delivery_days: string[];
}

interface StyleFormStep3Props {
  initialData?: Partial<Step3Data>;
  userEmail?: string;
  onSubmit: (data: Step3Data) => Promise<void>;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function StyleFormStep3(props: StyleFormStep3Props) {
  const context = useContext(DesignContext);
  const designMode: DesignMode = context?.designMode ?? 'modern';

  if (designMode === 'win95') {
    return <StyleFormStep3Win95 {...props} />;
  }

  return <StyleFormStep3Modern {...props} />;
}
