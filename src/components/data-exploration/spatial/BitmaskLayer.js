/**
 * Local BitmaskLayer
 * Imports only from the app's own luma.gl / deck.gl to avoid the
 * "@vitessce/gl bundles its own luma.gl" version conflict.
 *
 * Key design points:
 *  - `discard` for background pixels (cell ID 0) — reliable transparency
 *    regardless of blend-mode configuration.
 *  - Module-level reference-counted Map cache: ONE GPU texture upload per
 *    unique colorLUT Uint8Array reference across all tile instances.
 *  - finalizeState releases the ref-count so the texture is freed when no
 *    tiles reference it.
 */
import GL from '@luma.gl/constants';
import { project32, picking } from '@deck.gl/core';
import { Texture2D } from '@luma.gl/core';
import { XRLayer } from '@hms-dbmi/viv';

// ── helpers ───────────────────────────────────────────────────────────────────

function padWithDefault(arr, defaultValue, padWidth) {
  const out = [...arr];
  for (let i = 0; i < padWidth; i += 1) out.push(defaultValue);
  return out;
}

// ── shaders ───────────────────────────────────────────────────────────────────

// Vertex shader — identical to the vitessce original.
const vs = `\
#define SHADER_NAME bitmask-layer-vertex-shader

attribute vec2 texCoords;
attribute vec3 positions;
attribute vec3 positions64Low;
attribute vec3 instancePickingColors;

varying vec2 vTexCoord;

void main(void) {
  geometry.worldPosition = positions;
  geometry.uv            = texCoords;
  geometry.pickingColor  = instancePickingColors;
  gl_Position = project_position_to_clipspace(
    positions, positions64Low, vec3(0.0), geometry.position
  );
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  vTexCoord   = texCoords;
  vec4 color  = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`;

// Fragment shader — simplified single-channel version.
//
// Transparency strategy: `discard` for cell-ID 0 (background).
// This is unconditionally correct and does NOT depend on the WebGL blend-mode
// state being configured correctly (unlike alpha = 0 which can appear black
// if blending is disabled or ordered incorrectly).
const fs = `\
#define SHADER_NAME bitmask-layer-fragment-shader
precision highp float;

// Channel texture loaded by XRLayer superclass (R32F: raw cell IDs as floats).
// channel1-5 declared for API compatibility with luma.gl uniform setter;
// they are never sampled by this shader.
uniform sampler2D channel0;
uniform sampler2D channel1;
uniform sampler2D channel2;
uniform sampler2D channel3;
uniform sampler2D channel4;
uniform sampler2D channel5;

// RGB colour LUT: entry at 1-indexed position N = colour of cell (N-1).
uniform sampler2D colorTex;
uniform float     colorTexHeight;   // 2048
uniform float     colorTexWidth;    // 2048

// 1-indexed bitmask pixel value of the hovered cell; 0 = none.
uniform float     hovered;
// Only channelsVisible[0] is used; others kept for API compatibility.
uniform bool      channelsVisible[6];
// Layer opacity forwarded by deck.gl from the parent MultiscaleImageLayer.
uniform float     opacity;

varying vec2 vTexCoord;

void main() {
  // Skip invisible channel
  if (!channelsVisible[0]) discard;

  // Sample the bitmask raster: each pixel is a float cell ID (1-indexed).
  // XRLayer stores the zarr uint32 data as Float32 (R32F texture).
  float cellId = texture2D(channel0, vTexCoord).r;

  // Discard background (cell ID == 0 → no cell at this pixel).
  // 'discard' punches through to the image layer below regardless of
  // blending state — more robust than setting alpha = 0.
  if (cellId <= 0.0) discard;

  // ── Row-major 2-D LUT lookup ─────────────────────────────────────────────
  // LUT layout (2048 × 2048 RGB, NEAREST filter):
  //   entry N → texel at column (N mod 2048), row floor(N / 2048)
  //   byte offset in Uint8Array = N × 3
  // Pixel value N in bitmask → LUT entry N → colour of cell (N-1).
  vec2 lutCoord = vec2(
    mod(cellId, colorTexWidth)       / colorTexWidth,
    floor(cellId / colorTexWidth)    / (colorTexHeight - 1.0)
  );
  vec3 cellColor = texture2D(colorTex, lutCoord).rgb;

  // Tint the hovered cell blue (50 % overlay)
  float isHovered = float(cellId == hovered && hovered > 0.0);
  cellColor = mix(cellColor, vec3(0.0, 0.4, 1.0), isHovered * 0.5);

  gl_FragColor = vec4(cellColor, opacity);

  geometry.uv = vTexCoord;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;

// ── Shared colour-texture cache ───────────────────────────────────────────────
//
// Problem without caching:
//   BitmaskLayer.updateState() is called once per tile instance.
//   For a fresh tile oldProps.cellColorData === null → cache miss every time
//   → N tiles × 12 MB GPU upload = catastrophic on initial load + zoom.
//
// Solution — reference-counted Map keyed by Uint8Array identity:
//   • First tile with a given colorLUT reference: cache miss → ONE GPU upload.
//   • All subsequent tiles: cache hit → refCount++, no upload.
//   • finalizeState (tile eviction): refCount--; delete GPU texture at 0.
//   • Color change (new Uint8Array ref): old ref released per tile, new ref
//     acquired (cache miss → one upload); old texture freed when refCount → 0.
//
// deck.gl guarantees new layers are initialized BEFORE old layers are
// finalized in the same render frame, so refCount never prematurely hits 0.
const colorTexCache = new Map(); // Uint8Array → { texture: Texture2D, refCount: number }

function acquireColorTex(gl, data, width, height) {
  if (!data || !width || !height) return null;

  if (colorTexCache.has(data)) {
    colorTexCache.get(data).refCount += 1;
    return colorTexCache.get(data).texture;
  }

  // Cache miss — first tile to use this colorLUT reference.
  console.log('[BitmaskLayer] colorTex cache miss — single GPU upload for this LUT', {
    width, height, bytes: data.length,
  });

  const texture = new Texture2D(gl, {
    width,
    height,
    data,
    mipmaps: false,
    parameters: {
      [GL.TEXTURE_MIN_FILTER]: GL.NEAREST,
      [GL.TEXTURE_MAG_FILTER]: GL.NEAREST,
      [GL.TEXTURE_WRAP_S]: GL.CLAMP_TO_EDGE,
      [GL.TEXTURE_WRAP_T]: GL.CLAMP_TO_EDGE,
    },
    format: GL.RGB,
    dataFormat: GL.RGB,
    type: GL.UNSIGNED_BYTE,
  });

  colorTexCache.set(data, { texture, refCount: 1 });
  return texture;
}

function releaseColorTex(data) {
  if (!data || !colorTexCache.has(data)) return;
  const entry = colorTexCache.get(data);
  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    entry.texture.delete();
    colorTexCache.delete(data);
    console.log('[BitmaskLayer] colorTex freed. Cache entries remaining:', colorTexCache.size);
  }
}

// ── Layer ─────────────────────────────────────────────────────────────────────

const defaultProps = {
  // compare: 0 = shallow (reference) comparison — avoids deep-diff on 12 MB arrays
  cellColorData: { type: 'object', value: null, compare: 0 },
  cellTexHeight: { type: 'number', value: 2048, compare: true },
  cellTexWidth: { type: 'number', value: 2048, compare: true },
  hoveredCell: { type: 'number', value: 0, compare: true },
  // Kept for prop-forwarding API compatibility; unused in this simplified shader
  expressionData: { type: 'object', value: null, compare: 0 },
};

export default class BitmaskLayer extends XRLayer {
  // Override XRLayer's shaders with our LUT-based single-channel ones.
  getShaders() {
    return { vs, fs, modules: [project32, picking] };
  }

  updateState({ props, oldProps, changeFlags }) {
    // XRLayer.updateState loads the tile's TypedArray channel data into
    // GL textures stored in this.state.textures ({ channel0: Texture2D, … }).
    super.updateState({ props, oldProps, changeFlags });

    // Acquire / release colour LUT texture.
    // Triggered on: new tile instance (oldProps.cellColorData === null)
    //               or colorLUT reference change (user changed focus).
    if (props.cellColorData !== oldProps.cellColorData) {
      if (oldProps.cellColorData) {
        releaseColorTex(oldProps.cellColorData);
      }
      if (props.cellColorData) {
        this.setState({
          colorTex: acquireColorTex(
            this.context.gl,
            props.cellColorData,
            props.cellTexWidth,
            props.cellTexHeight,
          ),
        });
      }
    }
  }

  // Release this tile's reference to the colour texture on eviction / removal.
  finalizeState(context) {
    super.finalizeState(context);
    if (this.props.cellColorData) {
      releaseColorTex(this.props.cellColorData);
    }
  }

  draw(opts) {
    const { uniforms } = opts;
    const { hoveredCell } = this.props;
    let { channelsVisible } = this.props;
    const { textures, model, colorTex } = this.state;

    if (!textures || !model || !colorTex) return;

    // Ensure channelsVisible is always a 6-element array for the shader uniform
    channelsVisible = padWithDefault(
      channelsVisible || [true],
      false,
      6 - (channelsVisible || [true]).length,
    );

    model
      .setUniforms({
        ...uniforms,          // deck.gl standard uniforms (projection, opacity, …)
        hovered: hoveredCell || 0,
        colorTex,
        colorTexHeight: colorTex.height,
        colorTexWidth: colorTex.width,
        channelsVisible,
        ...textures,          // channel0, channel1, … from XRLayer
      })
      .draw();
  }
}

BitmaskLayer.layerName = 'BitmaskLayer';
// Preserve XRLayer / BitmapLayer defaults (opacity, channelsVisible, …)
BitmaskLayer.defaultProps = { ...XRLayer.defaultProps, ...defaultProps };