import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Popover, Button,
} from 'antd';


import EditableField from '../../../components/editable-field/EditableField';
import ColorPicker from '../../../components/color-picker/ColorPicker';


const ClusterPopover = (props) => {
  const { hoverPosition, onCreate, onCancel } = props;
  const [clusterName, setClusterName] = useState('new cluster');
  const [clusterColor, setClusterColor] = useState('#0000FF');
  const [isVisible, setVisible] = useState(true);

  const renderCellSetPopover = () => {
    const content = (
      <div>
        <EditableField
          defaultText="cluster name"
          onEdit={(e) => {
            setClusterName(e);
          }}
        >
          {clusterName}
        </EditableField>
        <ColorPicker
          color={clusterColor}
          onColorChange={((e) => {
            setClusterColor(e);
          })}
        />
        <div>
          <Button
            type="primary"
            size="small"
            onClick={((e) => onCreate(clusterName, clusterColor))}
          >
            Create

          </Button>
          <Button size="small" onClick={((e) => onCancel())}>Cancel</Button>
        </div>
      </div>
    );

    return (
      <div style={{ position: 'absolute', left: hoverPosition.x + 20, top: hoverPosition.y + 20 }}>
        <Popover title="Creating a new cluster" content={content} visible />
      </div>
    );
  };

  return renderCellSetPopover();
};

ClusterPopover.defaultProps = {
  onCreate: () => null,
  onCancel: () => null,

};

ClusterPopover.propTypes = {
  onCreate: PropTypes.func,
  onCancel: PropTypes.func,
};

export default ClusterPopover;
