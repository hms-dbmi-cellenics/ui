import React from 'react';
import PropTypes from 'prop-types';
import 'react-mosaic-component/react-mosaic-component.css';

const SingleTileContainer = (props) => {
  const { children, title } = props;

  return (
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
            {title
              ? (
                <div className='mosaic-window-toolbar'>
                  <div title='Projects' className='mosaic-window-title'>{title}</div>
                </div>
              ) : <></>}
            <div className='mosaic-window-body' style={{ overflow: 'auto' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

SingleTileContainer.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
};

SingleTileContainer.defaultProps = {
  title: null,
  children: <></>,
};

export default SingleTileContainer;
