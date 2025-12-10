'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Win95Window, Win95Button, Win95Badge } from '@/components/win95';
import { DeleteDialog } from '../delete-dialog';
import type { ArticleStyle } from '@/lib/types';
import { LANGUAGES } from '@/lib/constants';

// Build language flags map from constants
const LANGUAGE_FLAGS: Record<string, string> = LANGUAGES.reduce(
  (acc, lang) => ({ ...acc, [lang.code]: lang.flag }),
  {}
);

interface StyleCardWin95Props {
  style: ArticleStyle;
  onDelete?: (id: string) => Promise<void>;
}

export function StyleCardWin95({ style, onDelete }: StyleCardWin95Props) {
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
      <Win95Window title={style.name} icon={<span>📄</span>} showControls={false}>
        <div className="space-y-3">
          {/* Header Info */}
          <div className="win95-sunken p-2">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">📄</span>
              <div>
                <p className="text-[11px] font-bold">{style.name}</p>
                <p className="text-[10px] text-[var(--win95-button-shadow)]">
                  Created: {createdDate}
                </p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Win95Badge>
              {flag} {style.preferred_language.toUpperCase()}
            </Win95Badge>
            <Win95Badge>📅 {style.delivery_days.length} days</Win95Badge>
            <Win95Badge variant="outline">{style.subjects.length} topics</Win95Badge>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link href={`/articles/styles/${style.id}`} className="flex-1">
              <Win95Button className="w-full">View Details</Win95Button>
            </Link>
            <Link href={`/articles/styles/${style.id}/edit`}>
              <Win95Button>Edit</Win95Button>
            </Link>
            {onDelete && <Win95Button onClick={() => setDeleteOpen(true)}>Delete</Win95Button>}
          </div>
        </div>
      </Win95Window>

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
