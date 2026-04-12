import { Slot, NavEntry } from '@models/slot.model';

export function getLotsAtPath(lots: Slot[], navStack: NavEntry[]): Slot[] {
  let current = lots;
  for (const nav of navStack) {
    const parent = current.find((l) => l.id === nav.slotId);
    if (parent && parent.children) {
      current = parent.children;
    } else {
      return [];
    }
  }
  return current;
}

export function navStackToParentPath(navStack: NavEntry[]): string[] {
  return navStack.map((n) => n.slotId);
}

export function removeLotByIdInTree(lots: Slot[], id: string, parentPath: string[] = []): Slot[] {
  if (parentPath.length === 0) {
    return lots.filter((l) => l.id !== id);
  }

  return lots.map((l) => {
    if (l.id === parentPath[0]) {
      return {
        ...l,
        children: removeLotByIdInTree(l.children ?? [], id, parentPath.slice(1)),
      };
    }
    return l;
  });
}

export function cleanEmptyMultiLayerLots(lots: Slot[]): Slot[] {
  return lots
    .map((l) => ({
      ...l,
      children: l.children ? cleanEmptyMultiLayerLots(l.children) : [],
    }))
    .filter((l) => !(l.isMultiLayer && (!l.children || l.children.length === 0)));
}

export function addLotToTree(lots: Slot[], parentPath: string[] = [], newSlot: Slot): Slot[] {
  if (parentPath.length === 0) {
    return [...lots, newSlot];
  }

  return lots.map((l) => {
    if (l.id === parentPath[0]) {
      return {
        ...l,
        children: addLotToTree(l.children ?? [], parentPath.slice(1), newSlot),
      };
    }
    return l;
  });
}

export function updateLotInTree(
  lots: Slot[],
  id: string,
  changes: Partial<Slot>,
  parentPath: string[] = [],
): Slot[] {
  if (parentPath.length === 0) {
    return lots.map((l) => {
      if (l.id === id) {
        const updated = { ...l, ...changes };
        if (changes.isMultiLayer === false) {
          updated.children = [];
        }
        return updated;
      }
      return l;
    });
  }

  return lots.map((l) => {
    if (l.id === parentPath[0]) {
      return {
        ...l,
        children: updateLotInTree(l.children ?? [], id, changes, parentPath.slice(1)),
      };
    }
    return l;
  });
}
