// Due to a bug with dynamic imports and webpack, we need to create
// a wrapper component to import the Scatterplot and Heatmap components.
// See https://github.com/webpack/webpack/issues/13865
import { Heatmap } from '@vitessce/heatmap';
import { Scatterplot } from '@vitessce/scatterplot';
import { Spatial } from '@vitessce/spatial';

export {
  Heatmap, Scatterplot, Spatial,
};
