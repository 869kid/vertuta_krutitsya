import { Slot } from '@models/slot.model';
import { createSlot } from '@reducers/Slots/Slots';

import type { VariantDto } from '@api/wheelHubApi';

/**
 * Builds a Slot tree from a flat array of server VariantDtos (adjacency list).
 * Root variants have parentId === null.
 */
export const variantsToSlots = (variants: VariantDto[]): Slot[] => {
  const byParent = new Map<number | null, VariantDto[]>();

  for (const v of variants) {
    const key = v.parentId;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(v);
  }

  const buildLevel = (parentId: number | null): Slot[] => {
    const children = byParent.get(parentId) ?? [];
    return children
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((v) => {
        const nested = v.isMultiLayer ? buildLevel(v.id) : undefined;
        return createSlot({
          id: v.clientId,
          name: v.name,
          amount: 1,
          owner: v.owner ?? undefined,
          isMultiLayer: v.isMultiLayer,
          children: nested ?? (v.isMultiLayer ? [] : undefined),
        });
      });
  };

  return buildLevel(null);
};

/**
 * Finds the server-side variant ID for a given client Slot.id.
 */
export const findVariantIdByClientId = (
  variants: VariantDto[],
  clientId: string,
): number | undefined => variants.find((v) => v.clientId === clientId)?.id;
