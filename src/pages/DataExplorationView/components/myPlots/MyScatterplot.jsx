import React, { Component } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { OrthographicView } from '@deck.gl/core';

import myData from './tsne_data.json';
import CloseWindow from '../../../../components/CloseWindow';

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0],
  zoom: 1,
  minZoom: 1,
  maxZoom: 40,
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
      radiusScale: 1,
      radiusMinPixels: 1,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      getPosition: (d) => d,
      getRadius: (d) => Math.sqrt(d.exits),
      getFillColor: (d) => [255, 140, 0],
      getLineColor: (d) => [0, 0, 0],
      wrapLongitude: false,
    });
    return [
      layer1,
    ];
  }

  closePlot(key) {
    console.log('I am about to be closed! ', key);
  }

  render() {
    const viewport = {
      height: '100%',
      width: '100%',
    };

    const myDeckGl = (
      <DeckGL {...viewport} layers={this.renderLayers()} initialViewState={INITIAL_VIEW_STATE} views={new OrthographicView({ controller: true })} />
    );

    return (
      <>
        <div className="drag-around ant-card ant-card-bordered ant-card-header">
          My beautiful scatterplot
          <CloseWindow params={['bla']} action={this.closePlot} style={{ float: 'right' }} />
        </div>
        <div style={{
          position: 'relative', display: 'flex', flexDirection: 'column', flex: '1 1 auto',
        }}
        >
          {myDeckGl}
        </div>
      </>
    );
  }
}


export default MyScatterplot;
