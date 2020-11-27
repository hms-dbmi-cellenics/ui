import React, { useEffect } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';
import PropTypes, { number } from 'prop-types';
import {
  Skeleton, Button, Tooltip, Space,
  Tabs,
  Typography,
} from 'antd';

import { MergeCellsOutlined, SplitCellsOutlined, BlockOutlined } from '@ant-design/icons';

import { Element, animateScroll } from 'react-scroll';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  loadCellSets, deleteCellSet, updateCellSetHierarchy, updateCellSetSelected,
  updateCellSetProperty, resetCellSets,
} from '../../../../../../redux/actions/cellSets';
import composeTree from '../../../../../../utils/composeTree';
import isBrowser from '../../../../../../utils/environment';
import messages from '../../../../../../components/notification/messages';
import PlatformError from '../../../../../../components/PlatformError';

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
    if (loading || !isBrowser) return (<Skeleton active />);

    if (error) {
      return (
        <PlatformError description={error} onClick={() => dispatch(loadCellSets(experimentId))} />
      );
    }

    let operations = null;
    const selected = getNumberOfCellsSelected();

    if (selected) {
      operations = (
        <Space>
          <Text type='secondary'>
            {selected}
            {' '}
            cell
            {selected === 1 ? '' : 's'}
            {' '}
            selected
          </Text>
          <Tooltip title='Create complement of selected cells'>
            <Button type='dashed' icon={<BlockOutlined />} size='small' />
          </Tooltip>

          <Tooltip title='Create intersection of selected cells'>
            <Button type='dashed' icon={<SplitCellsOutlined />} size='small' />
          </Tooltip>

          <Tooltip title='Combine selected cells'>
            <Button type='dashed' icon={<MergeCellsOutlined />} size='small' />
          </Tooltip>
        </Space>
      );
    }

    return (
      <>
        <Tabs defaultActiveKey='1' onChange={() => null} tabBarExtraContent={operations}>
          <TabPane tab='Cell sets' key='cellSets'>
            <HierarchicalTree
              treeData={composeTree(hierarchy, properties, 'cellSet')}
              onCheck={onCheck}
              onNodeUpdate={onNodeUpdate}
              onNodeDelete={onNodeDelete}
              onHierarchyUpdate={onHierarchyUpdate}
              defaultExpandAll
            />
          </TabPane>
          <TabPane tab='Metadata' key='metadataCategorical'>
            <HierarchicalTree
              treeData={composeTree(hierarchy, properties, 'metadataCategorical')}
              onCheck={onCheck}
              onNodeUpdate={onNodeUpdate}
              onNodeDelete={onNodeDelete}
              onHierarchyUpdate={onHierarchyUpdate}
              defaultExpandAll
            />
          </TabPane>

        </Tabs>
      </>
    );
  };

  /**
   * TODO: needs removed
   */
  const recluster = () => {
    dispatch(resetCellSets(experimentId));
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
