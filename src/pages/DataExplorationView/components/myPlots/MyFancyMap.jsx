import React, { Component } from 'react';
import DeckGL, { GeoJsonLayer, ArcLayer } from 'deck.gl';
import { Button } from 'antd';

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const COUNTRIES = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson'; //eslint-disable-line
const AIR_PORTS = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';

const INITIAL_VIEW_STATE = {
  latitude: 51.47,
  longitude: 0.45,
  zoom: 4,
  bearing: 0,
  pitch: 30,
};

class MyFancyMap extends Component {
  static onClick(info) {
    if (info.object) {
      // eslint-disable-next-line
      alert(`${info.object.properties.name} (${info.object.properties.abbrev})`);
    }
  }

  render() {
    return (
      <div>
        {/* uncommenting the line below enables the boxes to be draggable, but disables interaction with the plot */}
        {/* <div className="drag-around"><Button>Drag me from here </Button></div> */}
        <DeckGL controller initialViewState={INITIAL_VIEW_STATE}>
          <GeoJsonLayer
            id="base-map"
            data={COUNTRIES}
            stroked
            filled
            lineWidthMinPixels={2}
            opacity={0.4}
            getLineDashArray={[3, 3]}
            getLineColor={[60, 60, 60]}
            getFillColor={[200, 200, 200]}
          />
          <GeoJsonLayer
            id="airports"
            data={AIR_PORTS}
            filled
            pointRadiusMinPixels={2}
            pointRadiusScale={2000}
            getRadius={(f) => 11 - f.properties.scalerank}
            getFillColor={[200, 0, 80, 180]}
            pickable
            autoHighlight
            onClick={this.onClick}
          />
          <ArcLayer
            id="arcs"
            data={AIR_PORTS}
            dataTransform={(d) => d.features.filter((f) => f.properties.scalerank < 4)}
            getSourcePosition={(f) => [-0.4531566, 51.4709959]}
            getTargetPosition={(f) => f.geometry.coordinates}
            getSourceColor={[0, 128, 200]}
            getTargetColor={[200, 0, 80]}
            getWidth={1}
          />
        </DeckGL>
      </div>
    );
  }
}

export default MyFancyMap;
