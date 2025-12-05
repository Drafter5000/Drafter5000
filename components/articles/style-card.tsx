'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteDialog } from './delete-dialog';
import { FileText, Calendar, Globe, Pencil, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      <Card className="group hover:border-primary/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold line-clamp-1">{style.name}</h3>
                <p className="text-xs text-muted-foreground">{createdDate}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/articles/styles/${style.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              {flag} {style.preferred_language.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {style.delivery_days.length} days
            </Badge>
            <Badge variant="outline">{style.subjects.length} topics</Badge>
          </div>
          <div className="mt-4">
            <Link href={`/articles/styles/${style.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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
