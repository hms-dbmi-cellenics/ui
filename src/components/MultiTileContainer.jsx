import React from 'react';
import PropTypes from 'prop-types';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import ReactResizeDetector from 'react-resize-detector';
import 'react-mosaic-component/react-mosaic-component.css';
import { layout } from 'utils/constants';
import { useDragDropManager } from 'react-dnd';

const renderWindow = (tile, width, height, style) => {
  if (!tile) return <></>;

  return (
    <div style={{
      padding: layout.PANEL_PADDING,
      overflow: 'auto',
      ...style,
    }}
    >
      {height && width ? tile(width, height) : <></>}
    </div>
  );
};

const MultiTileContainer = ({ tileMap, initialArrangement }) => {
  const dragDropManager = useDragDropManager();

  return (
    <div style={{ height: '100%', width: '100%', margin: 0 }}>
      <Mosaic
        dragAndDropManager={dragDropManager}
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
                {renderWindow(tileMap[id]?.component, width, height, tileMap[id]?.style)}
              </MosaicWindow>
            )}
          </ReactResizeDetector>
        )}
        initialValue={initialArrangement}
      />
    </div>
  );
};

MultiTileContainer.propTypes = {
  tileMap: PropTypes.object.isRequired,
  initialArrangement: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
};

export default MultiTileContainer;
