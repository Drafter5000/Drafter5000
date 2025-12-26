'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Loader2,
  Save,
  Mail,
  MapPin,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  GripVertical,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BusinessHours {
  id: string;
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface CategoryOptions {
  email: string[];
}

interface ContactSettings {
  email: string;
  emailEnabled: boolean;
  location: string;
  locationEnabled: boolean;
  businessHours: BusinessHours[];
  businessHoursEnabled: boolean;
  categories: CategoryOptions;
}

const defaultBusinessHours: BusinessHours[] = [
  { id: '1', day: 'Monday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '2', day: 'Tuesday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '3', day: 'Wednesday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '4', day: 'Thursday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '5', day: 'Friday', openTime: '09:00', closeTime: '18:00', isClosed: false },
  { id: '6', day: 'Saturday', openTime: '10:00', closeTime: '14:00', isClosed: true },
  { id: '7', day: 'Sunday', openTime: '10:00', closeTime: '14:00', isClosed: true },
];

const defaultCategories: CategoryOptions = {
  email: ['general', 'support', 'sales', 'billing', 'partnerships'],
};

const defaultSettings: ContactSettings = {
  email: 'support@example.com',
  emailEnabled: true,
  location: '123 Business Street\nSan Francisco, CA 94102',
  locationEnabled: true,
  businessHours: defaultBusinessHours,
  businessHoursEnabled: true,
  categories: defaultCategories,
};

export function ContactSettingsForm() {
  const [settings, setSettings] = useState<ContactSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Category management state
  const [editingCategory, setEditingCategory] = useState<{
    index: number;
    value: string;
  } | null>(null);
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    index: number;
    category: string;
  } | null>(null);

  // Drag state for categories
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/contact-settings');
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings({
              ...defaultSettings,
              ...data.settings,
              categories: data.settings.categories || defaultCategories,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching contact settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/contact-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save contact settings');
      setMessage({ type: 'success', text: 'Contact settings saved successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save contact settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (id: string, field: keyof BusinessHours, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      businessHours: prev.businessHours.map(h => (h.id === id ? { ...h, [field]: value } : h)),
    }));
  };

  // Category management functions
  const addCategory = (value: string) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed || settings.categories.email.includes(trimmed)) return;

    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        email: [...prev.categories.email, trimmed],
      },
    }));
    setNewCategory(null);
  };

  const updateCategory = (index: number, newValue: string) => {
    const trimmed = newValue.trim().toLowerCase();
    if (!trimmed) return;

    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        email: prev.categories.email.map((cat, i) => (i === index ? trimmed : cat)),
      },
    }));
    setEditingCategory(null);
  };

  const deleteCategory = (index: number) => {
    setSettings(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        email: prev.categories.email.filter((_, i) => i !== index),
      },
    }));
    setDeleteDialog(null);
  };

  // Drag and drop handlers for categories
  const handleCategoryDragStart = (index: number) => {
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;

    setSettings(prev => {
      const newCategories = [...prev.categories.email];
      const draggedItem = newCategories[draggedCategoryIndex];
      newCategories.splice(draggedCategoryIndex, 1);
      newCategories.splice(index, 0, draggedItem);

      setDraggedCategoryIndex(index);

      return {
        ...prev,
        categories: {
          ...prev.categories,
          email: newCategories,
        },
      };
    });
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategoryIndex(null);
  };

  const renderCategoryManager = (disabled: boolean) => (
    <div className="space-y-2">
      {settings.categories.email.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No categories added yet</p>
      ) : (
        settings.categories.email.map((cat, index) => (
          <div
            key={`email-${index}-${cat}`}
            draggable={!disabled && editingCategory === null}
            onDragStart={() => handleCategoryDragStart(index)}
            onDragOver={e => handleCategoryDragOver(e, index)}
            onDragEnd={handleCategoryDragEnd}
            className={`flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
              disabled ? 'opacity-50' : 'cursor-move'
            } ${draggedCategoryIndex === index ? 'opacity-50' : ''}`}
          >
            {!disabled && (
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
            )}

            {editingCategory?.index === index ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  updateCategory(index, editingCategory.value);
                }}
                className="flex-1 flex items-center gap-2"
              >
                <Input
                  value={editingCategory.value}
                  onChange={e => setEditingCategory({ ...editingCategory, value: e.target.value })}
                  className="h-8 flex-1"
                  autoFocus
                />
                <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditingCategory(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                {!disabled && (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingCategory({ index, value: cat })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteDialog({ index, category: cat })}
                      disabled={settings.categories.email.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))
      )}

      {/* Add new category */}
      {newCategory !== null ? (
        <form
          onSubmit={e => {
            e.preventDefault();
            addCategory(newCategory);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Enter category name..."
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={!newCategory.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setNewCategory(null)}>
            <X className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        !disabled && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setNewCategory('')}
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        )
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Email Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-36" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <Skeleton className="h-4 w-80 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>

        {/* Business Hours Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-11 rounded-full" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-600'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Contact Email</CardTitle>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={checked => setSettings({ ...settings, emailEnabled: checked })}
            />
          </div>
          <CardDescription>
            Configure the contact email displayed on the contact page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={e => setSettings({ ...settings, email: e.target.value })}
                placeholder="support@example.com"
                disabled={!settings.emailEnabled}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Categories</Label>
                <span className="text-xs text-muted-foreground">Drag to reorder</span>
              </div>
              {renderCategoryManager(!settings.emailEnabled)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Business Location</CardTitle>
            </div>
            <Switch
              checked={settings.locationEnabled}
              onCheckedChange={checked => setSettings({ ...settings, locationEnabled: checked })}
            />
          </div>
          <CardDescription>
            Configure the business address displayed on the contact page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="location">Address</Label>
          <textarea
            id="location"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={settings.location}
            onChange={e => setSettings({ ...settings, location: e.target.value })}
            placeholder="123 Business Street&#10;City, State ZIP"
            disabled={!settings.locationEnabled}
          />
        </CardContent>
      </Card>

      {/* Business Hours Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Business Hours</CardTitle>
            </div>
            <Switch
              checked={settings.businessHoursEnabled}
              onCheckedChange={checked =>
                setSettings({ ...settings, businessHoursEnabled: checked })
              }
            />
          </div>
          <CardDescription>Configure business hours displayed on the contact page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.businessHours.map(hours => (
            <div
              key={hours.id}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                hours.isClosed ? 'bg-muted/50' : ''
              } ${!settings.businessHoursEnabled ? 'opacity-50' : ''}`}
            >
              <div className="w-24 font-medium text-sm">{hours.day}</div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!hours.isClosed}
                  onCheckedChange={checked => updateBusinessHours(hours.id, 'isClosed', !checked)}
                  disabled={!settings.businessHoursEnabled}
                />
                <span className="text-sm text-muted-foreground w-12">
                  {hours.isClosed ? 'Closed' : 'Open'}
                </span>
              </div>
              {!hours.isClosed && (
                <>
                  <Input
                    type="time"
                    value={hours.openTime}
                    onChange={e => updateBusinessHours(hours.id, 'openTime', e.target.value)}
                    className="w-28"
                    disabled={!settings.businessHoursEnabled}
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={hours.closeTime}
                    onChange={e => updateBusinessHours(hours.id, 'closeTime', e.target.value)}
                    className="w-28"
                    disabled={!settings.businessHoursEnabled}
                  />
                </>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Contact Settings
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the &quot;{deleteDialog?.category}&quot; category?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && deleteCategory(deleteDialog.index)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
