// Categorical palette for spatial-molecule genes (Glasbey, 31 colours).
//
// Colour is assigned in the UI (not baked by the pipeline). resolveGeneColors
// allocates the first available palette colour per selected gene, so a user can
// always override an individual gene via the colour picker. The Spatial Molecules
// plot caps selection at MAX_MOLECULE_GENES (15), well under the palette length.
export const MOLECULE_PALETTE = [
  '#0000FF', '#FF0000', '#00FF00', '#FF00B6', '#005300',
  '#FFD300', '#009FFF', '#9A4D42', '#00FFBE', '#783FC1', '#1F9698',
  '#FFACFD', '#B1CC71', '#F1085C', '#FE8F42', '#DD00FF', '#201A01',
  '#720055', '#766C95', '#02AD24', '#C8FF00', '#886C00', '#FFB79F',
  '#858567', '#A10300', '#14F9FF', '#00479E', '#DC5E93', '#93D4FF',
  '#004CFF', '#F2F318',
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
