// Identifies which Data Exploration plot the current cell hover originated from,
// stored alongside the shared cellInfo state. The hovered plot shows the full
// cell-info tooltip; linked plots still react to the shared cellInfo (embedding
// and spatial keep drawing the crosshair on the matching cell) but suppress
// their own tooltip, so it doesn't pop up over a plot the cursor isn't on.
const HOVER_SOURCE = {
  embedding: 'embedding',
  spatial: 'spatial',
  heatmap: 'heatmap',
};

export default HOVER_SOURCE;
