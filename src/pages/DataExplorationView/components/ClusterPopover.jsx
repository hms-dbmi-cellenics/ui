import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Popover, Button,
} from 'antd';


import EditableField from '../../../components/editable-field/EditableField';
import ColorPicker from '../../../components/color-picker/ColorPicker';
import { createCluster } from '../../../actions';


const ClusterPopover = (props) => {
  const { hoverPosition, cellIds } = props;
  const [clusterName, setClusterName] = useState('new cluster');
  const [clusterColor, setClusterColor] = useState('#0000FF');
  const [isVisible, setVisible] = useState(true);
  const dispatch = useDispatch();


  const handleCreateCluster = () => {
    setVisible(false);
    dispatch(createCluster(cellIds, clusterName, clusterColor));
  };

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
          <Button type="primary" size="small" onClick={((e) => handleCreateCluster())}>Create</Button>
          <Button size="small" onClick={((e) => setVisible(false))}>Cancel</Button>
        </div>
      </div>
    );

    return (
      <div style={{ position: 'absolute', left: hoverPosition.x + 20, top: hoverPosition.y + 20 }}>
        <Popover title="Creating a new cluster" content={content} visible={isVisible} />
      </div>
    );
  };

  return renderCellSetPopover();
};

ClusterPopover.defaultProps = {};

export default ClusterPopover;
