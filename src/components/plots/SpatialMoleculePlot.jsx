import React, {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
import PropTypes from 'prop-types';
import { Empty, Dropdown, Button } from 'antd';
import { saveAs } from 'file-saver';
import _ from 'lodash';

import { OrthographicView, OrthographicViewport, COORDINATE_SYSTEM } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';

import { loadCellSets } from 'redux/actions/cellSets';
import loadGeneList from 'redux/actions/genes/loadGeneList';
import getHighestDispersionGenes from 'utils/getHighestDispersionGenes';
import { getCellSets } from 'redux/selectors';
import { filterCells } from 'utils/plotSpecs/generateSpatialFeatureSpec';
import { getSampleFileUrls } from 'utils/data-management/downloadSampleFile';
import loadMoleculeNodes, { loadMoleculeMeta } from 'utils/spatial/loadMoleculeNodes';
import { resolveGeneColors } from 'utils/spatial/moleculeColors';
import ZipFileStore from 'components/data-exploration/spatial/ZipFileStore';
import parseColor from 'components/data-exploration/parseColor';
import {
  BITMASK_LUT_SIZE,
  makeBitmaskLayer,
} from 'components/data-exploration/spatial/bitmaskLayers';
import { loadOmeZarrGrid } from 'components/data-exploration/spatial/loadOmeZarr';
import {
  niceTicks, formatTick, isDarkColor, chromeToSvg, drawChromeToCanvas,
} from 'utils/spatial/deckPlotChrome';
import { root as zarrRoot } from 'zarrita';

import PlatformError from '../PlatformError';
import Loader from '../Loader';

// Default number of genes to show when none are selected — a molecule plot over
// ALL genes (hundreds) would read the whole root tile, so (like the other gene
// plots) we start from a small set the user can edit.
const DEFAULT_GENE_COUNT = 5;

// Default segmentation-outline colour/opacity + fallback molecule colour.
const SEG_GREY = [200, 200, 200];
const SEG_OUTLINE_COLOUR = '#CECBCB';
const SEG_OUTLINE_OPACITY = 0.05;

// Gap between the legend and the plot (Vega's default legend offset is ~18; a touch
// more reads better against the dense point cloud).
const LEGEND_PAD = 24;

// deck.gl is client-only (WebGL); load it dynamically with SSR disabled.
const DeckGL = dynamic(() => import('@deck.gl/react').then((mod) => mod.DeckGL), { ssr: false });

// Build the RGBA LUT (indexed by cellId+1, the bitmask pixel value) for the filtered
// cells of the selected sample — every visible cell renders the given flat colour.
const buildSegLUT = (cellIds, [r, g, b]) => {
  const lut = new Uint8Array(BITMASK_LUT_SIZE * BITMASK_LUT_SIZE * 4);
  cellIds.forEach((cellId) => {
    const pixelValue = Number(cellId) + 1;
    if (pixelValue <= 0 || pixelValue >= BITMASK_LUT_SIZE * BITMASK_LUT_SIZE) return;
    lut[pixelValue * 4] = r;
    lut[pixelValue * 4 + 1] = g;
    lut[pixelValue * 4 + 2] = b;
    lut[pixelValue * 4 + 3] = 255;
  });
  return lut;
};

// Fit an OrthographicView to a micron bbox. Uses INDEPENDENT x/y zoom so the data
// fills the whole plot box (the same stretch-to-dimensions effect as the Vega
// spatial plots) instead of preserving the data aspect ratio.
const fitBboxToView = (bbox, width, height) => {
  const [x0, y0, x1, y1] = bbox;
  if (![x0, y0, x1, y1].every(Number.isFinite) || !width || !height) return null;
  const extentX = Math.max(x1 - x0, 1);
  const extentY = Math.max(y1 - y0, 1);
  return {
    target: [(x0 + x1) / 2, (y0 + y1) / 2, 0],
    zoom: [Math.log2(width / extentX), Math.log2(height / extentY)],
  };
};

const zoomComponents = (zoom) => (Array.isArray(zoom) ? zoom : [zoom, zoom]);

const SpatialMoleculePlot = (props) => {
  const {
    experimentId, config, onZoomChange, onSampleDefault, onDefaultGenes, onDefaultColors,
  } = props;

  const dispatch = useDispatch();

  const onSampleDefaultRef = useRef(onSampleDefault);
  onSampleDefaultRef.current = onSampleDefault;
  const onDefaultGenesRef = useRef(onDefaultGenes);
  onDefaultGenesRef.current = onDefaultGenes;
  const onDefaultColorsRef = useRef(onDefaultColors);
  onDefaultColorsRef.current = onDefaultColors;
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;
  // Only auto-pick default genes ONCE per artifact — respect a user who clears them.
  const defaultGenesAppliedRef = useRef(false);

  const cellSets = useSelector(getCellSets());

  const sampleIdsForFileUrls = useSelector((state) => state.experimentSettings.info.sampleIds);
  const obj2sStatusRaw = useSelector(
    (state) => state.backendStatus[experimentId]?.status?.obj2s?.status,
  );
  const isObj2s = !_.isNil(obj2sStatusRaw) && obj2sStatusRaw !== 'NOT_CREATED';

  // { geneName: { dispersions } } — used to pick the default genes by dispersion.
  const geneData = useSelector((state) => state.genes?.properties?.data) || {};

  const [moleculeUrls, setMoleculeUrls] = useState(null);
  const [segmentationZarrUrls, setSegmentationZarrUrls] = useState(null);
  const [selectedSample, setSelectedSample] = useState();
  const [moleculeMeta, setMoleculeMeta] = useState(null);
  // { positions: Float32Array(n*2), colors: Uint8Array(n*3), count } for the
  // ScatterplotLayer — typed-array binary attributes, no per-point objects.
  const [moleculePoints, setMoleculePoints] = useState(null);
  const [moleculesError, setMoleculesError] = useState(false);
  const [segLoader, setSegLoader] = useState(null);
  const [viewState, setViewState] = useState(null);
  // briefly drops the molecule layer so the SVG export can snapshot an outline-only
  // raster backdrop (the molecules are re-added as crisp vector circles on top).
  const [hideMoleculesForExport, setHideMoleculesForExport] = useState(false);

  const width = config?.dimensions?.width ?? 500;
  const height = config?.dimensions?.height ?? 500;
  const isMiniPlot = Boolean(config?.miniPlot);

  // one ZipFileStore per artifact url, lazily reused across loads
  const storesRef = useRef(new Map());
  // the current visible data region in MICRONS (dimension-independent). Updated on
  // every gesture; on a dimension change we re-fit THIS region to the new plot box
  // instead of resetting to the full extent (so the zoom survives a resize). Null =
  // no region yet (fresh sample) → fall back to the full-extent fit.
  const viewBboxRef = useRef(null);
  // container of the whole plot (deck canvas + chrome) — read for the export snapshot
  const containerRef = useRef(null);

  // ── Styling derived from the plot config (reproduces the Vega controls) ──────
  const styling = useMemo(() => {
    const axes = config?.axes ?? {};
    const font = config?.fontStyle?.font ?? 'sans-serif';
    // colour inversion: toggleInvert is the plot background; text/axes flip on dark.
    const background = config?.colour?.toggleInvert ?? '#FFFFFF';
    const dark = isDarkColor(background);
    const fontColour = dark ? '#FFFFFF' : (config?.fontStyle?.colour ?? '#000000');
    const legend = config?.legend ?? {};
    return {
      font,
      background,
      fontColour,
      title: {
        text: config?.title?.text ?? '',
        fontSize: config?.title?.fontSize ?? 15,
        anchor: config?.title?.anchor ?? 'start',
        dx: config?.title?.dx ?? 10,
      },
      axes: {
        xTitle: axes.xAxisText ?? '',
        yTitle: axes.yAxisText ?? '',
        titleFontSize: axes.titleFontSize ?? 13,
        labelFontSize: axes.labelFontSize ?? 12,
        xLabels: axes.xAxisLabels ?? true,
        yLabels: axes.yAxisLabels ?? true,
        rotateX: axes.xAxisRotateLabels ?? false,
        gridOpacity: axes.gridOpacity ?? 0,
        domainWidth: axes.domainWidth ?? 1,
      },
      marker: {
        // marker.size → point radius in px (1:1; default 0.4, range 0.1–10).
        radius: config?.marker?.size ?? 0.4,
        // Vega marker.opacity is a 0–10 slider → 0–1 layer opacity.
        opacity: Math.min(1, Math.max(0.05, (config?.marker?.opacity ?? 8) / 10)),
      },
      legend: {
        enabled: legend.enabled ?? true,
        position: ['top', 'bottom', 'left', 'right'].includes(legend.position)
          ? legend.position : 'bottom',
        title: legend.title ?? '',
        titleFontSize: legend.titleFontSize ?? 12,
        labelFontSize: legend.labelFontSize ?? 11,
      },
    };
  }, [config?.axes, config?.fontStyle, config?.colour, config?.title,
    config?.marker, config?.legend]);

  const deckglView = useMemo(() => new OrthographicView({ id: 'molecules', controller: true }), []);

  // ── Legend entries (gene → resolved colour) ─────────────────────────────────
  // Colours are allocated in order without reuse (resolveGeneColors); a per-gene
  // config override wins. Same resolution the scatter fill + seeding use, so the
  // legend matches the points even before defaults are persisted.
  const legendItems = useMemo(() => {
    const selected = config?.selectedGenes ?? [];
    const colors = resolveGeneColors(selected, config?.geneColors ?? {});
    return selected.map((gene) => ({ gene, color: colors[gene] }));
  }, [config?.selectedGenes, config?.geneColors]);

  // ── Layout ──────────────────────────────────────────────────────────────────
  // `dimensions` (width/height) sizes the PLOTTING AREA only — the deck canvas — to
  // match the Vega spatial plots. Axes / title / legend are added as margins AROUND
  // it, so the rendered container is larger than `dimensions`.
  const layout = useMemo(() => {
    if (isMiniPlot) {
      return {
        left: 0,
        top: 0,
        innerW: width,
        innerH: height,
        containerW: width,
        containerH: height,
        legendShown: false,
        axesShown: false,
      };
    }
    const a = styling.axes;
    const lp = styling.legend.position;
    const hasTitle = styling.title.text.length > 0;
    const legendShown = styling.legend.enabled && legendItems.length > 0;
    const vertical = lp === 'left' || lp === 'right';
    const titleH = hasTitle ? styling.title.fontSize + 12 : 0;
    // horizontal (top/bottom) legend → row height; vertical (left/right) → column width
    const legendH = legendShown && !vertical
      ? Math.max(styling.legend.labelFontSize, 12)
        + (styling.legend.title ? styling.legend.titleFontSize + 4 : 0) + LEGEND_PAD
      : 0;
    const longestName = legendItems.reduce((m, { gene }) => Math.max(m, gene.length), 0);
    const swatch = Math.max(8, styling.legend.labelFontSize);
    const legendW = legendShown && vertical
      ? swatch + 8 + longestName * styling.legend.labelFontSize * 0.6 + LEGEND_PAD
      : 0;
    const axisLeft = a.yLabels ? 56 : (a.yTitle ? 22 : 8);
    const bottomAxis = a.xLabels ? 38 : (a.xTitle ? 22 : 8);
    const left = axisLeft + (lp === 'left' ? legendW : 0);
    const right = 8 + (lp === 'right' ? legendW : 0);
    const top = titleH + (lp === 'top' ? legendH : 0) + 8;
    const bottom = bottomAxis + (lp === 'bottom' ? legendH : 0);
    // inner plot area = the configured dimensions; the container grows by the margins
    return {
      left,
      top,
      right,
      bottom,
      titleH,
      legendH,
      legendW,
      axisLeftH: axisLeft, // y-axis gutter width (labels + title), excluding any legend
      axisBottomH: bottomAxis, // x-axis gutter height, excluding any legend
      legendShown,
      axesShown: true,
      innerW: width,
      innerH: height,
      containerW: width + left + right,
      containerH: height + top + bottom,
    };
  }, [styling, legendItems, width, height, isMiniPlot]);

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
    // gene dispersions power the default selection (top-N dispersion genes), like
    // the dot-plot / marker-heatmap. Loads into state.genes.properties.data.
    dispatch(loadGeneList(experimentId));
  }, [experimentId]);

  // ── Fetch molecule artifact URLs ─────────────────────────────────────────────
  useEffect(() => {
    if (!sampleIdsForFileUrls?.length) return;
    (async () => {
      try {
        const results = await Promise.all(
          // molecules_by_gene is built for every Xenium sample (transcripts.parquet
          // is a required input).
          sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'molecules_by_gene')),
        );
        setMoleculeUrls(results.map((sampleUrls, i) => ({
          url: sampleUrls?.[0]?.url ?? null,
          sampleId: isObj2s
            ? (sampleUrls?.[0]?.fileId ?? sampleIdsForFileUrls[i])
            : sampleIdsForFileUrls[i],
        })));
      } catch (e) {
        console.error('[SpatialMoleculePlot] molecule URL fetch error:', e);
        setMoleculeUrls([]);
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  // ── Fetch segmentation OME-Zarr URLs (the grey backdrop) ────────────────────
  useEffect(() => {
    if (!sampleIdsForFileUrls?.length) return;
    (async () => {
      try {
        const results = (await Promise.all(
          sampleIdsForFileUrls.map((sampleId) => getSampleFileUrls(experimentId, sampleId, 'segmentations_ome_zarr_zip')),
        )).flat();

        setSegmentationZarrUrls(results.map(({ url, fileId }, i) => ({
          url,
          sampleId: isObj2s ? fileId : sampleIdsForFileUrls[i],
        })));
      } catch (_e) {
        console.info('[SpatialMoleculePlot] segmentations_ome_zarr_zip not available');
        setSegmentationZarrUrls([]); // empty = confirmed unavailable
      }
    })();
  }, [sampleIdsForFileUrls, experimentId, isObj2s]);

  // ── Default selected sample ─────────────────────────────────────────────────
  useEffect(() => {
    if (!moleculeUrls || !config) return;
    if (config.selectedSample) {
      setSelectedSample(config.selectedSample);
    } else {
      const def = moleculeUrls[0]?.sampleId;
      if (!def) return;
      setSelectedSample(def);
      onSampleDefaultRef.current(def);
    }
  }, [config, moleculeUrls]);

  const moleculesUrl = useMemo(
    () => moleculeUrls?.find(({ sampleId }) => sampleId === selectedSample)?.url ?? null,
    [moleculeUrls, selectedSample],
  );
  const hasMolecules = Boolean(moleculesUrl);

  const segmentationUrl = useMemo(
    () => segmentationZarrUrls?.find(({ sampleId }) => sampleId === selectedSample)?.url ?? null,
    [segmentationZarrUrls, selectedSample],
  );

  const showSegOutlines = config?.showSegmentationOutlines ?? true;
  const segOutlineColour = config?.segmentationOutlineColour ?? SEG_OUTLINE_COLOUR;
  const segOutlineOpacity = config?.segmentationOutlineOpacity ?? SEG_OUTLINE_OPACITY;
  const selectedGenes = config?.selectedGenes;
  const hasSelectedGenes = (selectedGenes ?? []).length > 0;
  const selectedGenesKey = useMemo(() => (selectedGenes ?? []).join('|'), [selectedGenes]);

  // ── Reset meta + points + latches when the selected sample changes ──────────
  useEffect(() => {
    setMoleculeMeta(null);
    setMoleculePoints(null);
    setSegLoader(null);
    setViewState(null);
    viewBboxRef.current = null;
    defaultGenesAppliedRef.current = false;
  }, [selectedSample]);

  const getStore = useCallback((url) => {
    let store = storesRef.current.get(url);
    if (!store) {
      store = ZipFileStore.fromUrl(url);
      storesRef.current.set(url, store);
    }
    return store;
  }, []);

  // ── Bootstrap meta (genes palette + rootExtent) once the artifact is available ─
  useEffect(() => {
    if (!hasMolecules) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const meta = await loadMoleculeMeta(getStore(moleculesUrl));
        if (!cancelled) setMoleculeMeta(meta);
      } catch (e) {
        if (!cancelled) console.error('[SpatialMoleculePlot] meta load error:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [moleculesUrl, hasMolecules, getStore]);

  // ── Segmentation bitmask loader (grey backdrop) ─────────────────────────────
  // Loaded just like SpatialViewer (loadOmeZarrGrid, single-sample grid) so the
  // bitmask shares the SAME absolute-micron frame as the molecules — no scaling
  // or y-flip, the two overlay directly.
  useEffect(() => {
    if (!segmentationUrl || !showSegOutlines) {
      setSegLoader(null);
      return undefined;
    }
    let cancelled = false;
    const root = zarrRoot(ZipFileStore.fromUrl(segmentationUrl));
    loadOmeZarrGrid([root], [1, 1])
      .then((loader) => { if (!cancelled) setSegLoader(loader); })
      .catch((e) => console.error('[SpatialMoleculePlot] segmentation loader error:', e));
    return () => { cancelled = true; };
  }, [segmentationUrl, showSegOutlines]);

  // ── Per-cell segmentation-outline colour LUT ────────────────────────────────
  const segCellIds = useMemo(() => {
    if (!cellSets.accessible || !selectedSample) return null;
    return filterCells(cellSets, selectedSample);
  }, [cellSets.accessible, selectedSample]);

  const outlineLUT = useMemo(
    () => (segCellIds ? buildSegLUT(segCellIds, parseColor(segOutlineColour)) : null),
    [segCellIds, segOutlineColour],
  );

  // ── Default gene selection + per-gene colour seeding ────────────────────────
  // When the artifact loads with no genes selected, seed the top-DISPERSION panel
  // genes (like the dot-plot / marker-heatmap), NOT alphabetical. Applied once; a
  // user clearing all genes is respected. Also default each selected gene's colour
  // from the Polychrome palette (keyed on its stable feature_code) where unset.
  useEffect(() => {
    if (!moleculeMeta?.genes?.length) return;
    if (!defaultGenesAppliedRef.current) {
      if ((selectedGenes ?? []).length > 0) {
        defaultGenesAppliedRef.current = true;
      } else {
        if (_.isEmpty(geneData)) return;
        const panelGenes = new Set(moleculeMeta.genes.map(({ gene }) => gene));
        const panelDispersions = Object.fromEntries(
          Object.entries(geneData).filter(([gene]) => panelGenes.has(gene)),
        );
        const topGenes = getHighestDispersionGenes(panelDispersions, DEFAULT_GENE_COUNT)
          .filter(Boolean);
        if (!topGenes.length) return;
        defaultGenesAppliedRef.current = true;
        onDefaultGenesRef.current(topGenes);
        return;
      }
    }

    // Persist a default colour for any selected gene that doesn't have one yet,
    // taking the first available palette colour (resolveGeneColors). Persisting keeps
    // the colour-picker swatches in sync and survives reloads.
    const existing = config?.geneColors ?? {};
    const colors = resolveGeneColors(selectedGenes ?? [], existing);
    const missing = {};
    (selectedGenes ?? []).forEach((gene) => {
      // null (a removed gene re-added) or unset → needs a freshly allocated colour
      if (!existing[gene]) missing[gene] = colors[gene];
    });
    if (Object.keys(missing).length > 0) {
      onDefaultColorsRef.current({ ...existing, ...missing });
    }
  }, [moleculeMeta, selectedGenes, config?.geneColors, geneData]);

  // ── Load all selected-gene molecules once (full extent, full depth) ──────────
  // Like SpatialViewer: read every point for the selected genes across the whole
  // artifact up front and let the GPU render them. Zoom/pan only moves the camera —
  // the point set never changes, so points don't "appear" as you zoom in.
  // Latest values via refs so the loader callback is created once.
  const streamCtxRef = useRef({});
  streamCtxRef.current = {
    moleculesUrl,
    moleculeMeta,
    selectedGenes,
    geneColors: config?.geneColors,
  };

  const streamMolecules = useCallback(async () => {
    const {
      moleculesUrl: url, moleculeMeta: meta, selectedGenes: genes, geneColors,
    } = streamCtxRef.current;
    if (!url || !meta) return;
    if (!genes || genes.length === 0) { setMoleculePoints(null); return; }

    const palette = meta.genes ?? [];
    const byName = new Map(palette.map(({ gene, code }) => [gene, code]));
    // resolve colours for the selected set (existing/overrides win, rest take the
    // first available palette colour — matches the seeded/legend colours)
    const resolved = resolveGeneColors(genes, geneColors ?? {});
    // code -> [r,g,b]
    const colorByCode = new Map();
    const geneCodes = [];
    genes.forEach((gene) => {
      const code = byName.get(gene);
      if (code === undefined) return;
      geneCodes.push(code);
      const [r, g, b] = parseColor(resolved[gene]);
      colorByCode.set(code, [r, g, b]);
    });
    if (!geneCodes.length) { setMoleculePoints(null); return; }

    try {
      // Gene-partitioned artifact: range-read just the selected genes' entries
      // (every point for each), exactly like SpatialViewer's single-gene overlay.
      const result = await loadMoleculeNodes(getStore(url), {
        genes: geneCodes,
      });
      const {
        count, x, y, featureCode,
      } = result;
      const positions = new Float32Array(count * 2);
      const colors = new Uint8Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 2] = x[i];
        positions[i * 2 + 1] = y[i];
        const [r, g, b] = colorByCode.get(featureCode[i]) ?? SEG_GREY;
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
      }
      setMoleculePoints({ positions, colors, count });
      setMoleculesError(false);
    } catch (e) {
      console.error('[SpatialMoleculePlot] molecule load error:', e);
      setMoleculesError(true);
    }
  }, [getStore]);

  // full micron extent of the artifact (the zoomed-out overview bbox)
  const rootBbox = useMemo(() => {
    const ext = moleculeMeta?.rootExtent;
    if (!ext) return null;
    return [ext.x[0], ext.y[0], ext.x[1], ext.y[1]];
  }, [moleculeMeta]);

  // ── Initial molecule load + view fit (full extent) once meta + genes ready ──
  useEffect(() => {
    if (!hasMolecules || !rootBbox) return;
    if (!hasSelectedGenes) { setMoleculePoints(null); return; }
    streamMolecules();
    // streamMolecules reads the latest selection/colours via the ctx ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moleculesUrl, hasMolecules, hasSelectedGenes, selectedGenesKey, rootBbox,
    config?.geneColors]);

  // The full-extent fit for the current plot box (target + non-uniform zoom). This
  // is the deck.gl mount/remount view state; it changes only when the data extent or
  // the plot box changes (NOT on zoom), so it never fights an in-progress gesture.
  const fitView = useMemo(
    () => (rootBbox ? fitBboxToView(rootBbox, layout.innerW, layout.innerH) : null),
    [rootBbox, layout.innerW, layout.innerH],
  );
  // remount deck.gl (→ re-fit) when the sample, data extent or plot box changes.
  // Also key on whether the segmentation loader is ready: the bitmask is a viv
  // MultiscaleImageLayer (view-dependent tile rendering) that, when added to an
  // already-mounted uncontrolled deck, doesn't draw until the first viewport change
  // ("only shows on zoom"). Remounting once it's ready puts the layer in the initial
  // render so it draws immediately; the camera is preserved (initialViewState below).
  const segReady = Boolean(segLoader?.data);
  const fitKey = `${selectedSample}:${layout.innerW}x${layout.innerH}:${rootBbox?.join(',')}:${segReady}`;

  // The view to (re)mount deck.gl with. On a remount (dimension/sample/seg-ready
  // change) re-fit the LAST VISIBLE region to the current plot box, so a resize
  // keeps the same zoom instead of snapping back to the full extent. With no region
  // yet (fresh sample) we fall back to the full-extent fit. fitKey is the dep so this
  // recomputes on exactly the remount moments, when viewBboxRef holds the latest region.
  const mountViewState = useMemo(() => {
    const bbox = viewBboxRef.current;
    const refit = bbox ? fitBboxToView(bbox, layout.innerW, layout.innerH) : null;
    return refit ?? fitView;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, fitView]);

  // Mirror the mount view into the chrome's view state when it (re)fits; zoom/pan
  // updates come through onViewStateChange. mountViewState changes only on a remount,
  // so an in-progress gesture is never reset.
  useEffect(() => {
    if (mountViewState) setViewState(mountViewState);
  }, [mountViewState]);

  // ── Persist zoom on settle (the camera only; the point set is fixed) ────────
  const persistZoom = useMemo(() => _.debounce((bbox) => {
    onZoomChangeRef.current({
      xAxisAuto: false, xMin: bbox[0], xMax: bbox[2], yMin: bbox[1], yMax: bbox[3],
    });
  }, 250), []);

  const bboxForViewState = useCallback((vs) => {
    try {
      const vp = new OrthographicViewport({
        width: layout.innerW, height: layout.innerH, target: vs.target, zoom: vs.zoom,
      });
      const [ax, ay] = vp.unproject([0, 0]);
      const [bx, by] = vp.unproject([layout.innerW, layout.innerH]);
      return [Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)];
    } catch (_e) {
      return null;
    }
  }, [layout.innerW, layout.innerH]);

  // Uncontrolled deck.gl (like Embedding / SpatialViewer): the controller owns the
  // camera and we just mirror it for the chrome + persistence — pan and zoom-in are
  // entirely unrestricted. The ONLY constraint: you can't zoom out past the original
  // (full-extent) view — once a gesture would zoom out beyond it, we snap back to the
  // original view (deck.gl honours the value returned from onViewStateChange).
  const onViewStateChange = useCallback(({ viewState: vs }) => {
    let next = vs;
    if (fitView) {
      const [fzx, fzy] = zoomComponents(fitView.zoom);
      const [vzx, vzy] = zoomComponents(vs.zoom);
      if (vzx < fzx - 1e-3 || vzy < fzy - 1e-3) next = fitView; // zoomed out past original
    }
    setViewState(next);
    const bbox = bboxForViewState(next);
    if (bbox) {
      // remember the visible region (microns) so a later resize re-fits to it
      viewBboxRef.current = bbox;
      if (!isMiniPlot) persistZoom(bbox);
    }
    return next;
  }, [fitView, bboxForViewState, persistZoom, isMiniPlot]);

  // ── Layers ──────────────────────────────────────────────────────────────────
  const bitmaskOutlineLayer = useMemo(() => {
    if (!segLoader?.data || !showSegOutlines || !outlineLUT) return null;
    return makeBitmaskLayer({
      id: 'molecule-seg-outline',
      loader: segLoader.data,
      cellColorData: outlineLUT,
      hoveredCell: 0,
      showOutlineOnly: true,
      opacity: segOutlineOpacity,
    });
    // fitKey dep → fresh instance on a deck.gl remount (see the molecule layer note)
  }, [segLoader, showSegOutlines, outlineLUT, segOutlineOpacity, fitKey]);

  const moleculeScatterLayer = useMemo(() => {
    // hideMoleculesForExport drops the layer for the outline-only export snapshot.
    // It's a memo dependency so toggling it back ON builds a FRESH layer instance —
    // deck.gl won't re-render a layer instance it has already finalised/removed.
    if (!moleculePoints?.count || hideMoleculesForExport) return null;
    const { positions, colors, count } = moleculePoints;
    return new ScatterplotLayer({
      id: 'molecules',
      data: {
        length: count,
        attributes: {
          getPosition: { value: positions, size: 2 },
          getFillColor: { value: colors, size: 3 },
        },
      },
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      radiusUnits: 'pixels',
      getRadius: styling.marker.radius,
      radiusMinPixels: 0,
      radiusMaxPixels: 40,
      opacity: styling.marker.opacity,
      stroked: false,
      filled: true,
      pickable: false,
      updateTriggers: { getRadius: [styling.marker.radius] },
    });
    // fitKey is a dep so a deck.gl remount (dimension/sample change) gets a FRESH
    // layer instance — a finalised instance handed to the new deck won't render.
  }, [moleculePoints, styling.marker.radius, styling.marker.opacity,
    hideMoleculesForExport, fitKey]);

  const layers = useMemo(
    () => [bitmaskOutlineLayer, moleculeScatterLayer].filter(Boolean),
    [bitmaskOutlineLayer, moleculeScatterLayer],
  );

  // ── Chrome model (axes + title + legend) in container pixels ────────────────
  // One flat model of rects/lines/texts, consumed by the live SVG overlay AND the
  // PNG / SVG exporters so they always match. deck.gl provides none of this.
  const buildChromeModel = useCallback((vs) => {
    const model = { rects: [], lines: [], texts: [] };
    if (isMiniPlot || !vs || !layout.axesShown) return model;
    const {
      left, top, innerW, innerH, containerW, containerH,
    } = layout;
    const right = left + innerW;
    const bottom = top + innerH;
    const s = styling;
    const a = s.axes;

    let vp;
    try {
      vp = new OrthographicViewport({
        width: innerW, height: innerH, target: vs.target, zoom: vs.zoom,
      });
    } catch (_e) { return model; }
    const projX = (wx) => left + vp.project([wx, vs.target[1], 0])[0];
    const projY = (wy) => top + vp.project([vs.target[0], wy, 0])[1];

    const bbox = bboxForViewState(vs);
    if (!bbox) return model;
    const [xMin, yMin, xMax, yMax] = bbox;
    // grid line weight 0–10 → alpha 0 (transparent) … 1 (fully visible)
    const gridAlpha = Math.min(1, Math.max(0, a.gridOpacity / 10));

    // Axis LABELS only (not the rendering): anchor the data extent's bottom-left
    // corner at (0,0). The deck view stays y-down so the image + molecules keep their
    // native orientation; we just relabel — x measured rightward from the extent's
    // left edge, y measured UPWARD from its bottom edge (so the origin reads
    // bottom-left, like the Vega spatial plots). Tick POSITIONS are unchanged, so
    // nothing moves and the image is not expanded — only the printed numbers change.
    // world<->label maps. Ticks are generated in LABEL space (so 0 is a tick and the
    // bottom-left reads 0,0) and mapped back to world coords for positioning.
    const labelX = (t) => (rootBbox ? t - rootBbox[0] : t);
    const labelY = (t) => (rootBbox ? rootBbox[3] - t : t);
    const worldX = (l) => (rootBbox ? l + rootBbox[0] : l);
    const worldY = (l) => (rootBbox ? rootBbox[3] - l : l);

    if (a.domainWidth > 0) {
      model.lines.push({
        x1: left, y1: bottom, x2: right, y2: bottom, stroke: s.fontColour, width: a.domainWidth,
      });
      model.lines.push({
        x1: left, y1: top, x2: left, y2: bottom, stroke: s.fontColour, width: a.domainWidth,
      });
    }

    // tick density ≈ Vega's default (about one tick per ~40px of axis)
    const xTickCount = Math.max(2, Math.round(innerW / 40));
    const yTickCount = Math.max(2, Math.round(innerH / 40));

    niceTicks(labelX(xMin), labelX(xMax), xTickCount).forEach((l) => {
      const x = projX(worldX(l));
      if (x < left - 0.5 || x > right + 0.5) return;
      if (gridAlpha > 0) {
        model.lines.push({
          x1: x, y1: top, x2: x, y2: bottom, stroke: s.fontColour, width: 1, opacity: gridAlpha,
        });
      }
      // tick marks + labels only when the x-axis labels are enabled
      if (a.xLabels) {
        model.lines.push({
          x1: x, y1: bottom, x2: x, y2: bottom + 4, stroke: s.fontColour, width: 1,
        });
        model.texts.push({
          x,
          y: bottom + 6,
          text: formatTick(l),
          anchor: a.rotateX ? 'end' : 'middle',
          baseline: 'hanging',
          size: a.labelFontSize,
          color: s.fontColour,
          font: s.font,
          rotate: a.rotateX ? -45 : 0,
        });
      }
    });

    // y label range runs from the bottom edge (labelY(yMax), the small value) up to
    // the top edge (labelY(yMin)); ticks in label space → 0 lands on the bottom edge.
    niceTicks(labelY(yMax), labelY(yMin), yTickCount).forEach((l) => {
      const y = projY(worldY(l));
      if (y < top - 0.5 || y > bottom + 0.5) return;
      if (gridAlpha > 0) {
        model.lines.push({
          x1: left, y1: y, x2: right, y2: y, stroke: s.fontColour, width: 1, opacity: gridAlpha,
        });
      }
      // tick marks + labels only when the y-axis labels are enabled
      if (a.yLabels) {
        model.lines.push({
          x1: left - 4, y1: y, x2: left, y2: y, stroke: s.fontColour, width: 1,
        });
        model.texts.push({
          x: left - 6,
          y,
          text: formatTick(l),
          anchor: 'end',
          baseline: 'middle',
          size: a.labelFontSize,
          color: s.fontColour,
          font: s.font,
        });
      }
    });

    // axis titles live in their gutter (between the plot and any legend band)
    if (a.xTitle) {
      model.texts.push({
        x: left + innerW / 2,
        y: bottom + layout.axisBottomH - 4,
        text: a.xTitle,
        anchor: 'middle',
        size: a.titleFontSize,
        color: s.fontColour,
        font: s.font,
      });
    }
    if (a.yTitle) {
      model.texts.push({
        x: (left - layout.axisLeftH) + 12,
        y: top + innerH / 2,
        text: a.yTitle,
        anchor: 'middle',
        size: a.titleFontSize,
        color: s.fontColour,
        font: s.font,
        rotate: -90,
      });
    }

    if (s.title.text) {
      let tx = s.title.dx;
      if (s.title.anchor === 'middle') tx = containerW / 2;
      else if (s.title.anchor === 'end') tx = containerW - s.title.dx;
      model.texts.push({
        x: tx,
        y: 4,
        text: s.title.text,
        anchor: s.title.anchor === 'middle' || s.title.anchor === 'end' ? s.title.anchor : 'start',
        baseline: 'hanging',
        size: s.title.fontSize,
        color: s.fontColour,
        font: s.font,
      });
    }

    // legend — swatch + label per gene, in its reserved gutter. Horizontal row for
    // top/bottom, vertical column for left/right.
    if (layout.legendShown) {
      const lp = s.legend.position;
      const sw = Math.max(8, s.legend.labelFontSize);
      const swatch = (x, y, color) => model.rects.push({
        x, y, w: sw, h: sw, fill: color, rx: sw / 2,
      });
      const label = (x, y, text, size) => model.texts.push({
        x, y, text, anchor: 'start', baseline: 'middle', size, color: s.fontColour, font: s.font,
      });

      if (lp === 'left' || lp === 'right') {
        // vertical column, TOP-aligned. Left: far-left gutter (left of the y-axis
        // labels). Right: LEGEND_PAD past the plot's right edge.
        const rowH = sw + 6;
        const lx = lp === 'left' ? 4 : left + innerW + LEGEND_PAD;
        let cy = top;
        if (s.legend.title) {
          label(lx, cy + s.legend.titleFontSize / 2, s.legend.title, s.legend.titleFontSize);
          cy += s.legend.titleFontSize + 6;
        }
        legendItems.forEach(({ gene, color }) => {
          swatch(lx, cy, color);
          label(lx + sw + 4, cy + sw / 2, gene, s.legend.labelFontSize);
          cy += rowH;
        });
      } else {
        // horizontal row, LEFT-aligned (starts at the plot's left edge). Top: below
        // the title; bottom: below the x-axis labels.
        const gap = 16;
        const widths = legendItems.map(
          ({ gene }) => sw + 4 + gene.length * s.legend.labelFontSize * 0.6,
        );
        let cx = left;
        const ly = lp === 'top' ? layout.titleH + 2 : containerH - sw - 2;
        const midY = ly + sw / 2;
        if (s.legend.title) {
          label(cx, midY, s.legend.title, s.legend.titleFontSize);
          cx += s.legend.title.length * s.legend.titleFontSize * 0.6 + 8;
        }
        legendItems.forEach(({ gene, color }, i) => {
          swatch(cx, ly, color);
          label(cx + sw + 4, midY, gene, s.legend.labelFontSize);
          cx += widths[i] + gap;
        });
      }
    }

    return model;
  }, [isMiniPlot, layout, styling, legendItems, bboxForViewState, rootBbox, width, height]);

  const chromeModel = useMemo(() => buildChromeModel(viewState), [buildChromeModel, viewState]);

  // ── Export (PNG / SVG) — composite the GL snapshot with the chrome model ────
  const getDeckCanvas = () => containerRef.current?.querySelector('canvas') ?? null;

  const downloadPng = useCallback(() => {
    const canvas = getDeckCanvas();
    if (!canvas || !viewState) return;
    const scale = 1;
    const out = document.createElement('canvas');
    out.width = layout.containerW * scale;
    out.height = layout.containerH * scale;
    const ctx = out.getContext('2d');
    ctx.fillStyle = styling.background;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(
      canvas,
      layout.left * scale, layout.top * scale, layout.innerW * scale, layout.innerH * scale,
    );
    drawChromeToCanvas(ctx, buildChromeModel(viewState), scale);
    out.toBlob((blob) => { if (blob) saveAs(blob, 'spatial_molecules.png'); });
  }, [viewState, layout, styling, buildChromeModel]);

  // Project the molecule points to screen px as vector circles, for a true-vector
  // SVG export that stays crisp at any zoom (rather than a raster snapshot).
  const buildMoleculeCircles = useCallback((vs) => {
    if (!moleculePoints?.count || !vs) return [];
    const {
      left, top, innerW, innerH,
    } = layout;
    let vp;
    try {
      vp = new OrthographicViewport({
        width: innerW, height: innerH, target: vs.target, zoom: vs.zoom,
      });
    } catch (_e) { return []; }
    const { positions, colors, count } = moleculePoints;
    const r = styling.marker.radius;
    const out = [];
    for (let i = 0; i < count; i += 1) {
      const [sx, sy] = vp.project([positions[i * 2], positions[i * 2 + 1], 0]);
      const cx = left + sx;
      const cy = top + sy;
      // keep only points inside the plot rect (the SVG clips, this trims the size)
      if (cx >= left - r && cx <= left + innerW + r && cy >= top - r && cy <= top + innerH + r) {
        out.push({
          cx: Number(cx.toFixed(2)),
          cy: Number(cy.toFixed(2)),
          r,
          fill: `rgb(${colors[i * 3]},${colors[i * 3 + 1]},${colors[i * 3 + 2]})`,
        });
      }
    }
    return out;
  }, [moleculePoints, layout, styling.marker.radius]);

  // Snapshot the deck canvas with the molecule layer hidden, so the raster captures
  // ONLY the segmentation outline. The outline tiles are already loaded in the live
  // deck, so re-rendering without the molecules is a quick repaint.
  const captureOutlineRaster = useCallback(() => new Promise((resolve) => {
    if (!segLoader?.data || !showSegOutlines) { resolve(null); return; }
    setHideMoleculesForExport(true);
    // wait for deck to repaint without the molecule layer, then read the pixels
    setTimeout(() => {
      const canvas = getDeckCanvas();
      const url = canvas ? canvas.toDataURL('image/png') : null;
      setHideMoleculesForExport(false);
      resolve(url);
    }, 80);
  }), [segLoader, showSegOutlines]);

  const downloadSvg = useCallback(async () => {
    if (!viewState) return;
    // The segmentation outline is a raster bitmask, so embed an outline-ONLY GL
    // snapshot as a backdrop (molecules hidden during capture). The molecules are
    // then drawn on top as VECTOR circles, so the data stays crisp at any zoom and
    // the raster underneath holds only the (soft) outline.
    const imageHref = await captureOutlineRaster();
    const svg = chromeToSvg(buildChromeModel(viewState), {
      width: layout.containerW,
      height: layout.containerH,
      background: styling.background,
      imageHref,
      imageRect: [layout.left, layout.top, layout.innerW, layout.innerH],
      clipRect: [layout.left, layout.top, layout.innerW, layout.innerH],
      points: buildMoleculeCircles(viewState),
      pointsOpacity: styling.marker.opacity,
    });
    saveAs(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'spatial_molecules.svg');
  }, [viewState, layout, styling, buildChromeModel, buildMoleculeCircles, captureOutlineRaster]);

  const exportMenu = useMemo(() => ({
    items: [
      { key: 'png', label: 'Save as PNG' },
      { key: 'svg', label: 'Save as SVG' },
    ],
    onClick: ({ key }) => (key === 'png' ? downloadPng() : downloadSvg()),
  }), [downloadPng, downloadSvg]);

  // ── Render ──────────────────────────────────────────────────────────────────
  const render = () => {
    if (moleculesError) {
      return (
        <PlatformError
          error='Could not load transcript molecules for this sample.'
          onClick={() => streamMolecules()}
        />
      );
    }

    // Artifact present but the user cleared the gene selection.
    if (hasMolecules && !hasSelectedGenes && moleculeMeta) {
      return (
        <center>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='Select one or more genes to display their transcript molecules.'
          />
        </center>
      );
    }

    if (!config || !viewState) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: layout.containerW,
            height: layout.containerH,
            background: styling.background,
          }}
        >
          <div style={{
            position: 'absolute',
            left: layout.left,
            top: layout.top,
            width: layout.innerW,
            height: layout.innerH,
          }}
          >
            <DeckGL
            // remount (re-fit) when the plot box changes; uncontrolled otherwise so
            // the deck.gl controller owns pan/zoom (controlled viewState bounced).
              key={fitKey}
              views={deckglView}
              // re-fit the last visible region to the current box on every remount, so
              // a resize/seg-ready remount keeps the zoom (full-extent fit on the very
              // first mount, when there's no region yet)
              initialViewState={mountViewState}
              onViewStateChange={onViewStateChange}
              controller={!isMiniPlot}
              layers={layers}
              glOptions={{ preserveDrawingBuffer: true }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          </div>
          {!isMiniPlot && (
            <svg
              width={layout.containerW}
              height={layout.containerH}
              style={{
                position: 'absolute', left: 0, top: 0, pointerEvents: 'none',
              }}
            >
              {chromeModel.rects.map((r, i) => (
                <rect
                // eslint-disable-next-line react/no-array-index-key
                  key={`r${i}`}
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  rx={r.rx}
                  fill={r.fill}
                  fillOpacity={r.opacity ?? 1}
                />
              ))}
              {chromeModel.lines.map((l, i) => (
                <line
                // eslint-disable-next-line react/no-array-index-key
                  key={`l${i}`}
                  x1={l.x1}
                  y1={l.y1}
                  x2={l.x2}
                  y2={l.y2}
                  stroke={l.stroke}
                  strokeWidth={l.width ?? 1}
                  strokeOpacity={l.opacity ?? 1}
                />
              ))}
              {chromeModel.texts.map((t, i) => (
                <text
                // eslint-disable-next-line react/no-array-index-key
                  key={`t${i}`}
                  x={t.x}
                  y={t.y}
                  fontFamily={t.font}
                  fontSize={t.size}
                  fill={t.color}
                  textAnchor={t.anchor === 'middle' || t.anchor === 'end' ? t.anchor : 'start'}
                  dominantBaseline={t.baseline ?? 'alphabetic'}
                  transform={t.rotate ? `rotate(${t.rotate} ${t.x} ${t.y})` : undefined}
                >
                  {t.text}
                </text>
              ))}
            </svg>
          )}
        </div>
        {!isMiniPlot && (
          <Dropdown menu={exportMenu} trigger={['click']} placement='bottomRight'>
            <Button
              shape='circle'
              size='small'
              title='Export plot'
              style={{
                marginLeft: 8,
                color: '#8c8c8c',
                fontWeight: 'bold',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ⋯
            </Button>
          </Dropdown>
        )}
      </div>
    );
  };

  return <>{render()}</>;
};

SpatialMoleculePlot.defaultProps = {
  config: null,
  onZoomChange: () => { },
  onSampleDefault: () => { },
  onDefaultGenes: () => { },
  onDefaultColors: () => { },
};

SpatialMoleculePlot.propTypes = {
  experimentId: PropTypes.string.isRequired,
  config: PropTypes.object,
  onZoomChange: PropTypes.func,
  onSampleDefault: PropTypes.func,
  onDefaultGenes: PropTypes.func,
  onDefaultColors: PropTypes.func,
};

export default SpatialMoleculePlot;
