'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { PlanFeature } from '@/lib/types';

interface PlanFeatureManagerProps {
  planId: string;
  features: PlanFeature[];
  onFeaturesChange: (features: PlanFeature[]) => void;
}

export function PlanFeatureManager({
  planId,
  features,
  onFeaturesChange,
}: PlanFeatureManagerProps) {
  const { toast } = useToast();
  const [newFeatureText, setNewFeatureText] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [addingFeature, setAddingFeature] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddFeature = async () => {
    if (!newFeatureText.trim()) return;

    setAddingFeature(true);
    try {
      const res = await fetch(`/api/admin/plans/${planId}/features`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_text: newFeatureText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add feature');
      }

      const data = await res.json();
      onFeaturesChange([...features, data.feature]);
      setNewFeatureText('');

      toast({
        title: 'Feature added',
        description: 'The feature has been added to the plan',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add feature';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAddingFeature(false);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    setLoading(featureId);
    try {
      const res = await fetch(`/api/admin/plans/${planId}/features/${featureId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete feature');
      }

      onFeaturesChange(features.filter(f => f.id !== featureId));

      toast({
        title: 'Feature deleted',
        description: 'The feature has been removed from the plan',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete feature';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFeatures = [...features];
    const draggedFeature = newFeatures[draggedIndex];
    newFeatures.splice(draggedIndex, 1);
    newFeatures.splice(index, 0, draggedFeature);

    setDraggedIndex(index);
    onFeaturesChange(newFeatures);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    setDraggedIndex(null);

    // Save new order to server
    try {
      const featureIds = features.map(f => f.id);
      const res = await fetch(`/api/admin/plans/${planId}/features/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_ids: featureIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reorder features');
      }

      toast({
        title: 'Order saved',
        description: 'Feature order has been updated',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save order';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Features</CardTitle>
        <CardDescription>
          Manage the features displayed for this plan. Drag to reorder.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Feature List */}
        <div className="space-y-2">
          {features.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No features added yet</p>
          ) : (
            features.map((feature, index) => (
              <div
                key={feature.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-move transition-colors ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 text-sm">{feature.feature_text}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFeature(feature.id)}
                  disabled={loading === feature.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {loading === feature.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Add Feature */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter feature text..."
            value={newFeatureText}
            onChange={e => setNewFeatureText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFeature();
              }
            }}
          />
          <Button onClick={handleAddFeature} disabled={!newFeatureText.trim() || addingFeature}>
            {addingFeature ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
