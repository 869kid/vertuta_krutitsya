import { describe, it, expect } from 'vitest';
import { Slot, NavEntry } from '@models/slot.model';
import {
  getLotsAtPath,
  navStackToParentPath,
  removeLotByIdInTree,
  cleanEmptyMultiLayerLots,
  addLotToTree,
  updateLotInTree,
  removeLotByIdDeep,
  addLotToParent,
} from '@utils/matryoshka.utils';

const makeSlot = (overrides: Partial<Slot> = {}): Slot => ({
  fastId: 0,
  id: overrides.id ?? Math.random().toString(),
  name: overrides.name ?? 'slot',
  amount: overrides.amount ?? 1,
  extra: null,
  investors: [],
  ...overrides,
});

const buildTree = () => {
  const child1 = makeSlot({ id: 'child-1', name: 'Child 1' });
  const child2 = makeSlot({ id: 'child-2', name: 'Child 2' });
  const grandchild = makeSlot({ id: 'grandchild-1', name: 'Grandchild 1' });
  const parent = makeSlot({
    id: 'parent-1',
    name: 'Parent 1',
    isMultiLayer: true,
    children: [
      child1,
      makeSlot({
        id: 'child-3',
        name: 'Child 3',
        isMultiLayer: true,
        children: [grandchild],
      }),
    ],
  });
  const sibling = makeSlot({ id: 'sibling-1', name: 'Sibling 1' });

  return { lots: [parent, sibling, child2], child1, child2, grandchild, parent, sibling };
};

describe('matryoshka.utils', () => {
  describe('getLotsAtPath', () => {
    it('returns root lots for empty navigation stack', () => {
      const { lots } = buildTree();
      expect(getLotsAtPath(lots, [])).toBe(lots);
    });

    it('returns children for valid single-level path', () => {
      const { lots, parent } = buildTree();
      const nav: NavEntry[] = [{ slotId: 'parent-1', slotName: 'Parent 1' }];
      expect(getLotsAtPath(lots, nav)).toBe(parent.children);
    });

    it('returns grandchildren for valid two-level path', () => {
      const { lots } = buildTree();
      const nav: NavEntry[] = [
        { slotId: 'parent-1', slotName: 'Parent 1' },
        { slotId: 'child-3', slotName: 'Child 3' },
      ];
      const result = getLotsAtPath(lots, nav);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('grandchild-1');
    });

    it('returns [] when slotId in stack does not exist', () => {
      const { lots } = buildTree();
      const nav: NavEntry[] = [{ slotId: 'nonexistent', slotName: '' }];
      expect(getLotsAtPath(lots, nav)).toEqual([]);
    });

    it('returns [] when path goes through a slot without children', () => {
      const { lots } = buildTree();
      const nav: NavEntry[] = [{ slotId: 'sibling-1', slotName: 'Sibling 1' }];
      expect(getLotsAtPath(lots, nav)).toEqual([]);
    });
  });

  describe('navStackToParentPath', () => {
    it('maps nav entries to slot ids', () => {
      const stack: NavEntry[] = [
        { slotId: 'a', slotName: 'A' },
        { slotId: 'b', slotName: 'B' },
      ];
      expect(navStackToParentPath(stack)).toEqual(['a', 'b']);
    });

    it('returns empty array for empty stack', () => {
      expect(navStackToParentPath([])).toEqual([]);
    });
  });

  describe('removeLotByIdInTree', () => {
    it('removes a root-level lot when parentPath is empty', () => {
      const { lots } = buildTree();
      const result = removeLotByIdInTree(lots, 'sibling-1');
      expect(result.find((l) => l.id === 'sibling-1')).toBeUndefined();
      expect(result).toHaveLength(lots.length - 1);
    });

    it('removes a nested lot via parentPath', () => {
      const { lots } = buildTree();
      const result = removeLotByIdInTree(lots, 'child-1', ['parent-1']);
      const parent = result.find((l) => l.id === 'parent-1')!;
      expect(parent.children!.find((c) => c.id === 'child-1')).toBeUndefined();
    });

    it('is a no-op when id does not exist', () => {
      const { lots } = buildTree();
      const result = removeLotByIdInTree(lots, 'nonexistent');
      expect(result).toHaveLength(lots.length);
    });

    it('does not mutate the original array', () => {
      const { lots } = buildTree();
      const original = [...lots];
      removeLotByIdInTree(lots, 'sibling-1');
      expect(lots).toEqual(original);
    });
  });

  describe('cleanEmptyMultiLayerLots', () => {
    it('removes isMultiLayer lots with no children', () => {
      const lots = [
        makeSlot({ id: 'a', isMultiLayer: true, children: [] }),
        makeSlot({ id: 'b', name: 'Regular' }),
      ];
      const result = cleanEmptyMultiLayerLots(lots);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b');
    });

    it('preserves isMultiLayer lots that have children', () => {
      const child = makeSlot({ id: 'c1' });
      const lots = [makeSlot({ id: 'a', isMultiLayer: true, children: [child] })];
      const result = cleanEmptyMultiLayerLots(lots);
      expect(result).toHaveLength(1);
    });

    it('recursively cleans nested empty multi-layer lots', () => {
      const inner = makeSlot({ id: 'inner', isMultiLayer: true, children: [] });
      const outer = makeSlot({ id: 'outer', isMultiLayer: true, children: [inner] });
      const result = cleanEmptyMultiLayerLots([outer]);
      // inner gets removed first, then outer becomes empty and gets removed
      expect(result).toHaveLength(0);
    });

    it('preserves regular lots without isMultiLayer', () => {
      const lots = [makeSlot({ id: 'a', isMultiLayer: false, children: [] })];
      const result = cleanEmptyMultiLayerLots(lots);
      expect(result).toHaveLength(1);
    });
  });

  describe('addLotToTree', () => {
    it('appends to root when parentPath is empty', () => {
      const lots = [makeSlot({ id: 'a' })];
      const newSlot = makeSlot({ id: 'new' });
      const result = addLotToTree(lots, [], newSlot);
      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('new');
    });

    it('appends to nested parent via parentPath', () => {
      const { lots } = buildTree();
      const newSlot = makeSlot({ id: 'new-child' });
      const result = addLotToTree(lots, ['parent-1'], newSlot);
      const parent = result.find((l) => l.id === 'parent-1')!;
      expect(parent.children!.at(-1)!.id).toBe('new-child');
    });

    it('creates children array if parent had undefined children', () => {
      const parent = makeSlot({ id: 'p', children: undefined });
      const newSlot = makeSlot({ id: 'c' });
      const result = addLotToTree([parent], ['p'], newSlot);
      expect(result[0].children).toHaveLength(1);
    });
  });

  describe('updateLotInTree', () => {
    it('updates a root-level lot by id without parentPath', () => {
      const lots = [makeSlot({ id: 'a', name: 'Old' })];
      const result = updateLotInTree(lots, 'a', { name: 'New' });
      expect(result[0].name).toBe('New');
    });

    it('updates a nested lot via parentPath', () => {
      const { lots } = buildTree();
      const result = updateLotInTree(lots, 'child-1', { name: 'Updated' }, ['parent-1']);
      const parent = result.find((l) => l.id === 'parent-1')!;
      expect(parent.children![0].name).toBe('Updated');
    });

    it('clears children when setting isMultiLayer to false', () => {
      const child = makeSlot({ id: 'c' });
      const lots = [makeSlot({ id: 'a', isMultiLayer: true, children: [child] })];
      const result = updateLotInTree(lots, 'a', { isMultiLayer: false });
      expect(result[0].children).toEqual([]);
    });

    it('performs deep DFS search when no parentPath is given', () => {
      const { lots } = buildTree();
      const result = updateLotInTree(lots, 'grandchild-1', { name: 'Deep Update' });
      const parent = result.find((l) => l.id === 'parent-1')!;
      const child3 = parent.children!.find((c) => c.id === 'child-3')!;
      expect(child3.children![0].name).toBe('Deep Update');
    });

    it('is a no-op when id is not found', () => {
      const lots = [makeSlot({ id: 'a', name: 'Same' })];
      const result = updateLotInTree(lots, 'nonexistent', { name: 'Changed' });
      expect(result[0].name).toBe('Same');
    });
  });

  describe('removeLotByIdDeep', () => {
    it('removes a root-level lot', () => {
      const { lots } = buildTree();
      const result = removeLotByIdDeep(lots, 'sibling-1');
      expect(result.find((l) => l.id === 'sibling-1')).toBeUndefined();
    });

    it('removes a deeply nested lot', () => {
      const { lots } = buildTree();
      const result = removeLotByIdDeep(lots, 'grandchild-1');
      const parent = result.find((l) => l.id === 'parent-1')!;
      const child3 = parent.children!.find((c) => c.id === 'child-3')!;
      expect(child3.children).toHaveLength(0);
    });

    it('is a no-op for nonexistent id', () => {
      const { lots } = buildTree();
      const result = removeLotByIdDeep(lots, 'nope');
      expect(result).toHaveLength(lots.length);
    });
  });

  describe('addLotToParent', () => {
    it('appends a child to the correct parent', () => {
      const { lots } = buildTree();
      const newSlot = makeSlot({ id: 'new-kid' });
      const result = addLotToParent(lots, 'parent-1', newSlot);
      const parent = result.find((l) => l.id === 'parent-1')!;
      expect(parent.children!.at(-1)!.id).toBe('new-kid');
    });

    it('appends to a deeply nested parent', () => {
      const { lots } = buildTree();
      const newSlot = makeSlot({ id: 'deep-kid' });
      const result = addLotToParent(lots, 'child-3', newSlot);
      const parent = result.find((l) => l.id === 'parent-1')!;
      const child3 = parent.children!.find((c) => c.id === 'child-3')!;
      expect(child3.children!.at(-1)!.id).toBe('deep-kid');
    });

    it('returns unchanged tree when parentId is not found', () => {
      const lots = [makeSlot({ id: 'a' })];
      const newSlot = makeSlot({ id: 'orphan' });
      const result = addLotToParent(lots, 'nonexistent', newSlot);
      expect(result).toHaveLength(1);
      expect(result[0].children).toBeUndefined();
    });
  });
});
