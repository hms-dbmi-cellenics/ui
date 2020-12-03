import React, { useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes from 'prop-types';

import {
  Skeleton, Space,
  Tabs,
  Typography, Empty,
  Button, Tooltip,
} from 'antd';

import { MergeCellsOutlined, SplitCellsOutlined, BlockOutlined } from '@ant-design/icons';

import { Element, animateScroll } from 'react-scroll';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  loadCellSets, deleteCellSet, updateCellSetHierarchy, updateCellSetSelected,
  updateCellSetProperty, resetCellSets, createCellSet,
} from '../../../../../../redux/actions/cellSets';
import composeTree from '../../../../../../utils/composeTree';
import isBrowser from '../../../../../../utils/environment';
import messages from '../../../../../../components/notification/messages';
import PlatformError from '../../../../../../components/PlatformError';
import CellSetOperation from './CellSetOperation';

const { Text } = Typography;

const { TabPane } = Tabs;

const CellSetsTool = (props) => {
  const { experimentId, width, height } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const notifications = useSelector((state) => state.notifications);

  const {
    loading, error, properties, hierarchy, selected,
  } = cellSets;

  const FOCUS_TYPE = 'cellSets';

  useEffect(() => {
    if (isBrowser) {
      dispatch(loadCellSets(experimentId));
    }
  }, []);

  useEffect(() => {
    if (notifications
      && notifications.message
      && notifications.message.message === messages.newClusterCreated) {
      animateScroll.scrollTo(height, { containerId: 'cell-set-tool-container' });
    }
  }, [notifications]);

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

  const getUnionSet = () => {
    if (!selected) {
      return new Set();
    }

    const sets = selected.map((key) => properties[key]?.cellIds || []);
    const unionSet = new Set(
      [].concat(
        ...sets.map(
          (set) => [...set],
        ),
      ),
    );

    return unionSet;
  };

  const getIntersectionSet = () => {
    if (!selected) {
      return new Set();
    }

    const sets = selected.map(
      (key) => properties[key]?.cellIds || null,
    ).filter(
      (set) => set && set.size > 0,
    );

    const intersectionSet = sets.reduce(
      (acc, curr) => new Set([...acc].filter((x) => curr.has(x))),
    );

    return intersectionSet;
  };

  /**
   * Remders the content inside the tool. Can be a skeleton during loading
   * or a hierarchical tree listing all cell sets.
   */
  const renderContent = () => {
    if (loading || !isBrowser) return (<Skeleton active />);

    if (error) {
      return (
        <PlatformError description={error} onClick={() => dispatch(loadCellSets(experimentId))} />
      );
    }

    let operations = null;
    const numSelected = getUnionSet().size;

    if (numSelected) {
      operations = (
        <Space>
          <CellSetOperation
            icon={<SplitCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, getIntersectionSet()));
            }}
            helpTitle='Create intersection of selected'
          />
          <CellSetOperation
            icon={<MergeCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, getUnionSet()));
            }}
            helpTitle='Combine selected'
          />
          <Text type='secondary'>
            {numSelected}
            {' '}
            cell
            {numSelected === 1 ? '' : 's'}
            {' '}
            selected
          </Text>
        </Space>
      );
    }

    const recluster = () => {
      dispatch(resetCellSets(experimentId));
    };

    const cellSetTreeData = composeTree(hierarchy, properties, 'cellSets');
    const metadataTreeData = composeTree(hierarchy, properties, 'metadataCategorical');

    return (
      <>
        <Space style={{ width: '100%' }}>
          <Tooltip title='Reset clusters to the initial state'>
            <Button type='primary' size='small' onClick={recluster}>Reset Clusters</Button>
          </Tooltip>
        </Space>

        <Tabs defaultActiveKey='cellSets' onChange={() => null} tabBarExtraContent={operations}>
          <TabPane tab='Cell sets' key='cellSets'>
            <HierarchicalTree
              treeData={cellSetTreeData}
              onCheck={onCheck}
              store={FOCUS_TYPE}
              experimentId={experimentId}
              onNodeUpdate={onNodeUpdate}
              onNodeDelete={onNodeDelete}
              onHierarchyUpdate={onHierarchyUpdate}
              defaultExpandAll
            />
          </TabPane>
          <TabPane tab='Metadata' key='metadataCategorical'>
            {metadataTreeData?.length > 0 ? (
              <HierarchicalTree
                treeData={metadataTreeData}
                onCheck={onCheck}
                store={FOCUS_TYPE}
                experimentId={experimentId}
                onNodeUpdate={onNodeUpdate}
                onNodeDelete={onNodeDelete}
                onHierarchyUpdate={onHierarchyUpdate}
                defaultExpandAll
              />
            )
              : (
                <Empty description={(
                  <>
                    <div><Text type='primary'>You don&apos;t have any metadata added yet.</Text></div>
                    <div><Text type='secondary'>Metadata is an experimental feature for certain pre-processed or multi-sample data sets.</Text></div>
                  </>
                )}
                />
              )}
          </TabPane>

        </Tabs>
      </>
    );
  };

  return (
    <Element
      className='element'
      id='cell-set-tool-container'
      style={{
        position: 'relative',
        height: `${height - 40}px`,
        width: `${width - 8}px`,
        overflow: 'scroll',
        paddingLeft: '5px',
        paddingRight: '5px',
      }}
    >

      {
        renderContent()
      }

    </Element>
  );
};

CellSetsTool.defaultProps = {};

CellSetsTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default CellSetsTool;
