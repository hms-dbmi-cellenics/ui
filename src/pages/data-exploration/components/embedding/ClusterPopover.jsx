import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Popover } from 'antd';
import EditableField from '../../../../components/EditableField';

const ClusterPopover = (props) => {
  const defaultColor = '#0000FF';
  const { popoverPosition, onCreate, onCancel } = props;
  const [clusterName, setClusterName] = useState('New Cluster');

  const getContent = () => (
    <EditableField
      onAfterSubmit={(e) => {
        setClusterName(e);
        onCreate(clusterName, defaultColor);
      }}
      onAfterCancel={() => {
        onCancel();
      }}
      deleteEnabled={false}
      value={clusterName}
      defaultEditing
    />
  );

  const content = getContent();

  return (
    <div style={{ position: 'absolute', left: popoverPosition.current.x + 20, top: popoverPosition.current.y + 20 }}>
      <Popover title='Add cell set' content={content} visible />
    </div>
  );
};

ClusterPopover.defaultProps = {
};

ClusterPopover.propTypes = {
  onCreate: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  popoverPosition: PropTypes.objectOf(PropTypes.number).isRequired,
};

export default ClusterPopover;
