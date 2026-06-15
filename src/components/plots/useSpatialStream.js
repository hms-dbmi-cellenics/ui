import {
  useState, useEffect, useMemo, useRef, useCallback,
} from 'react';
import _ from 'lodash';

import { openOmePyramid, renderImageTile } from './getImageUrls';
import { decodeSegmentationRegion, colorSegmentationOverlay, releaseOverlay } from './loadSegmentationOverlay';
import {
  loadBaseImage, loadBaseSegmentation, peekBaseImage, peekBaseSegmentation,
} from './spatialTileCache';

// Shape a tile/overlay { url|Url, extent } into a Vega image-mark datum.
const toRow = (url, extent) => ({
  url,
  x1: extent.xMin,
  x2: extent.xMax,
  y1: extent.yMin,
  y2: extent.yMax,
});

/**
 * Viewport-streaming model for the spatial plots, shared by SpatialFeaturePlot,
 * SpatialCategoricalPlot and SpatialOutlierFilterPlot.
 *
 * Two layers per slide, both fed to Vega via the `data` prop (so updates never
 * rebuild the view):
 *   • BASE   — the full-extent, lowest-resolution tile/labels. Loaded once per
 *              sample (cached, shared across plots), ALWAYS present. This is what
 *              guarantees zooming out instantly shows the whole slide — never a
 *              blank area or a stale zoomed-in tile.
 *   • DETAIL — the current viewport at a finer pyramid level. Reloaded (debounced)
 *              once a zoom/pan SETTLES; dropped when the view is zoomed out far
 *              enough that the base is already as sharp. While the view is actively
 *              moving the detail layer is HIDDEN — only the low-res base shows — so
 *              you never see a half-loaded detail tile or its border slide around.
 *
 * Base and detail are therefore never shown together: at rest you see the sharp
 * detail covering the viewport; while navigating, the coarse base.
 *
 * Coloured segmentation overlays are built from the decoded labels with the
 * caller-supplied `colorMap` (cellId → [r,g,b]); recolouring re-runs only the
 * cheap colour pass on the already-decoded base + detail labels.
 *
 * The caller drives detail loading by calling `onViewportChange(xdom, ydom)` from
 * the plot's `domUpdates` signal listener (and once after restoring a persisted
 * zoom).
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
  const imageCacheKey = sampleId ? `${experimentId}-${sampleId}-image` : null;
  const segCacheKey = sampleId ? `${experimentId}-${sampleId}-seg` : null;

  const [imageDims, setImageDims] = useState(() => {
    const base = imageCacheKey ? peekBaseImage(imageCacheKey) : null;
    return base ? { imageWidth: base.imageWidth, imageHeight: base.imageHeight } : null;
  });
  const [baseTissue, setBaseTissue] = useState(
    () => (imageCacheKey ? peekBaseImage(imageCacheKey) : null),
  );
  const [baseSegDecoded, setBaseSegDecoded] = useState(
    () => (segCacheKey ? peekBaseSegmentation(segCacheKey) : null),
  );
  const [baseOverlay, setBaseOverlay] = useState(null);
  const [detailTissue, setDetailTissue] = useState(null);
  const [detailSegDecoded, setDetailSegDecoded] = useState(null);
  const [detailOverlay, setDetailOverlay] = useState(null);
  // True while the view is actively zooming/panning. Hides the detail layer so only
  // the coarse base shows during navigation (no half-loaded tiles, no tile borders
  // sliding around); flips false once the gesture settles AND the new detail is ready.
  const [interacting, setInteracting] = useState(false);

  // ── Refs read inside the debounced loaders/colourers (always latest) ────────
  const colorMapRef = useRef(colorMap); colorMapRef.current = colorMap;
  const optsRef = useRef({ opacity, outline }); optsRef.current = { opacity, outline };
  const plotDimsRef = useRef({ plotWidth, plotHeight });
  plotDimsRef.current = { plotWidth, plotHeight };
  const showImageRef = useRef(showImage); showImageRef.current = showImage;

  const histPyramidRef = useRef(null);
  const segPyramidRef = useRef(null);
  const viewportRef = useRef(null);
  const detailReqRef = useRef(0);
  const baseSegDecodedRef = useRef(baseSegDecoded);
  const detailSegDecodedRef = useRef(detailSegDecoded);
  const baseTissueLevelRef = useRef(Infinity);
  const baseSegLevelRef = useRef(Infinity);
  // mirror of `interacting` so the (continuous) viewport handler flips state only on
  // the leading edge of a gesture instead of re-rendering every frame
  const interactingRef = useRef(false);

  // canvases reused for colouring (one per layer) so we don't reallocate the pixel
  // buffer on each recolour
  const baseSegCanvasRef = useRef(null);
  const detailSegCanvasRef = useRef(null);
  if (typeof document !== 'undefined') {
    if (!baseSegCanvasRef.current) baseSegCanvasRef.current = document.createElement('canvas');
    if (!detailSegCanvasRef.current) detailSegCanvasRef.current = document.createElement('canvas');
  }

  // tokens we OWN and must release on replace/unmount (base tissue is owned by the
  // shared tile cache — never released here)
  const baseOverlayTokenRef = useRef(null);
  const detailTissueTokenRef = useRef(null);
  const detailOverlayTokenRef = useRef(null);

  // ── Reset transient layers when the slide changes ───────────────────────────
  // Defined before the load/colour effects so a fresh (possibly cached) base set
  // below isn't clobbered back to null. Detail tokens are released on swap.
  useEffect(() => {
    setDetailTissue(null);
    setDetailSegDecoded(null);
    setDetailOverlay(null);
    setBaseOverlay(null);
    interactingRef.current = false;
    setInteracting(false);
    detailReqRef.current += 1; // invalidate any in-flight detail load
    releaseOverlay(detailTissueTokenRef.current); detailTissueTokenRef.current = null;
    releaseOverlay(detailOverlayTokenRef.current); detailOverlayTokenRef.current = null;
    releaseOverlay(baseOverlayTokenRef.current); baseOverlayTokenRef.current = null;
    const peekedImage = imageCacheKey ? peekBaseImage(imageCacheKey) : null;
    const peekedSeg = segCacheKey ? peekBaseSegmentation(segCacheKey) : null;
    // seed level refs from cache so a detail tile at full extent isn't kept over a
    // sharper base; the load effects below refresh these once they resolve
    baseTissueLevelRef.current = peekedImage ? peekedImage.level : Infinity;
    baseSegLevelRef.current = peekedSeg ? peekedSeg.level : Infinity;

    setBaseTissue(peekedImage);
    setBaseSegDecoded(peekedSeg);
  }, [sampleId]);

  // ── Open histology pyramid (dims) + load base tissue tile ───────────────────
  useEffect(() => {
    if (!omeZarrUrl || !imageCacheKey) return undefined;
    let cancelled = false;

    openOmePyramid(omeZarrUrl).then((p) => {
      if (cancelled || !p) return;
      histPyramidRef.current = p;
      setImageDims({ imageWidth: p.fullW, imageHeight: p.fullH });
    });

    loadBaseImage(omeZarrUrl, imageCacheKey).then((tile) => {
      if (cancelled || !tile) return;
      baseTissueLevelRef.current = tile.level;
      setBaseTissue(tile);
      setImageDims({ imageWidth: tile.imageWidth, imageHeight: tile.imageHeight });
    });

    return () => { cancelled = true; };
  }, [omeZarrUrl, imageCacheKey]);

  // ── Open segmentation pyramid + load base labels ────────────────────────────
  useEffect(() => {
    if (!segmentationUrl || !segCacheKey) return undefined;
    let cancelled = false;

    openOmePyramid(segmentationUrl).then((p) => {
      if (!cancelled && p) segPyramidRef.current = p;
    });

    loadBaseSegmentation(segmentationUrl, segCacheKey).then((decoded) => {
      if (cancelled || !decoded) return;
      baseSegLevelRef.current = decoded.level;
      setBaseSegDecoded(decoded);
    });

    return () => { cancelled = true; };
  }, [segmentationUrl, segCacheKey]);

  // ── Colour the base segmentation overlay (debounced) ────────────────────────
  const recolorBase = useMemo(() => _.debounce(() => {
    const decoded = baseSegDecodedRef.current;
    const cmap = colorMapRef.current;
    if (!decoded || !cmap) return;
    const result = colorSegmentationOverlay(decoded, cmap, {
      ...optsRef.current, canvas: baseSegCanvasRef.current,
    });
    if (!result) return;
    releaseOverlay(baseOverlayTokenRef.current);
    baseOverlayTokenRef.current = result.overlayUrl;
    setBaseOverlay(result);
  }, 100), []);

  const recolorDetail = useMemo(() => _.debounce(() => {
    const decoded = detailSegDecodedRef.current;
    const cmap = colorMapRef.current;
    if (!decoded || !cmap) return;
    const result = colorSegmentationOverlay(decoded, cmap, {
      ...optsRef.current, canvas: detailSegCanvasRef.current,
    });
    if (!result) return;
    releaseOverlay(detailOverlayTokenRef.current);
    detailOverlayTokenRef.current = result.overlayUrl;
    setDetailOverlay(result);
  }, 100), []);

  useEffect(() => {
    baseSegDecodedRef.current = baseSegDecoded;
    recolorBase();
  }, [baseSegDecoded, colorKey, opacity, outline]);

  useEffect(() => {
    detailSegDecodedRef.current = detailSegDecoded;
    recolorDetail();
  }, [detailSegDecoded, colorKey, opacity, outline]);

  // ── Detail (viewport) tile loader, fired once a zoom/pan SETTLES (debounced) ──
  // Loads + (for segmentation) colours the detail synchronously so that the moment we
  // drop `interacting` and reveal the detail layer, the fresh tiles are already in
  // place — no flash of a stale/half-loaded detail tile.
  const loadDetail = useMemo(() => _.debounce(async () => {
    const vp = viewportRef.current;
    if (!vp) return;
    const { plotWidth: ow, plotHeight: oh } = plotDimsRef.current;
    const viewport = {
      xMin: vp.xMin, xMax: vp.xMax, yMin: vp.yMin, yMax: vp.yMax, outputWidth: ow, outputHeight: oh,
    };
    const reqId = detailReqRef.current + 1;
    detailReqRef.current = reqId;

    // Histology detail
    const histP = histPyramidRef.current;
    if (showImageRef.current && histP) {
      const tile = await renderImageTile(histP, viewport);
      if (detailReqRef.current !== reqId) {
        if (tile) releaseOverlay(tile.imageUrl); // superseded mid-flight
      } else if (tile && tile.level < baseTissueLevelRef.current) {
        releaseOverlay(detailTissueTokenRef.current);
        detailTissueTokenRef.current = tile.imageUrl;
        setDetailTissue(tile);
      } else {
        // zoomed out to (or below) base resolution → base alone suffices
        if (tile) releaseOverlay(tile.imageUrl);
        releaseOverlay(detailTissueTokenRef.current);
        detailTissueTokenRef.current = null;
        setDetailTissue(null);
      }
    }

    // Segmentation detail
    const segP = segPyramidRef.current;
    if (segP) {
      const decoded = await decodeSegmentationRegion(segP, viewport);
      if (detailReqRef.current !== reqId) return; // superseded → newer load will reveal
      const cmap = colorMapRef.current;
      if (decoded && decoded.level < baseSegLevelRef.current && cmap) {
        detailSegDecodedRef.current = decoded;
        setDetailSegDecoded(decoded); // keep state so colour/threshold changes recolour
        const result = colorSegmentationOverlay(decoded, cmap, {
          ...optsRef.current, canvas: detailSegCanvasRef.current,
        });
        if (result) {
          releaseOverlay(detailOverlayTokenRef.current);
          detailOverlayTokenRef.current = result.overlayUrl;
          setDetailOverlay(result);
        }
      } else {
        releaseOverlay(detailOverlayTokenRef.current);
        detailOverlayTokenRef.current = null;
        setDetailSegDecoded(null);
        setDetailOverlay(null);
      }
    }

    // Only reveal if this is still the latest viewport. onViewportChange replaces
    // viewportRef with a new object each move, so an identity change means the user
    // moved again while we were loading — keep showing the base; the pending newer
    // load will reveal once it settles.
    if (viewportRef.current !== vp) return;
    interactingRef.current = false;
    setInteracting(false);
  }, 200), []);

  const onViewportChange = useCallback((xdom, ydom) => {
    viewportRef.current = {
      xMin: xdom[0], xMax: xdom[1], yMin: ydom[0], yMax: ydom[1],
    };
    // leading edge of a gesture → hide detail, show only the low-res base while moving
    if (!interactingRef.current) {
      interactingRef.current = true;
      setInteracting(true);
    }
    loadDetail();
  }, [loadDetail]);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    recolorBase.cancel();
    recolorDetail.cancel();
    loadDetail.cancel();
    // base tissue token is owned by the shared cache — do NOT release it
    releaseOverlay(baseOverlayTokenRef.current);
    releaseOverlay(detailTissueTokenRef.current);
    releaseOverlay(detailOverlayTokenRef.current);
  }, []);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  // At rest the detail tile (which covers the viewport) is shown ALONE; while
  // navigating, or when no detail exists (zoomed out), the coarse base is shown
  // alone. The two are never composited, so there's no bleed and no tile borders
  // moving around mid-gesture.
  const tissueImageData = useMemo(() => {
    if (!showImage) return [];
    if (!interacting && detailTissue) {
      return [toRow(detailTissue.imageUrl, detailTissue.imageExtent)];
    }
    return baseTissue ? [toRow(baseTissue.imageUrl, baseTissue.imageExtent)] : [];
  }, [showImage, interacting, baseTissue, detailTissue]);

  const segOverlayData = useMemo(() => {
    if (!interacting && detailOverlay) {
      return [toRow(detailOverlay.overlayUrl, detailOverlay.overlayExtent)];
    }
    return baseOverlay ? [toRow(baseOverlay.overlayUrl, baseOverlay.overlayExtent)] : [];
  }, [interacting, baseOverlay, detailOverlay]);

  const segmentationsAvailable = !!segmentationUrl || !!baseSegDecoded;
  const segProbeDone = segmentationUrl !== undefined || !!baseSegDecoded;
  const ready = !!imageDims && (!showImage || !!baseTissue);

  return {
    imageDims,
    segmentationsAvailable,
    segProbeDone,
    tissueImageData,
    segOverlayData,
    onViewportChange,
    ready,
  };
};

export default useSpatialStream;
