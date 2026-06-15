// Vega signals that implement mouse wheel-zoom + drag-pan for the spatial plots
// by driving the x/y scale domains. The same approach is used by the Trajectory
// Analysis plot. Because the tissue image and segmentation overlay are positioned
// with scale("x", ...) / scale("y", ...) and clipped to the plot area, zooming the
// domains zooms the already-loaded full image in place — smooth, with no tile
// refetch (so no flashing, and zooming out never blanks the slide).
//
// `boundsX` / `boundsY` are the stable full extent of the loaded image. Domains are
// clamped to them (span-preserving), so the most you can zoom out is the full slide.
//
// `domUpdates` emits the new [xdom, ydom] so the component can persist the view
// state across spec regenerations (e.g. when colours change).

// Span-preserving clamp of [lo, hi] into the [dom[0], dom[1]] bounds signal.
const clampWin = (lo, hi, dom) => {
  const bLo = `${dom}[0]`;
  const bHi = `${dom}[1]`;
  const sp = `min((${hi}) - (${lo}), ${bHi} - ${bLo})`;
  const start = `max(${bLo}, min((${lo}), ${bHi} - ${sp}))`;
  return `[${start}, ${start} + ${sp}]`;
};

const spatialZoomSignals = (initXdom, initYdom, boundsX, boundsY, interactive = true) => {
  // Non-interactive (mini previews): static domains with no wheel/drag handlers, so
  // the thumbnail never zooms or pans. A no-op `domUpdates` signal is kept so the
  // component's signalListener still attaches without "unrecognized signal" errors.
  if (!interactive) {
    return [
      { name: 'boundsX', value: boundsX },
      { name: 'boundsY', value: boundsY },
      { name: 'initXdom', value: initXdom },
      { name: 'initYdom', value: initYdom },
      { name: 'xdom', value: initXdom },
      { name: 'ydom', value: initYdom },
      { name: 'domUpdates' },
    ];
  }

  const xPanLo = 'xcur[0] + span(xcur) * delta[0] / width';
  const xPanHi = 'xcur[1] + span(xcur) * delta[0] / width';
  const yPanLo = 'ycur[0] + span(ycur) * delta[1] / height';
  const yPanHi = 'ycur[1] + span(ycur) * delta[1] / height';
  const xZoomLo = 'anchor[0] + (xdom[0] - anchor[0]) * zoom';
  const xZoomHi = 'anchor[0] + (xdom[1] - anchor[0]) * zoom';
  const yZoomLo = 'anchor[1] + (ydom[0] - anchor[1]) * zoom';
  const yZoomHi = 'anchor[1] + (ydom[1] - anchor[1]) * zoom';

  const xPan = clampWin(xPanLo, xPanHi, 'boundsX');
  const xZoomE = clampWin(xZoomLo, xZoomHi, 'boundsX');
  const yPan = clampWin(yPanLo, yPanHi, 'boundsY');
  const yZoomE = clampWin(yZoomLo, yZoomHi, 'boundsY');

  return [
    { name: 'boundsX', value: boundsX },
    { name: 'boundsY', value: boundsY },
    { name: 'initXdom', value: initXdom },
    { name: 'initYdom', value: initYdom },
    {
      name: 'down',
      value: null,
      on: [
        { events: 'mousedown', update: 'xy()' },
        { events: 'mouseup', update: 'null' },
      ],
    },
    {
      name: 'xcur',
      value: null,
      on: [{ events: 'mousedown', update: 'slice(xdom)' }],
    },
    {
      name: 'ycur',
      value: null,
      on: [{ events: 'mousedown', update: 'slice(ydom)' }],
    },
    {
      name: 'delta',
      value: [0, 0],
      on: [
        {
          events: [
            {
              source: 'window',
              type: 'mousemove',
              between: [
                { type: 'mousedown' },
                { source: 'window', type: 'mouseup' },
              ],
            },
          ],
          update: 'down ? [down[0]-x(), y()-down[1]] : [0,0]',
        },
      ],
    },
    {
      name: 'anchor',
      value: [0, 0],
      on: [{ events: 'wheel', update: "[invert('x', x()), invert('y', y())]" }],
    },
    {
      name: 'zoom',
      value: 1,
      on: [
        {
          events: 'wheel!',
          force: true,
          update: 'pow(1.001, event.deltaY * pow(2, event.deltaMode))',
        },
      ],
    },
    {
      name: 'xdom',
      update: 'initXdom',
      on: [
        { events: { signal: 'delta' }, update: xPan },
        { events: { signal: 'zoom' }, update: xZoomE },
      ],
    },
    {
      name: 'ydom',
      update: 'initYdom',
      on: [
        { events: { signal: 'delta' }, update: yPan },
        { events: { signal: 'zoom' }, update: yZoomE },
      ],
    },
    {
      name: 'domUpdates',
      on: [
        { events: { signal: 'delta' }, update: `[${xPan}, ${yPan}]` },
        { events: { signal: 'zoom' }, update: `[${xZoomE}, ${yZoomE}]` },
      ],
    },
  ];
};

export default spatialZoomSignals;
