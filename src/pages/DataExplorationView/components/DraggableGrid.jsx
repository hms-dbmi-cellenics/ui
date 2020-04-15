import React from 'react';

/*
import '../../node_modules/react-grid-layout/css/styles.css';
import '../../node_modules/react-resizable/css/styles.css';
import './index.css';
*/

import VitessceGrid from 'vitessce-grid';
import MyScatterplot from './myPlots/MyScatterplot';
import MyFancyMap from './myPlots/MyFancyMap';
import Scatterplot from './vitessce/Scatterplot';
/*
  After installing from NPM, you'll use "from 'vitessce-grid'" instead.
*/

const layout = {
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
    // {
    //   component: 'scatterplot',
    //   props: { text: 'body, left' },
    //   x: 0,
    //   y: 1,
    //   w: 2,
    // },
  ],
};

const registry = {
  fancyMap: MyFancyMap,
  myScatterplot: MyScatterplot,
  scatterplot: Scatterplot,
};

/*
  The layout could be represented in JSON, unless you need to provide function props.
*/

const handleClass = 'drag-around';

// function Block(props) {
//   const { plotName, onReady, removeGridComponent } = props;
//   onReady();
//   /*
//     onReady is useful when we want the VitessceGrid parent to be able to send
//     onAllReady when the children are ready; What "ready" actually means
//     will depend on your code: It could just be didComponentMount, or we might
//     need to wait for outside resources.
//   */
//   return (
//     <div style={{ height: '100%', width: '100%', border: '2px solid black' }}>
//       <div className={handleClass}>drag-me</div>
//       <div>{plotName}</div>
//       <button type="button" onClick={() => { console.warn('removeGridComponent!'); removeGridComponent(); }}>Close</button>
//     </div>
//   );
// }

function getComponent(name) {
  const component = registry[name];
  if (component === undefined) {
    throw new Error(`Could not find definition for "${name}" in registry.`);
  }
  return registry[name];
}


// function getComponent(name) {
//   /*
//     One interesting possibility here is to defer loading:
//     Tree shaking might be able to reduce the size of the main download.

//     registry = {
//       MyComponent: React.lazy(() => import('./BloatedOptionalComponent.js')),
//     }
//   */
//   const registry = { Block };
//   return registry[name];
// }

const DraggableGrid = () => (
  <VitessceGrid
    layout={layout}
    getComponent={getComponent}
    draggableHandle={`.${handleClass}`}
    padding={50}
    margin={25}
    onAllReady={() => {
      console.warn('onAllReady!');
    }}
    reactGridLayoutProps={{
      onDragStop: () => { console.warn('Wrapped onDragStop works!'); },
    }}
  />
);

export default DraggableGrid;
