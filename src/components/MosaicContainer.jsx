import React from 'react';
import PropTypes from 'prop-types';
import 'react-mosaic-component/react-mosaic-component.css';

const MosaicContainer = ({ children }) => (
  <div className='mosaic-blueprint-theme mosaic mosaic-drop-target'>
    <div className='mosaic-root'>
      <div className='mosaic-tile' style={{ height: 'calc(100% - 0.5em)' }}>
        <div className='mosaic-window'>
          <div className='mosaic-window-body' style={{ overflow: 'auto' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

MosaicContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default MosaicContainer;
