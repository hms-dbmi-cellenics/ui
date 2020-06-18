import React, { useEffect, useState } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import PropTypes from 'prop-types';

import {
  Skeleton, Space, Tooltip, Button,
} from 'antd';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  loadCellSets, updateCellSets, cellSetsColor,
} from '../../../../redux/actions';


const CellSetsTool = (props) => {
  const { experimentID } = props;
  const dispatch = useDispatch();
  const [checkedKeys, setCheckedKeys] = useState([]);
  const cellSets = useSelector((state) => state.cellSets.data);

  useEffect(() => {
    dispatch(loadCellSets(experimentID));
  }, []);

  const composeColorData = (keys, treeState) => {
    const colorData = [];
    treeState.forEach((cellSet) => {
      if (cellSet.children) {
        cellSet.children.forEach((child) => {
          if (keys.includes(child.key)) {
            colorData.push({
              color: child.color,
              cellIds: child.cellIds,
            });
          }
        });
      } else if (keys.includes(cellSet.key)) {
        colorData.push({
          color: cellSet.color,
          cellIds: cellSet.cellIds,
        });
      }
    });
    return colorData;
  };

  const updateCellSetsColors = (keys, treeState) => {
    const colorData = composeColorData(keys, treeState || cellSets);
    dispatch(cellSetsColor(colorData));
  };

  const onTreeUpdate = (newState) => {
    // First, make sure tree updates are sent.
    dispatch(updateCellSets(experimentID, newState));

    /* In the meantime, update the colors
     * according to the new state. This should make sure that
     * only cells that are currently selected get drawn,
     * and that deleted cell sets are not drawn anymore.
     */
    updateCellSetsColors(checkedKeys, newState);
  };

  const onCheck = (keys) => {
    setCheckedKeys(keys);
    updateCellSetsColors(keys);
  };

  const renderHierarchicalTree = () => {
    if (typeof cellSets !== 'undefined') {
      return (
        <HierarchicalTree
          onCheck={onCheck}
          onTreeUpdate={onTreeUpdate}
          defaultExpandAll
        />
      );
    }
    return (<Skeleton active />);
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Space>
        <Tooltip placement='bottom' title='Compute intersection'>
          <Button>AND</Button>
        </Tooltip>
        <Tooltip placement='bottom' title='Compute union'>
          <Button>OR</Button>
        </Tooltip>
        <Tooltip placement='bottom' title='Compute complement'>
          <Button>NOT</Button>
        </Tooltip>
        <Button type='primary'>Recluster</Button>
      </Space>
      {renderHierarchicalTree()}
    </Space>
  );
};


CellSetsTool.defaultProps = {};

CellSetsTool.propTypes = {
  experimentID: PropTypes.string.isRequired,
};

export default CellSetsTool;
