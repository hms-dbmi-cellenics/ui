import React, {
  useEffect, useRef, useState, useCallback,
} from 'react';
import { animateScroll, Element } from 'react-scroll';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  Alert, Button, Skeleton, Space, Tabs, Typography,
} from 'antd';
import {
  BlockOutlined, MergeCellsOutlined, SplitCellsOutlined,
} from '@ant-design/icons';

import SubsetCellSetsOperation from 'components/data-exploration/cell-sets-tool/SubsetCellSetsOperation';
import CellSetOperation from 'components/data-exploration/cell-sets-tool/CellSetOperation';
import PlatformError from 'components/PlatformError';
import HierarchicalTree from 'components/data-exploration/hierarchical-tree/HierarchicalTree';
import AnnotateClustersTool from 'components/data-exploration/cell-sets-tool/AnnotateClustersTool';

import {
  createCellSet,
  deleteCellSet,
  loadCellSets,
  unhideAllCellSets,
  reorderCellSet,
  updateCellSetProperty,
  updateCellSetSelected,
} from 'redux/actions/cellSets';
import { runSubsetExperiment } from 'redux/actions/pipeline';
import { getCellSets } from 'redux/selectors';
import { useAppRouter } from 'utils/AppRouteProvider';
import { modules } from 'utils/constants';
import { composeTree } from 'utils/cellSets';
import {
  complement, intersection, union, unionByCellClass,
} from 'utils/cellSetOperations';

const { Text } = Typography;

const CellSetsTool = (props) => {
  const { experimentId, width, height } = props;

  const dispatch = useDispatch();
  const { navigateTo } = useAppRouter();
  const cellSets = useSelector(getCellSets());

  const {
    accessible, error, hierarchy, properties, hidden, selected: selectedCellSetKeys,
  } = cellSets;

  const filteredCellIds = useRef(new Set());

  const [activeTab, setActiveTab] = useState('cellSets');

  useEffect(() => {
    if (accessible && filteredCellIds.current.size === 0) {
      filteredCellIds.current = unionByCellClass('louvain', hierarchy, properties);
    }
  }, [accessible, hierarchy]);

  const FOCUS_TYPE = 'cellSets';

  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  const [treeData, setTreeData] = useState(null);

  useEffect(() => {
    setTreeData(composeTree(hierarchy, properties));
  }, [hierarchy, properties]);

  const [numSelectedCellSetKeys, setNumSelectedCellSetKeys] = useState(0);

  useEffect(() => {
    const louvainClusters = hierarchy.find(({ key }) => key === 'louvain')?.children;
    const customClusters = hierarchy.find(({ key }) => key === 'scratchpad')?.children;
    const treeClusters = treeData?.find(({ key }) => key === 'scratchpad')?.children;

    if (!customClusters || !treeClusters) return;

    if (customClusters.length > treeClusters.length) {
      // scroll to bottom based on total number of cell sets, overshoot to show new cluster
      const newHeight = (louvainClusters.length + customClusters.length) * 30 + 200;
      animateScroll.scrollTo(newHeight, { containerId: 'cell-set-tool-container' });
    }
  }, [hierarchy]);

  useEffect(() => {
    const selectedCells = union(selectedCellSetKeys, properties);

    const numSelectedFiltered = new Set([...selectedCells]
      .filter((cellIndex) => filteredCellIds.current.has(cellIndex)));

    setNumSelectedCellSetKeys(numSelectedFiltered.size);
  }, [selectedCellSetKeys, properties]);

  const onNodeUpdate = useCallback((key, data) => {
    dispatch(updateCellSetProperty(experimentId, key, data));
  }, [experimentId]);

  const onNodeDelete = useCallback((key) => {
    dispatch(deleteCellSet(experimentId, key));
  }, [experimentId]);

  const onCellSetReorder = useCallback((cellSetKey, newPosition) => {
    dispatch(reorderCellSet(experimentId, cellSetKey, newPosition));
  }, [experimentId]);

  const onCheck = useCallback((keys) => {
    dispatch(updateCellSetSelected(keys));
  }, [experimentId]);

  /**
   * Renders the content inside the tool. Can be a skeleton during loading
   * or a hierarchical tree listing all cell sets.
   */
  const renderContent = () => {
    let operations = null;

    if (numSelectedCellSetKeys > 0) {
      operations = (
        <Space style={{ marginBottom: '10px' }}>
          <SubsetCellSetsOperation
            onCreate={async (name) => {
              const newExperimentId = await dispatch(
                runSubsetExperiment(experimentId, name, selectedCellSetKeys),
              );
              navigateTo(modules.DATA_PROCESSING, { experimentId: newExperimentId }, false, true);
            }}
          />
          <CellSetOperation
            icon={<MergeCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, union(selectedCellSetKeys, properties)));
            }}
            ariaLabel='Union of selected'
            helpTitle='Create new cell set by combining selected sets in the current tab.'
          />
          <CellSetOperation
            icon={<BlockOutlined />}
            onCreate={(name, color) => {
              dispatch(
                createCellSet(experimentId, name, color, intersection(selectedCellSetKeys, properties)),
              );
            }}
            ariaLabel='Intersection of selected'
            helpTitle='Create new cell set from intersection of selected sets in the current tab.'
          />
          <CellSetOperation
            icon={<SplitCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, complement(selectedCellSetKeys, properties)));
            }}
            ariaLabel='Complement of selected'
            helpTitle='Create new cell set from the complement of the selected sets in the current tab.'
          />
          <Text type='primary' id='selectedCellSets'>
            {`${numSelectedCellSetKeys} cell${numSelectedCellSetKeys === 1 ? '' : 's'} selected`}
          </Text>
        </Space>
      );
    }

    return (
      <Space direction='vertical'>
        <Tabs
          size='small'
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
        >
          <Tabs.TabPane tab='Cell sets' key='cellSets'>
            {operations}
            <HierarchicalTree
              experimentId={experimentId}
              treeData={treeData}
              store={FOCUS_TYPE}
              onCheck={onCheck}
              onNodeUpdate={onNodeUpdate}
              onNodeDelete={onNodeDelete}
              onCellSetReorder={onCellSetReorder}
              showHideButton
              checkedKeys={selectedCellSetKeys}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab='Annotate clusters' key='annotateClusters' disabled>
            <AnnotateClustersTool experimentId={experimentId} />
          </Tabs.TabPane>
        </Tabs>
      </Space>
    );
  };

  if (!accessible) return <Skeleton active={false} title={false} />;
  if (!treeData) return <Skeleton active title={false} avatar />;

  if (error) {
    return (
      <PlatformError
        error={error}
        onClick={() => dispatch(loadCellSets(experimentId))}
      />
    );
  }

  return (
    <Element
      className='element'
      id='cell-set-tool-container'
      style={{
        position: 'relative',
        height: `${height - 40}px`,
        width: `${width - 8}px`,
        overflow: 'auto',
        paddingLeft: '5px',
        paddingRight: '5px',
      }}
    >
      <Space direction='vertical'>
        {hidden.size > 0 && (
          <Alert
            message={`${hidden.size} cell set${hidden.size > 1 ? 's are' : ' is'} currently hidden.`}
            type='warning'
            action={<Button type='link' size='small' onClick={() => dispatch(unhideAllCellSets(experimentId))}>Unhide all</Button>}
          />
        )}
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
