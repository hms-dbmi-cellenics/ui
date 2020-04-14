import React from 'react';

/*
import '../../node_modules/react-grid-layout/css/styles.css';
import '../../node_modules/react-resizable/css/styles.css';
import './index.css';
*/

import VitessceGrid from 'vitessce-grid';
/*
  After installing from NPM, you'll use "from 'vitessce-grid'" instead.
*/

import layout from './layout.json';
/*
  The layout could be represented in JSON, unless you need to provide function props.
*/

const handleClass = 'demo-handle';

function Block(props) {
  const { text, onReady, removeGridComponent } = props;
  onReady();
  /*
    onReady is useful when we want the VitessceGrid parent to be able to send
    onAllReady when the children are ready; What "ready" actually means
    will depend on your code: It could just be didComponentMount, or we might
    need to wait for outside resources.
  */
  return (
    /*
      You may want to use a stylesheet, but for a demo this is more clear.
    */
    <div style={{ height: '100%', width: '100%', border: '2px solid black' }}>
      <div className={handleClass}>drag-me</div>
      <div>{text}</div>
      <button type="button" onClick={() => { console.warn('removeGridComponent!'); removeGridComponent(); }}>Close</button>
    </div>
  );
}

function getComponent(name) {
  /*
    One interesting possibility here is to defer loading:
    Tree shaking might be able to reduce the size of the main download.

    registry = {
      MyComponent: React.lazy(() => import('./BloatedOptionalComponent.js')),
    }
  */
  const registry = { Block };
  return registry[name];
}

const PubSubVitessceGrid = () => (
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
      /*
          Use this to pass through to react-grid-layout.
          See https://github.com/STRML/react-grid-layout#grid-layout-props
        */
      onDragStop: () => { console.warn('Wrapped onDragStop works!'); },
    }}
  />
);

export default PubSubVitessceGrid;
