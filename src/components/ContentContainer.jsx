import React from 'react';
import PropTypes from 'prop-types';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import ReactResizeDetector from 'react-resize-detector';
import 'react-mosaic-component/react-mosaic-component.css';
import { layout } from 'utils/constants';

const renderWindow = (tile, width, height) => {
  if (tile) {
    return (
      <div style={{ padding: layout.PANEL_PADDING }}>
        {height && width ? tile(width, height) : <></>}
      </div>
    );
  }
  return <></>;
};

const ContentContainer = ({ tileMap, initialArrangement }) => (
  <div style={{ height: '100%', width: '100%', margin: 0 }}>
    <Mosaic
      renderTile={(id, path) => (
        <ReactResizeDetector
          handleWidth
          handleHeight
          refreshMode='throttle'
          refreshRate={500}
        >
          {({ width, height }) => (
            <MosaicWindow
              path={path}
              title={id}
              toolbarControls={tileMap[id]?.toolbarControls}
            >
              {renderWindow(tileMap[id]?.component, width, height)}
            </MosaicWindow>
          )}
        </ReactResizeDetector>
      )}
      initialValue={initialArrangement}
    />
  </div>
);

ContentContainer.propTypes = {
  tileMap: PropTypes.object.isRequired,
  initialArrangement: PropTypes.object.isRequired,
};

export default ContentContainer;
