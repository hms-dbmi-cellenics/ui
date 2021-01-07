import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import {
  Skeleton, Space,
  Tabs,
  Typography, Empty, Button, Alert,
} from 'antd';

import { MergeCellsOutlined, SplitCellsOutlined } from '@ant-design/icons';

import { Element, animateScroll } from 'react-scroll';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  createCellSet,
  loadCellSets,
  deleteCellSet,
  updateCellSetHierarchy,
  updateCellSetSelected,
  updateCellSetProperty,
  unhideAllCellSets,
} from '../../../../../../redux/actions/cellSets';
import composeTree from '../../../../../../utils/composeTree';
import isBrowser from '../../../../../../utils/environment';
import messages from '../../../../../../components/notification/messages';
import PlatformError from '../../../../../../components/PlatformError';
import CellSetOperation from './CellSetOperation';
import { union, intersection } from '../../../../../../utils/cellSetOperations';

const { Text } = Typography;

const { TabPane } = Tabs;

const CellSetsTool = (props) => {
  const { experimentId, width, height } = props;

  const dispatch = useDispatch();

  const cellSets = useSelector((state) => state.cellSets);
  const notifications = useSelector((state) => state.notifications);

  const [activeTab, setActiveTab] = useState('cellSets');

  const {
    loading, error, properties, hierarchy, selected, hidden,
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
    const numSelected = union(selected, properties).size;

    if (numSelected) {
      operations = (
        <Space>
          <CellSetOperation
            icon={<SplitCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, intersection(selected, properties)));
            }}
            helpTitle='Create intersection of selected'
          />
          <CellSetOperation
            icon={<MergeCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, union(selected, properties)));
            }}
            helpTitle='Combine selected'
          />
          <Text type='primary'>
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

    const cellSetTreeData = composeTree(hierarchy, properties, 'cellSets');
    const metadataTreeData = composeTree(hierarchy, properties, 'metadataCategorical');

    return (
      <>
        {hidden.size > 0 ? (
          <Alert
            message={`${hidden.size} cell set${hidden.size > 1 ? 's are' : ' is'} currently hidden.`}
            type='warning'
            action={<Button type='link' size='small' onClick={() => dispatch(unhideAllCellSets(experimentId))}>Unhide all</Button>}
          />
        ) : (<></>)}

        <Tabs
          size='small'
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          tabBarExtraContent={operations}
        >
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
              showHideButton
              defaultCheckedKeys={selected}
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
                showHideButton
                defaultCheckedKeys={selected}
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
