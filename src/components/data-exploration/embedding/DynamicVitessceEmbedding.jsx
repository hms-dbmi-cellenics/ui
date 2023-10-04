// Due to a bug with dynamic imports and webpack, we need to create
// a wrapper component to import the Scatterplot component.
// See https://github.com/webpack/webpack/issues/13865
import { Scatterplot } from '@vitessce/scatterplot';

export default Scatterplot;