import React, { Component } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';


// const data = [
//   {
//     name: 'Colma (COLM)', code: 'CM', address: '365 D Street, Colma CA 94014', exits: 4214, coordinates: [-122.466233, 37.684638],
//   },
// ];

const DATA_URL = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/examples/scatterplot/manhattan.json'; // eslint-disable-line

const INITIAL_VIEW_STATE = {
  longitude: -74,
  latitude: 40.7,
  zoom: 11,
  maxZoom: 16,
  pitch: 0,
  bearing: 0,
};

const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MALE_COLOR = [0, 128, 255];
const FEMALE_COLOR = [255, 0, 128];

class Scatterplot extends Component {
  /**
   * Data format:
   * [
   *   {name: 'Colma (COLM)', code:'CM', address: '365 D Street, Colma CA 94014', exits: 4214, coordinates: [-122.466233, 37.684638]},
   *   ...
   * ]
   */

  renderLayers() {
    const {
      data = DATA_URL,
      radius = 30,
      maleColor = MALE_COLOR,
      femaleColor = FEMALE_COLOR,
    } = this.props;

    return [
      new ScatterplotLayer({
        id: 'scatter-plot',
        data,
        radiusScale: radius,
        radiusMinPixels: 0.25,
        getPosition: (d) => [d[0], d[1], 0],
        getFillColor: (d) => (d[2] === 1 ? maleColor : femaleColor),
        getRadius: 1,
        updateTriggers: {
          getFillColor: [maleColor, femaleColor],
        },
      }),
    ];
  }

  render() {
    const { mapStyle = 'mapbox://styles/mapbox/light-v9' } = this.props;
    return (
      <DeckGL layers={this.renderLayers()} initialViewState={INITIAL_VIEW_STATE} controller>
        <StaticMap
          reuseMaps
          mapStyle={mapStyle}
          preventStyleDiffing
          mapboxApiAccessToken={MAPBOX_TOKEN}
        />
      </DeckGL>
    );
  }
}

export default Scatterplot;
