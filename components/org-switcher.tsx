'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { OrganizationWithRole } from '@/lib/types';

interface OrgSwitcherProps {
  currentOrgId: string | null;
  organizations: OrganizationWithRole[];
  onSwitch: (orgId: string) => Promise<void>;
  disabled?: boolean;
}

export function OrgSwitcher({
  currentOrgId,
  organizations,
  onSwitch,
  disabled = false,
}: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Don't render if user has only one organization
  if (organizations.length <= 1) {
    return null;
  }

  const currentOrg = organizations.find(org => org.id === currentOrgId);

  const handleSelect = async (orgId: string) => {
    if (orgId === currentOrgId) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      await onSwitch(orgId);
      setOpen(false);
    } catch (error) {
      console.error('Failed to switch organization:', error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select organization"
          className="w-[200px] justify-between"
          disabled={disabled || switching}
        >
          <Building2 className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{currentOrg?.name || 'Select organization'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search organization..." />
          <CommandList>
            <CommandEmpty>No organization found.</CommandEmpty>
            <CommandGroup>
              {organizations.map(org => (
                <CommandItem
                  key={org.id}
                  value={org.name}
                  onSelect={() => handleSelect(org.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      currentOrgId === org.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="truncate">{org.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {org.role.replace('_', ' ')}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
