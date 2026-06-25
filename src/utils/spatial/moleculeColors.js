// Categorical palette for spatial-molecule genes.
//
// Colour is assigned in the UI (not baked by the pipeline). resolveGeneColors
// allocates the first available palette colour per selected gene, so a user can
// always override an individual gene via the colour picker. The Spatial Molecules
// plot caps selection at MAX_MOLECULE_GENES (15), well under the palette length.
export const MOLECULE_PALETTE = [
  '#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4',
  '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000',
  '#aaffc3', '#808000', '#ffd8b1',
];

// Fallback when more genes are plotted than the palette has colours (shouldn't
// happen given MAX_MOLECULE_GENES < palette length, but keep it defined).
const FALLBACK_COLOUR = '#cccccc';

// Resolve a colour for every selected gene by taking the FIRST AVAILABLE palette
// colour (gap-fill), in selection order:
//   - an existing colour (geneColors[gene], truthy) wins and reserves its slot — a
//     persisted/seeded colour or an explicit picker override (null means "no
//     colour", e.g. a removed gene, and is ignored);
//   - every other gene takes the lowest-index palette colour not already in use.
// Because seeded colours are persisted (and so reserved), appending a gene never
// recolours the others; and when a gene is removed its colour is freed, so the next
// gene added reclaims it (first available).
export const resolveGeneColors = (selectedGenes = [], geneColors = {}) => {
  const used = new Set();
  selectedGenes.forEach((gene) => {
    if (geneColors[gene]) used.add(geneColors[gene]);
  });

  const colors = {};
  selectedGenes.forEach((gene) => {
    if (geneColors[gene]) {
      colors[gene] = geneColors[gene];
      return;
    }
    const next = MOLECULE_PALETTE.find((c) => !used.has(c)) ?? FALLBACK_COLOUR;
    used.add(next);
    colors[gene] = next;
  });
  return colors;
};

// Maximum number of genes plotted at once in the Spatial Molecules plot.
export const MAX_MOLECULE_GENES = 15;
