'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Eye,
  Settings,
  Ban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { AdminOrgView, PaginatedResult } from '@/lib/types';
import Link from 'next/link';

interface OrgTableProps {
  data: PaginatedResult<AdminOrgView>;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onEdit?: (orgId: string) => void;
  onDeactivate?: (orgId: string) => void;
  loading?: boolean;
}

export function OrgTable({
  data,
  onSearch,
  onPageChange,
  onEdit,
  onDeactivate,
  loading,
}: OrgTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Admins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No organizations found
                </TableCell>
              </TableRow>
            ) : (
              data.data.map(org => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {org.name.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{org.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                  <TableCell>{org.member_count}</TableCell>
                  <TableCell>{org.admin_count}</TableCell>
                  <TableCell>
                    <Badge variant={org.is_active ? 'default' : 'secondary'}>
                      {org.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/admin/organizations/${org.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => onEdit?.(org.id)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeactivate?.(org.id)}
                          className="text-destructive"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {org.is_active ? 'Deactivate' : 'Reactivate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(data.page - 1) * data.page_size + 1} to{' '}
          {Math.min(data.page * data.page_size, data.total)} of {data.total} organizations
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.page - 1)}
            disabled={data.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.page + 1)}
            disabled={data.page >= data.total_pages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
