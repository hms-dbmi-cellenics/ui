import React, { Component } from 'react';
import { ScatterplotLayer } from '@deck.gl/layers';
import DeckGL, { OrthographicView, COORDINATE_SYSTEM } from 'deck.gl';

import cells from '../myPlots/data.json';

const DEFAULT_COLOR = [0, 128, 255];

function cellLayerDefaultProps(updateStatus, updateCellsHover, uuid) {
  return {
    coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
    data: cells,
    pickable: true,
    autoHighlight: true,
    stroked: true,
    filled: true,
    getElevation: 0,
    getLineWidth: 0,
    onHover: (info) => {
      if (info.object) {
        const [cellId, cellInfo] = info.object;
        const { factors = {}, xy, mappings = {} } = cellInfo;
        updateStatus(makeCellStatusMessage(factors));
        updateCellsHover({
          cellId,
          mappings: { xy, ...mappings },
          uuid,
          factors,
        });
      } else {
        // Clear the currently-hovered cell info by passing null.
        updateCellsHover(null);
      }
    },
  };
}

/**
React component which renders a scatterplot from cell data, typically tSNE or PCA.
*/
class Scatterplot extends React.Component {
  constructor(props) {
    super(props);
    this.deckRef = React.createRef();
    this.getCellCoords = this.getCellCoords.bind(this);
    this.onViewStateChange = this.onViewStateChange.bind(this);
    this.initializeViewInfo = this.initializeViewInfo.bind(this);
    this.onWebGLInitialized = this.onWebGLInitialized.bind(this);
    this.cells = cells;
    const { uuid = null } = props || {};
    // Store view and viewport information in a mutable object.
    this.viewInfo = {
      viewport: null,
      width: null,
      height: null,
      uuid,
    };
    this.state = {
      tool: null,
      gl: null,
    };
  }

  static defaultProps = {
    clearPleaseWait: (layer) => { console.warn(`"clearPleaseWait" not provided; layer: ${layer}`); },
  };

  // These are called from superclass, so they need to belong to instance, I think.
  // eslint-disable-next-line class-methods-use-this
  getInitialViewState() {
    return {
      longitude: 0,
      latitude: 0,
      zoom: 1,
      maxZoom: 40,
      pitch: 0,
      bearing: 0,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  getCellCoords(cell) {
    return cell.mappings[this.props.mapping];
  }

  // eslint-disable-next-line class-methods-use-this
  getCellBaseLayerId() {
    return 'base-scatterplot';
  }

  renderLayers() {
    const {
      cells = undefined,
      mapping,
      updateStatus = (message) => {
        console.warn(`Scatterplot updateStatus: ${message}`);
      },
      updateCellsSelection = (cellsSelection) => {
        console.warn(`Scatterplot updateCellsSelection: ${cellsSelection}`);
      },
      updateCellsHover = (hoverInfo) => {
        console.warn(`Scatterplot updateCellsHover: ${hoverInfo.cellId}`);
      },
      uuid = null,
      clearPleaseWait,
    } = this.props;

    console.log("*****", this.props, this.cells);

    const { tool } = this.state;

    const layers = [];
    if (this.cells) {
      clearPleaseWait('cells');
      layers.push(
        new ScatterplotLayer({
          id: 'scatterplot',
          // No radiusMin, so texture remains open even zooming out.
          radiusMaxPixels: 1,
          getPosition: (cellEntry) => {
            const { mappings } = cellEntry[1];
            if (!(mapping in mappings)) {
              const available = Object.keys(mappings).map(s => `"${s}"`).join(', ');
              throw new Error(`Expected to find "${mapping}", but available mappings are: ${available}`);
            }
            const mappedCell = mappings[mapping];
            return [mappedCell[0], mappedCell[1], 0];
          },
          getColor: cellEntry => (
            (this.props.cellColors && this.props.cellColors[cellEntry[0]]) || DEFAULT_COLOR
          ),
          onClick: (info) => {
            if (tool) {
              // If using a tool, prevent individual cell selection.
              // Let SelectionLayer handle the clicks instead.
              return;
            }
            const cellId = info.object[0];
          },
          ...cellLayerDefaultProps(updateStatus, updateCellsHover, "uuid-1"),
        }),
      );
    }

    const myLayer = new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: cells,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 300,
      radiusMinPixels: 1,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      getPosition: (d) => d,
      getRadius: (d) => Math.sqrt(d.exits),
      getFillColor: (d) => [255, 140, 0],
      getLineColor: (d) => [0, 0, 0],
    });

    // layers.push(myLayer);

    // return layers;
    return [myLayer];
  }

  onViewStateChange({ viewState }) {
    const {
      updateViewInfo = () => {
        console.warn('AbstractSelectableComponent updateViewInfo from onViewStateChange');
      },
    } = this.props;
    // Update the viewport field of the `viewInfo` object
    // to satisfy components (e.g. CellTooltip2D) that depend on an
    // up-to-date viewport instance (to perform projections).
    this.viewInfo.viewport = (new OrthographicView()).makeViewport({
      viewState,
      width: this.width,
      height: this.height,
    });
    updateViewInfo(this.viewInfo);
  }

  initializeViewInfo(viewProps) {
    const {
      width, height, viewport,
    } = viewProps;
    // Capture the viewport, width, and height values from DeckGL instantiation to be used later.
    this.viewInfo.viewport = viewport;
    this.viewInfo.width = width;
    this.viewInfo.height = height;
    const {
      updateViewInfo = () => {
        console.warn('AbstractSelectableComponent updateViewInfo from renderImagesFromView');
      },
    } = this.props;
    updateViewInfo(this.viewInfo);
  }

  onWebGLInitialized(gl) {
    // gl needs to be initialized for us to use it in Texture creation
    this.setState({ gl });
  }

  render() {
    const { tool, gl } = this.state;
    const toolProps = {
      setActiveTool: (toolUpdate) => { this.setState({ tool: toolUpdate }); },
      /* eslint-disable react/destructuring-assignment */
      isActiveTool: toolCheck => (toolCheck === this.state.tool),
      /* esline-enable */
      onViewStateChange: this.onViewStateChange,
    };

    let deckProps = {
      views: [new OrthographicView({ id: 'ortho' })], // id is a fix for https://github.com/uber/deck.gl/issues/3259
      // gl needs to be initialized for us to use it in Texture creation
      layers: this.renderLayers(),
      initialViewState: this.getInitialViewState(),
    };
    console.log("%%% ", deckProps);
    if (tool) {
      deckProps = {
        controller: { dragPan: false },
        getCursor: () => 'crosshair',
        ...deckProps,
      };
    } else {
      deckProps = {
        controller: true,
        getCursor: interactionState => (interactionState.isDragging ? 'grabbing' : 'default'),
        ...deckProps,
      };
    }

    console.log(this.props);
    console.log(this.state);
    return (
      <>
        <DeckGL
          glOptions={{ webgl2: true }}
          ref={this.deckRef}
          onWebGLInitialized={this.onWebGLInitialized}
          {...deckProps}
        >
          {this.initializeViewInfo}
        </DeckGL>
      </>
    );
  }

}

export default Scatterplot;