import {
  MOLECULE_PALETTE, resolveGeneColors, MAX_MOLECULE_GENES,
} from 'utils/spatial/moleculeColors';

describe('resolveGeneColors', () => {
  it('allocates the first available palette colours in order', () => {
    expect(resolveGeneColors(['A', 'B', 'C'], {})).toEqual({
      A: MOLECULE_PALETTE[0],
      B: MOLECULE_PALETTE[1],
      C: MOLECULE_PALETTE[2],
    });
  });

  it('reserves existing/override colours so auto-genes skip them', () => {
    const colors = resolveGeneColors(['A', 'B', 'C'], { B: MOLECULE_PALETTE[0] });
    expect(colors).toEqual({
      A: MOLECULE_PALETTE[1],
      B: MOLECULE_PALETTE[0],
      C: MOLECULE_PALETTE[2],
    });
    expect(new Set(Object.values(colors)).size).toBe(3);
  });

  it('does not recolour existing genes when a new one is appended', () => {
    // existing genes carry persisted (reserved) colours
    const existing = { A: MOLECULE_PALETTE[0], B: MOLECULE_PALETTE[1] };
    const after = resolveGeneColors(['A', 'B', 'C'], existing);
    expect(after.A).toBe(MOLECULE_PALETTE[0]);
    expect(after.B).toBe(MOLECULE_PALETTE[1]);
    expect(after.C).toBe(MOLECULE_PALETTE[2]);
  });

  it('reuses a freed colour: removing a gene then adding another grabs the first available', () => {
    // A,B,C seeded to palette[0,1,2]; remove B (its colour freed), add D
    const afterRemoveB = { A: MOLECULE_PALETTE[0], C: MOLECULE_PALETTE[2] };
    const colors = resolveGeneColors(['A', 'C', 'D'], afterRemoveB);
    // D takes palette[1] — the first available (B's freed slot), not palette[3]
    expect(colors.D).toBe(MOLECULE_PALETTE[1]);
  });

  it('treats a null entry as "no override" and allocates a colour (removed-gene sentinel)', () => {
    // removeGene nulls the key (the config reducer can't delete it); null must not
    // be treated as an override or reserved.
    expect(resolveGeneColors(['A', 'B'], { A: null })).toEqual({
      A: MOLECULE_PALETTE[0],
      B: MOLECULE_PALETTE[1],
    });
  });

  it('keeps every allocated colour distinct up to the gene cap', () => {
    const genes = Array.from({ length: MAX_MOLECULE_GENES }, (_, i) => `g${i}`);
    const colors = resolveGeneColors(genes, {});
    expect(new Set(Object.values(colors)).size).toBe(MAX_MOLECULE_GENES);
  });
});
