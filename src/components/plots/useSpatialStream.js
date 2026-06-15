import {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';
import _ from 'lodash';

import { openOmePyramid, pickLevel, tilesForViewport } from './zarrPyramid';
import { colorSegmentationOverlay, releaseOverlay } from './loadSegmentationOverlay';
import {
  loadTissueTile, loadSegTile, peekTissueTile, peekSegTile,
} from './spatialTileCache';

// Tile edge length in level pixels. Smaller → more, cheaper requests; larger → fewer.
const TILE_SIZE = 512;

const keyOf = (tile) => `${tile.level}:${tile.tx}:${tile.ty}`;
const intersects = (e, vp) => (
  e.xMax > vp.xMin && e.xMin < vp.xMax && e.yMax > vp.yMin && e.yMin < vp.yMax
);
const toRow = (url, extent) => ({
  url, x1: extent.xMin, x2: extent.xMax, y1: extent.yMin, y2: extent.yMax,
});

// thin wrappers over the pyramid helpers to keep call sites short
const levelFor = (p, reqViewport) => pickLevel(p.levels, p.fullW, p.fullH, reqViewport);
const tilesAt = (p, level, vp) => (
  tilesForViewport(p.levels, p.fullW, p.fullH, level, vp, TILE_SIZE)
);

/**
 * Viv-style viewport tile streaming for the spatial plots (SpatialFeaturePlot,
 * SpatialCategoricalPlot, SpatialOutlierFilterPlot).
 *
 * The slide is rendered as a grid of pyramid tiles fed to Vega via the `data` prop
 * (so updates never rebuild the view). As the view pans/zooms, the tiles covering
 * the current viewport are streamed at the pyramid level that matches the on-screen
 * resolution — the appropriate resolution is always visible:
 *   • TISSUE (opaque): every cached tile intersecting the viewport is drawn,
 *     coarse→fine, so finer tiles paint over coarser ones as they arrive — never a
 *     blank or stretched gap.
 *   • SEGMENTATION (semi-transparent): only the target level is drawn at rest (one
 *     tile per section → no blurry base bleeding through the per-cell alpha); while
 *     the target grid is still loading, the coarsest level is drawn underneath as a
 *     transient fallback.
 *
 * The caller drives this by calling `onViewportChange(xdom, ydom)` from the plot's
 * `domUpdates` signal listener (and once after restoring a persisted zoom). Output
 * interface matches the previous hook, so the plot components are unchanged.
 */
const useSpatialStream = ({
  experimentId,
  sampleId,
  omeZarrUrl,
  segmentationUrl, // undefined = still probing, null = unavailable
  plotWidth,
  plotHeight,
  showImage,
  colorMap, // Map<cellId, [r,g,b]> | null
  colorKey, // string — changes when colorMap should be re-applied
  opacity, // 0–1
  outline, // boolean
}) => {
  const sampleKey = sampleId ? `${experimentId}-${sampleId}` : null;

  const [imageDims, setImageDims] = useState(null);
  const [tissueRows, setTissueRows] = useState([]);
  const [segRows, setSegRows] = useState([]);
  // bumps whenever a probe resolves, to recompute the *Available booleans
  const [, forceTick] = useState(0);

  // ── Latest-value refs read by the (throttled) streamer ──────────────────────
  const colorMapRef = useRef(colorMap); colorMapRef.current = colorMap;
  const optsRef = useRef({ opacity, outline }); optsRef.current = { opacity, outline };
  // identifies the rendered seg colouring — includes opacity/outline so changing
  // those (not just the colour map) re-colours the cached tiles.
  const colorKeyRef = useRef(); colorKeyRef.current = `${colorKey}:${opacity}:${outline}`;
  const plotDimsRef = useRef({ plotWidth, plotHeight });
  plotDimsRef.current = { plotWidth, plotHeight };
  const showImageRef = useRef(showImage); showImageRef.current = showImage;
  const sampleKeyRef = useRef(sampleKey); sampleKeyRef.current = sampleKey;

  // pyramid refs hold { key, pyramid } where key is the sampleKey the pyramid was
  // opened for. They're resolved through histFor()/segFor(), which return the
  // pyramid ONLY if it still matches the current sample — so a stream() that fires
  // mid sample-switch (stale pyramid, new sampleKey) can't load the previous slide's
  // tiles under the new sample's cache keys (which would persist as a wrong base).
  const histPyramidRef = useRef(null);
  const segPyramidRef = useRef(null);
  const dimsRef = useRef(null);
  const viewportRef = useRef(null);

  const histFor = useCallback(() => {
    const h = histPyramidRef.current;
    return h && h.key === sampleKeyRef.current ? h.pyramid : null;
  }, []);
  const segFor = useCallback(() => {
    const s = segPyramidRef.current;
    return s && s.key === sampleKeyRef.current ? s.pyramid : null;
  }, []);

  // per-instance tile bookkeeping (cleared on sample change)
  // knownTissue: key -> { tile, url }
  // knownSeg:    key -> { tile, decoded }
  // segOverlays: key -> { tile, canvas, overlayUrl, extent, coloredKey }
  const knownTissueRef = useRef(new Map());
  const knownSegRef = useRef(new Map());
  const segOverlaysRef = useRef(new Map());

  // ── Colour one decoded seg tile into a per-instance canvas (cached by colorKey) ─
  const colorSegTile = useCallback((key, tile, decoded) => {
    const cmap = colorMapRef.current;
    if (!cmap) return null;
    const existing = segOverlaysRef.current.get(key);
    if (existing && existing.coloredKey === colorKeyRef.current) return existing;
    const canvas = existing?.canvas || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    if (!canvas) return null;
    const result = colorSegmentationOverlay(decoded, cmap, { ...optsRef.current, canvas });
    if (!result) return null;
    if (existing) releaseOverlay(existing.overlayUrl);
    const entry = {
      tile,
      canvas,
      overlayUrl: result.overlayUrl,
      extent: result.overlayExtent,
      coloredKey: colorKeyRef.current,
    };
    segOverlaysRef.current.set(key, entry);
    return entry;
  }, []);

  // ── Publish the rendered rows from whatever tiles are currently loaded ───────
  const publish = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    // TISSUE: every cached tile that still intersects the viewport, coarse→fine.
    if (showImageRef.current) {
      const rows = [...knownTissueRef.current.values()]
        .filter((t) => intersects(t.tile.extent, vp))
        .sort((a, b) => b.tile.level - a.tile.level)
        .map((t) => toRow(t.url, t.tile.extent));
      setTissueRows(rows);
    } else {
      setTissueRows([]);
    }

    // SEGMENTATION: target level at rest; coarsest fallback only until complete.
    const segP = segFor();
    if (segP) {
      const { plotWidth: ow, plotHeight: oh } = plotDimsRef.current;
      const targetLevel = levelFor(segP, { ...vp, outputWidth: ow, outputHeight: oh });
      const coarsest = segP.levels.length - 1;
      const targetTiles = tilesAt(segP, targetLevel, vp);

      const coloured = (t) => {
        const e = segOverlaysRef.current.get(keyOf(t));
        return e && e.coloredKey === colorKeyRef.current ? e : null;
      };
      const targetEntries = targetTiles.map(coloured).filter(Boolean);
      const complete = targetEntries.length === targetTiles.length && targetTiles.length > 0;

      let entries = targetEntries;
      if (!complete && coarsest !== targetLevel) {
        const coarseEntries = tilesAt(segP, coarsest, vp).map(coloured).filter(Boolean);
        entries = [...coarseEntries, ...targetEntries];
      }
      // dedup + coarse→fine
      const seen = new Set();
      const rows = entries
        .sort((a, b) => b.tile.level - a.tile.level)
        .filter((e) => {
          const k = keyOf(e.tile);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .map((e) => toRow(e.overlayUrl, e.extent));
      setSegRows(rows);
    } else {
      setSegRows([]);
    }
  }, [segFor]);

  // ── Request the tiles needed for the current viewport; recolour on demand ────
  const streamRef = useRef(null);
  const stream = useMemo(() => _.throttle(() => {
    const vp = viewportRef.current;
    const dims = dimsRef.current;
    if (!vp || !dims) return;
    const { plotWidth: ow, plotHeight: oh } = plotDimsRef.current;
    const reqViewport = { ...vp, outputWidth: ow, outputHeight: oh };

    // collect the tiles we want loaded this pass: target + coarsest, per layer
    const tilesToLoad = (p) => {
      const tl = levelFor(p, reqViewport);
      const coarsest = p.levels.length - 1;
      const tiles = tilesAt(p, tl, vp);
      return coarsest !== tl ? [...tiles, ...tilesAt(p, coarsest, vp)] : tiles;
    };

    const histP = histFor();
    const wantTissue = (showImageRef.current && histP) ? tilesToLoad(histP) : [];
    const segP = segFor();
    const wantSeg = segP ? tilesToLoad(segP) : [];

    const myKey = sampleKeyRef.current;

    // Tissue: load missing canvases (shared cache)
    wantTissue.forEach((tile) => {
      const k = keyOf(tile);
      if (knownTissueRef.current.has(k)) return;
      knownTissueRef.current.set(k, { tile, url: null }); // reserve
      loadTissueTile(histP, myKey, tile).then((res) => {
        if (sampleKeyRef.current !== myKey || !res) {
          if (!res) knownTissueRef.current.delete(k);
          return;
        }
        knownTissueRef.current.set(k, { tile, url: res.url });
        publish();
      });
    });

    // Seg: load missing decoded labels, then colour into per-instance canvas
    wantSeg.forEach((tile) => {
      const k = keyOf(tile);
      const cached = knownSegRef.current.get(k);
      if (cached?.decoded) {
        if (colorSegTile(k, tile, cached.decoded)) publish();
        return;
      }
      if (cached) return; // already in flight
      knownSegRef.current.set(k, { tile, decoded: null });
      loadSegTile(segP, myKey, tile).then((decoded) => {
        if (sampleKeyRef.current !== myKey || !decoded) {
          if (!decoded) knownSegRef.current.delete(k);
          return;
        }
        knownSegRef.current.set(k, { tile, decoded });
        colorSegTile(k, tile, decoded);
        publish();
      });
    });

    // recolour any already-loaded seg tiles whose colour is stale (colorKey change)
    knownSegRef.current.forEach((entry, k) => {
      if (entry.decoded) colorSegTile(k, entry.tile, entry.decoded);
    });

    // prune far-from-viewport tiles (keep visible + coarsest), release seg tokens
    const margin = {
      xMin: vp.xMin - (vp.xMax - vp.xMin),
      xMax: vp.xMax + (vp.xMax - vp.xMin),
      yMin: vp.yMin - (vp.yMax - vp.yMin),
      yMax: vp.yMax + (vp.yMax - vp.yMin),
    };
    const histCoarsest = histP ? histP.levels.length - 1 : -1;
    knownTissueRef.current.forEach((entry, k) => {
      if (entry.tile.level !== histCoarsest && !intersects(entry.tile.extent, margin)) {
        knownTissueRef.current.delete(k);
      }
    });
    const segCoarsest = segP ? segP.levels.length - 1 : -1;
    segOverlaysRef.current.forEach((entry, k) => {
      if (entry.tile.level !== segCoarsest && !intersects(entry.tile.extent, margin)) {
        releaseOverlay(entry.overlayUrl);
        segOverlaysRef.current.delete(k);
        knownSegRef.current.delete(k);
      }
    });

    publish();
  }, 80, { leading: true, trailing: true }), [colorSegTile, publish, histFor, segFor]);
  streamRef.current = stream;

  const onViewportChange = useCallback((xdom, ydom) => {
    viewportRef.current = {
      xMin: xdom[0], xMax: xdom[1], yMin: ydom[0], yMax: ydom[1],
    };
    stream();
  }, [stream]);

  // ── Reset all per-instance tiles when the slide changes ─────────────────────
  // Also drop the pyramid refs: they're re-set asynchronously by the open effects
  // below, and if stream() runs in that gap with a STALE pyramid it would load the
  // previous slide's tiles under the NEW sample's cache keys — so the correct reload
  // then hits the cache and shows the old image.
  useEffect(() => {
    histPyramidRef.current = null;
    segPyramidRef.current = null;
    knownTissueRef.current = new Map();
    knownSegRef.current = new Map();
    segOverlaysRef.current.forEach((e) => releaseOverlay(e.overlayUrl));
    segOverlaysRef.current = new Map();
    setTissueRows([]);
    setSegRows([]);
  }, [sampleId]);

  // ── Open histology pyramid (dims) ───────────────────────────────────────────
  useEffect(() => {
    if (!omeZarrUrl) return undefined;
    let cancelled = false;
    const myKey = sampleKeyRef.current;
    openOmePyramid(omeZarrUrl).then((p) => {
      if (cancelled || !p) return;
      histPyramidRef.current = { key: myKey, pyramid: p };
      const dims = { imageWidth: p.fullW, imageHeight: p.fullH };
      dimsRef.current = dims;
      setImageDims(dims);
      if (!viewportRef.current) {
        viewportRef.current = {
          xMin: 0, xMax: p.fullW, yMin: 0, yMax: p.fullH,
        };
      }
      stream();
    });
    return () => { cancelled = true; };
  }, [omeZarrUrl, stream]);

  // ── Open segmentation pyramid ───────────────────────────────────────────────
  useEffect(() => {
    if (!segmentationUrl) return undefined;
    let cancelled = false;
    const myKey = sampleKeyRef.current;
    openOmePyramid(segmentationUrl).then((p) => {
      if (cancelled || !p) return;
      segPyramidRef.current = { key: myKey, pyramid: p };
      if (!dimsRef.current) {
        const dims = { imageWidth: p.fullW, imageHeight: p.fullH };
        dimsRef.current = dims;
        setImageDims(dims);
      }
      if (!viewportRef.current) {
        viewportRef.current = {
          xMin: 0, xMax: p.fullW, yMin: 0, yMax: p.fullH,
        };
      }
      forceTick((n) => n + 1);
      stream();
    });
    return () => { cancelled = true; };
  }, [segmentationUrl, stream]);

  // ── Re-stream when colour / opacity / outline / plot size changes ────────────
  useEffect(() => {
    stream();
  }, [colorKey, opacity, outline, plotWidth, plotHeight, showImage, stream]);

  // ── Seed from the shared cache on mount for a no-flash remount ───────────────
  useEffect(() => {
    const segP = segFor();
    const histP = histFor();
    const vp = viewportRef.current;
    if (!vp || !sampleKey) return;
    const { plotWidth: ow, plotHeight: oh } = plotDimsRef.current;
    const reqViewport = { ...vp, outputWidth: ow, outputHeight: oh };
    if (histP && showImage) {
      tilesAt(histP, levelFor(histP, reqViewport), vp).forEach((tile) => {
        const hit = peekTissueTile(sampleKey, tile);
        if (hit) knownTissueRef.current.set(keyOf(tile), { tile, url: hit.url });
      });
    }
    if (segP) {
      tilesAt(segP, levelFor(segP, reqViewport), vp).forEach((tile) => {
        const hit = peekSegTile(sampleKey, tile);
        if (hit) {
          knownSegRef.current.set(keyOf(tile), { tile, decoded: hit });
          colorSegTile(keyOf(tile), tile, hit);
        }
      });
    }
    publish();
    // run once the pyramids/dims are first available
  }, [imageDims, sampleKey, showImage, colorSegTile, publish, histFor, segFor]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => {
    if (streamRef.current) streamRef.current.cancel();
    segOverlaysRef.current.forEach((e) => releaseOverlay(e.overlayUrl));
    // tissue tile canvases are owned by the shared cache (LRU) — not released here
  }, []);

  const segmentationsAvailable = !!segmentationUrl || !!segFor();
  const segProbeDone = segmentationUrl !== undefined || !!segFor();
  const ready = !!imageDims;

  return {
    imageDims,
    segmentationsAvailable,
    segProbeDone,
    tissueImageData: tissueRows,
    segOverlayData: segRows,
    onViewportChange,
    ready,
  };
};

export default useSpatialStream;
