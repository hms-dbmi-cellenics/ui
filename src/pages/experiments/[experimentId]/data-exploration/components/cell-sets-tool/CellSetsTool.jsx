import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import {
  Skeleton, Space,
  Tabs,
  Typography, Empty,
  Button, Tooltip,
} from 'antd';

// import { MergeCellsOutlined, SplitCellsOutlined, BlockOutlined } from '@ant-design/icons';

import { Element, animateScroll } from 'react-scroll';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  loadCellSets,
  deleteCellSet,
  updateCellSetHierarchy,
  updateCellSetSelected,
  updateCellSetProperty,
} from '../../../../../../redux/actions/cellSets';
import composeTree from '../../../../../../utils/composeTree';
import isBrowser from '../../../../../../utils/environment';
import messages from '../../../../../../components/notification/messages';
import PlatformError from '../../../../../../components/PlatformError';
import resetCellSets from '../../../../../../redux/actions/cellSets/resetCellSets';

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
    if (
      notifications
      && notifications.message
      && notifications.message.message === messages.newClusterCreated
    ) {
      animateScroll.scrollTo(height, {
        containerId: 'cell-set-tool-container',
      });
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

  const getNumberOfCellsSelected = () => {
    if (!selected) {
      return 0;
    }

    const sets = selected.map((key) => properties[key]?.cellIds || []);
    const unionSet = new Set(
      [].concat(
        ...sets.map(
          (set) => [...set],
        ),
      ),
    );

    return unionSet.size;
  };

  /**
   * Remders the content inside the tool. Can be a skeleton during loading
   * or a hierarchical tree listing all cell sets.
   */
  const renderContent = () => {
    if (loading || !isBrowser) return <Skeleton active />;

    if (error) {
      return (
        <PlatformError
          description={error}
          onClick={() => dispatch(loadCellSets(experimentId))}
        />
      );
    }

    let operations = null;
    const numSelected = getNumberOfCellsSelected();

    if (numSelected) {
      operations = (
        <Space>
          <Text type='secondary'>
            {numSelected}
            {' '}
            cell
            {numSelected === 1 ? '' : 's'}
            {' '}
            selected
          </Text>
          {/* <Tooltip title='Create complement of selected cells'>
            <Button type='dashed' icon={<BlockOutlined />} size='small' />
          </Tooltip>

          <Tooltip title='Create intersection of selected cells'>
            <Button type='dashed' icon={<SplitCellsOutlined />} size='small' />
          </Tooltip>

          <Tooltip title='Combine selected cells'>
            <Button type='dashed' icon={<MergeCellsOutlined />} size='small' />
          </Tooltip> */}
        </Space>
      );
    }

    const cellSetTreeData = composeTree(hierarchy, properties, 'cellSets');
    const metadataTreeData = composeTree(hierarchy, properties, 'metadataCategorical');

    return (
      <>
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
      <Space direction='vertical' style={{ width: '100%' }}>
        {renderContent()}
      </Space>
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
