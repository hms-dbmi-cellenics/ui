import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Tooltip,
} from 'antd';

import ClusterPopover from '../embedding/ClusterPopover';

const CellSetOperation = (props) => {
  const {
    icon, helpTitle, onCreate, onCancel,
  } = props;

  // Setting up `key` forces us to re-render the component when the user creates
  // or cancels an action. This ensures that the data from the previous state (e.g. name
  // given to a cluster) will not linger around for the next render.
  const [popoverKey, setPopoverKey] = useState(Math.random());

  return (
    <ClusterPopover
      onCreate={(name, color) => {
        onCreate(name, color);
        setPopoverKey(Math.random());
      }}
      onCancel={() => {
        onCancel();
        setPopoverKey(Math.random());
      }}
      key={popoverKey}
      message={helpTitle}
      trigger='click'

    >
      <Tooltip title={helpTitle} trigger='click hover'>
        <Button type='dashed' icon={icon} size='small' />
      </Tooltip>
    </ClusterPopover>
  );
};

CellSetOperation.defaultProps = {
  onCreate: () => null,
  onCancel: () => null,
};

CellSetOperation.propTypes = {
  icon: PropTypes.object.isRequired,
  helpTitle: PropTypes.string.isRequired,
  onCreate: PropTypes.func,
  onCancel: PropTypes.func,
};

export default CellSetOperation;
