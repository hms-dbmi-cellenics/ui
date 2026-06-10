import GL from '@luma.gl/constants';
import { project32, picking } from '@deck.gl/core';
import { Texture2D } from '@luma.gl/core';
import { XRLayer } from '@hms-dbmi/viv';

function padWithDefault(arr, defaultValue, padWidth) {
  const out = [...arr];
  for (let i = 0; i < padWidth; i += 1) out.push(defaultValue);
  return out;
}

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
  vTexCoord  = texCoords;
  vec4 color = vec4(0.0);
  DECKGL_FILTER_COLOR(color, geometry);
}
`;

const fs = `\
#define SHADER_NAME bitmask-layer-fragment-shader
precision highp float;

uniform sampler2D channel0;
uniform sampler2D channel1;
uniform sampler2D channel2;
uniform sampler2D channel3;
uniform sampler2D channel4;
uniform sampler2D channel5;

uniform sampler2D colorTex;
uniform float     colorTexHeight;
uniform float     colorTexWidth;
uniform float     hovered;
uniform bool      channelsVisible[6];
uniform float     opacity;

uniform bool  showOutlineOnly;
uniform float tileWidth;
uniform float tileHeight;

varying vec2 vTexCoord;

void main() {
  if (!channelsVisible[0]) discard;

  float cellId = texture2D(channel0, vTexCoord).r;

  // Background pixel (bitmask value == 0) → always transparent
  if (cellId <= 0.0) discard;

  // ── Outline / edge detection ──────────────────────────────────────────────
  if (showOutlineOnly) {
    float dx = 1.0 / tileWidth;
    float dy = 1.0 / tileHeight;
    float n0 = texture2D(channel0, vTexCoord + vec2( dx, 0.0)).r;
    float n1 = texture2D(channel0, vTexCoord + vec2(-dx, 0.0)).r;
    float n2 = texture2D(channel0, vTexCoord + vec2(0.0,  dy)).r;
    float n3 = texture2D(channel0, vTexCoord + vec2(0.0, -dy)).r;
    bool isEdge = (n0 != cellId) || (n1 != cellId) || (n2 != cellId) || (n3 != cellId);
    if (!isEdge) discard;
  }

  // ── LUT colour lookup ─────────────────────────────────────────────────────
  vec2 lutCoord = vec2(
    mod(cellId, colorTexWidth)    / colorTexWidth,
    floor(cellId / colorTexWidth) / (colorTexHeight - 1.0)
  );
  vec4 lutSample = texture2D(colorTex, lutCoord);

  // Alpha == 0 → cell is hidden, filtered, or has no colour assignment.
  // Using alpha rather than checking rgb == (0,0,0) means genuine black
  // cells (alpha = 255) are rendered correctly.
  if (lutSample.a == 0.0) discard;

  vec3 cellColor = lutSample.rgb;

  // Tint hovered cell (50 % blue overlay)
  float isHovered = float(cellId == hovered && hovered > 0.0);
  cellColor = mix(cellColor, vec3(0.0, 0.4, 1.0), isHovered * 0.5);

  gl_FragColor = vec4(cellColor, opacity);

  geometry.uv = vTexCoord;
  DECKGL_FILTER_COLOR(gl_FragColor, geometry);
}
`;

// ── Shared colour-texture cache ───────────────────────────────────────────────
const colorTexCache = new Map();

function acquireColorTex(gl, data, width, height) {
  if (!data || !width || !height) return null;
  if (colorTexCache.has(data)) {
    colorTexCache.get(data).refCount += 1;
    return colorTexCache.get(data).texture;
  }
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
    // 4-channel: rgb = colour, a = visibility flag
    format: GL.RGBA,
    dataFormat: GL.RGBA,
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
  }
}

// ── Layer ─────────────────────────────────────────────────────────────────────

const defaultProps = {
  cellColorData: { type: 'object', value: null, compare: 0 },
  cellTexHeight: { type: 'number', value: 2048, compare: true },
  cellTexWidth: { type: 'number', value: 2048, compare: true },
  hoveredCell: { type: 'number', value: 0, compare: true },
  expressionData: { type: 'object', value: null, compare: 0 },
  showOutlineOnly: { type: 'boolean', value: false, compare: true },
  tileWidth: { type: 'number', value: 512, compare: true },
  tileHeight: { type: 'number', value: 512, compare: true },
};

export default class BitmaskLayer extends XRLayer {
  getShaders() {
    return { vs, fs, modules: [project32, picking] };
  }

  updateState({ props, oldProps, changeFlags }) {
    super.updateState({ props, oldProps, changeFlags });
    if (props.cellColorData !== oldProps.cellColorData) {
      if (oldProps.cellColorData) releaseColorTex(oldProps.cellColorData);
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

  finalizeState(context) {
    super.finalizeState(context);
    if (this.props.cellColorData) releaseColorTex(this.props.cellColorData);
  }

  draw(opts) {
    const { uniforms } = opts;
    const {
      hoveredCell, showOutlineOnly, tileWidth, tileHeight,
    } = this.props;
    let { channelsVisible } = this.props;
    const { textures, model, colorTex } = this.state;

    if (!textures || !model || !colorTex) return;

    channelsVisible = padWithDefault(
      channelsVisible || [true],
      false,
      6 - (channelsVisible || [true]).length,
    );

    model
      .setUniforms({
        ...uniforms,
        hovered: hoveredCell || 0,
        colorTex,
        colorTexHeight: colorTex.height,
        colorTexWidth: colorTex.width,
        channelsVisible,
        showOutlineOnly: !!showOutlineOnly,
        tileWidth: tileWidth || 512,
        tileHeight: tileHeight || 512,
        ...textures,
      })
      .draw();
  }
}

BitmaskLayer.layerName = 'BitmaskLayer';
BitmaskLayer.defaultProps = { ...XRLayer.defaultProps, ...defaultProps };
