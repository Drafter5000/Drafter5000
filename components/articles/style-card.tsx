'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Win95Button, Win95Badge } from '@/components/win95';
import { DeleteDialog } from './delete-dialog';
import type { ArticleStyle } from '@/lib/types';

const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
  ru: '🇷🇺',
  ja: '🇯🇵',
  zh: '🇨🇳',
  ko: '🇰🇷',
  ar: '🇸🇦',
  hi: '🇮🇳',
};

interface StyleCardProps {
  style: ArticleStyle;
  onDelete?: (id: string) => Promise<void>;
}

export function StyleCard({ style, onDelete }: StyleCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(style.id);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const flag = LANGUAGE_FLAGS[style.preferred_language] || '🌐';
  const createdDate = new Date(style.created_at).toLocaleDateString();

  return (
    <>
      <div className="win95-raised p-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="win95-sunken p-1">
              <span className="text-[16px]">📄</span>
            </div>
            <div>
              <h3 className="text-[11px] font-bold">{style.name}</h3>
              <p className="text-[10px] text-[var(--win95-button-shadow)]">{createdDate}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <Win95Badge>
            {flag} {style.preferred_language.toUpperCase()}
          </Win95Badge>
          <Win95Badge variant="secondary">📅 {style.delivery_days.length} days</Win95Badge>
          <Win95Badge variant="outline">{style.subjects.length} topics</Win95Badge>
        </div>

        <div className="flex gap-1">
          <Link href={`/articles/styles/${style.id}`} className="flex-1">
            <Win95Button size="sm" className="w-full">
              View
            </Win95Button>
          </Link>
          <Link href={`/articles/styles/${style.id}/edit`}>
            <Win95Button size="sm">Edit</Win95Button>
          </Link>
          {onDelete && (
            <Win95Button size="sm" onClick={() => setDeleteOpen(true)}>
              Delete
            </Win95Button>
          )}
        </div>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Article Style"
        description={`Are you sure you want to delete "${style.name}"? This action cannot be undone.`}
      />
    </>
  );
}
