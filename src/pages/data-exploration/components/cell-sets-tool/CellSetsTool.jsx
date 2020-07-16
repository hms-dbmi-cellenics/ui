import React, { useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';
import {
  Skeleton, Space, Button,
  Empty, Typography, Tooltip,
} from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  loadCellSets, deleteCellSet, updateCellSetHierarchy, updateCellSetSelected,
  updateCellSetProperty, resetCellSets,
} from '../../../../redux/actions/cellSets';
import composeTree from '../../../../utils/composeTree';
import isBrowser from '../../../../utils/environment';

const { Text } = Typography;
const CellSetsTool = (props) => {
  const { experimentId } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);

  const {
    loading, error, properties, hierarchy,
  } = cellSets;

  useEffect(() => {
    if (isBrowser) dispatch(loadCellSets(experimentId));
  }, []);

  const onNodeUpdate = (key, data) => {
    dispatch(updateCellSetProperty(experimentId, key, data));
  };

  const onNodeDelete = (key) => {
    dispatch(deleteCellSet(experimentId, key));
  };

  const onHierarchyUpdate = (newHierarchy) => {
    dispatch(updateCellSetHierarchy(experimentId, newHierarchy));
  };

  const onCheck = (keys) => {
    dispatch(updateCellSetSelected(experimentId, keys));
  };

  /**
   * Remders the content inside the tool. Can be a skeleton during loading
   * or a hierarchical tree listing all cell sets.
   */
  const renderContent = () => {
    if (loading || !isBrowser) return (<Skeleton active />);

    if (error) {
      return (
        <Empty
          image={<Text type='danger'><ExclamationCircleFilled style={{ fontSize: 40 }} /></Text>}
          imageStyle={{
            height: 40,
          }}
          description={
            error
          }
        >
          <Button
            type='primary'
            onClick={() => dispatch(loadCellSets(experimentId))}
          >
            Try again
          </Button>
        </Empty>
      );
    }

    return (
      <>
        <Space style={{ width: '100%' }}>
          <Tooltip title='Reset clusters to the initial state'>
            <Button type='primary' size='small' onClick={recluster}>Recluster</Button>
          </Tooltip>
        </Space>
        <HierarchicalTree
          treeData={composeTree(hierarchy, properties)}
          onCheck={onCheck}
          onNodeUpdate={onNodeUpdate}
          onNodeDelete={onNodeDelete}
          onHierarchyUpdate={onHierarchyUpdate}
          defaultExpandAll
        />
      </>
    );
  };

  const recluster = () => {
    dispatch(resetCellSets(experimentId));
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {
        renderContent()
      }
    </Space>
  );
};


CellSetsTool.defaultProps = {};

CellSetsTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default CellSetsTool;
