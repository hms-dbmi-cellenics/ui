import React, { useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import PropTypes from 'prop-types';

import { Skeleton } from 'antd';
import HierarchicalTree from './hierarchical-tree/HierarchicalTree';
import { loadCellSets, updateCellSets, cellSetsColor } from '../../../redux/actions';

let checkedKeys = [];

const CellSetsTool = (props) => {
  const { experimentID } = props;
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadCellSets(experimentID));
  });

  const data = useSelector((state) => state.cellSets.data);

  const getChangedData = (keys) => {
    const colorData = [];
    data.forEach((cellSet) => {
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

  const updateCellSetsColors = (keys) => {
    const colorData = getChangedData(keys);
    dispatch(cellSetsColor(colorData));
  };

  const onTreeUpdate = (newState) => {
    dispatch(updateCellSets(newState));
    updateCellSetsColors(checkedKeys);
  };

  const onCheck = (keys) => {
    checkedKeys = keys;
    updateCellSetsColors(keys);
  };

  const renderHierarchicalTree = () => {
    if (typeof data !== 'undefined') {
      return (
        <HierarchicalTree
          onCheck={onCheck}
          onTreeUpdate={onTreeUpdate}
        />
      );
    }
    return (<Skeleton active />);
  };

  return (
    renderHierarchicalTree()
  );
};


CellSetsTool.defaultProps = {};

CellSetsTool.propTypes = {
  experimentID: PropTypes.string.isRequired,
};

export default CellSetsTool;
