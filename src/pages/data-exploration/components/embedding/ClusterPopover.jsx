import React from 'react';
import PropTypes from 'prop-types';
import { Popover } from 'antd';
import EditableField from '../../../../components/EditableField';
import colorProvider from '../../../../utils/colorProvider';

const ClusterPopover = (props) => {
  const { popoverPosition, onCreate, onCancel } = props;

  const getContent = () => (
    <EditableField
      onAfterSubmit={(e) => {
        onCreate(e, colorProvider.getColor());
      }}
      onAfterCancel={() => {
        onCancel();
      }}
      deleteEnabled={false}
      value='New Cluster'
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
  popoverPosition: PropTypes.object.isRequired,
};

export default ClusterPopover;
