import React from 'react';
import PropTypes from 'prop-types';

import { Collapse } from 'antd';

const { Panel } = Collapse;

const SingleComponentMultipleDataContainer = (props) => {
  const { defaultActiveKey, inputsList, baseComponentRenderer } = props;

  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0, overflow: 'auto', width: window.innerWidth * 0.89,
    }}
    >
      <Collapse defaultActiveKey={defaultActiveKey}>
        {
          inputsList.map(({ key, headerName, params }) => (
            <Panel header={headerName} key={key}>
              {baseComponentRenderer(params)}
            </Panel>
          ))
        }
      </Collapse>
    </div>
  );
};

SingleComponentMultipleDataContainer.propTypes = {
  defaultActiveKey: PropTypes.array,
  inputsList: PropTypes.array.isRequired,
  baseComponentRenderer: PropTypes.func.isRequired,
};

SingleComponentMultipleDataContainer.defaultProps = {
  defaultActiveKey: '',
};

export default SingleComponentMultipleDataContainer;
