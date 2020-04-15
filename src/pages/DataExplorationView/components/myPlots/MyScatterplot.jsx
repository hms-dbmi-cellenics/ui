import React, { Component } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';


import myData from './data.json';

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  maxZoom: 40,
  pitch: 0,
  bearing: 0,
};

class MyScatterplot extends Component {
  renderLayers() {
    const layer1 = new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: myData,
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
    return [
      layer1,
    ];
  }

  render() {
    return (
      <DeckGL layers={this.renderLayers()} initialViewState={INITIAL_VIEW_STATE} controller />
    );
  }
}

export default MyScatterplot;
