import React from 'react';
import PropTypes from 'prop-types';
import 'react-mosaic-component/react-mosaic-component.css';

const SingleTileContainer = ({ tileMap, initialArrangement }) => (
  <div className='mosaic-blueprint-theme mosaic mosaic-drop-target'>
    <div className='mosaic-root'>
      <div
        className='mosaic-tile'
        style={{
          height: 'calc(100% - 0.5em)',
          width: 'calc(100% - 0.5em)',
        }}
      >
        <div className='mosaic-window'>
          <div className='mosaic-window-toolbar'>
            <div title='Projects' className='mosaic-window-title'>{initialArrangement}</div>
          </div>
          <div className='mosaic-window-body' style={{ overflow: 'auto' }}>
            {tileMap[initialArrangement]?.component()}
          </div>
        </div>
      </div>
    </div>
  </div>
);

SingleTileContainer.propTypes = {
  tileMap: PropTypes.object.isRequired,
  initialArrangement: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
};

export default SingleTileContainer;
