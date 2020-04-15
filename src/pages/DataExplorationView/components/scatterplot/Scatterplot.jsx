import React, { Component } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';


import myData from './manhattan.json';

const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.7,
  zoom: 11,
  maxZoom: 40,
  pitch: 0,
  bearing: 0,
};


const MALE_COLOR = [0, 128, 255];
const FEMALE_COLOR = [255, 0, 128];

class Scatterplot extends Component {
  renderLayers() {
    return [
      new ScatterplotLayer({
        id: 'scatter-plot',
        data: myData,
        radiusScale: 30,
        radiusMinPixels: 0.25,
        getPosition: (d) => [d[0], d[1], 0],
        getFillColor: (d) => (d[2] === 1 ? MALE_COLOR : FEMALE_COLOR),
        getRadius: 1.5,
        updateTriggers: {
          getFillColor: [MALE_COLOR, FEMALE_COLOR],
        },
      }),
    ];
  }

  render() {
    console.log(myData);
    return (
      <DeckGL layers={this.renderLayers()} initialViewState={INITIAL_VIEW_STATE} controller />
    );
  }
}

export default Scatterplot;
