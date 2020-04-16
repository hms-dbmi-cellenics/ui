import React from 'react';

import '../../../../node_modules/react-grid-layout/css/styles.css';
import '../../../../node_modules/react-resizable/css/styles.css';
import './reactGridStyle.css';

import VitessceGrid from 'vitessce-grid';
import MyScatterplot from './myPlots/MyScatterplot';
import MyFancyMap from './myPlots/MyFancyMap';
/*
  After installing from NPM, you'll use "from 'vitessce-grid'" instead.
*/

const registry = {
  fancyMap: MyFancyMap,
  scatterplot: MyScatterplot,
};

class DraggableGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = { allReady: false };
    this.layout = {
      columns: {
        1400: [0, 6, 12, 14],
        1200: [0, 5, 10, 12],
        1000: [0, 4, 8, 10],
        800: [0, 3, 6, 8],
        600: [0, 2, 4, 8],
      },
      components: [
        {
          component: 'scatterplot',
          props: { text: 'header' },
          x: 0,
          y: 0,
          w: 2,
        },
        {
          component: 'scatterplot',
          props: { text: 'body, left' },
          x: 0,
          y: 1,
          w: 2,
        },
      ],
    };
    this.handleClass = 'drag-around';
  }

  getComponent(name) {
    const component = registry[name];
    if (component === undefined) {
      throw new Error(`Could not find definition for "${name}" in registry.`);
    }
    return registry[name];
  }

  render() {
    return (
      <VitessceGrid
        layout={this.layout}
        getComponent={this.getComponent}
        draggableHandle={`.${this.handleClass}`}
        padding={50}
        margin={25}
        onAllReady={() => { this.setState({ allReady: true }); }}
        reactGridLayoutProps={{
          onDragStop: () => { console.warn('Wrapped onDragStop works!'); },
        }}
      />
    );
  }
}

export default DraggableGrid;
