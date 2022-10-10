import React, {
  useEffect, useRef, useState, useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  Alert, Button, Empty, Skeleton, Space, Tabs, Typography,
} from 'antd';

import { BlockOutlined, MergeCellsOutlined, SplitCellsOutlined } from '@ant-design/icons';

import { Element } from 'react-scroll';
import {
  createCellSet,
  deleteCellSet,
  loadCellSets,
  unhideAllCellSets,
  reorderCellSet,
  updateCellSetProperty,
  updateCellSetSelected,
} from 'redux/actions/cellSets';

import { composeTree } from 'utils/cellSets';
import PlatformError from 'components/PlatformError';
import HierarchicalTree from 'components/data-exploration/hierarchical-tree/HierarchicalTree';
import {
  complement, intersection, union, unionByCellClass,
} from 'utils/cellSetOperations';
import { getCellSets } from 'redux/selectors';
import CellSetOperation from './CellSetOperation';

const { Text } = Typography;

const { TabPane } = Tabs;

const CellSetsTool = (props) => {
  const { experimentId, width, height } = props;

  const dispatch = useDispatch();
  const cellSets = useSelector(getCellSets());

  const {
    accessible, error, hierarchy, properties, hidden, selected: allSelected,
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

  const [cellSetTreeData, setCellSetTreeData] = useState(null);
  const [metadataTreeData, setMetadataTreeData] = useState(null);

  useEffect(() => {
    setCellSetTreeData(composeTree(hierarchy, properties, 'cellSets'));
    setMetadataTreeData(composeTree(hierarchy, properties, 'metadataCategorical'));
  }, [hierarchy, properties]);

  const [numSelected, setNumSelected] = useState(0);

  useEffect(() => {
    const selected = allSelected[activeTab];
    const selectedCells = union(selected, properties);

    const numSelectedFiltered = new Set([...selectedCells]
      .filter((cellIndex) => filteredCellIds.current.has(cellIndex)));

    setNumSelected(numSelectedFiltered.size);
  }, [activeTab, allSelected, properties]);

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
    dispatch(updateCellSetSelected(keys, activeTab));
  }, [experimentId, activeTab]);

  /**
   * Renders the content inside the tool. Can be a skeleton during loading
   * or a hierarchical tree listing all cell sets.
   */
  const renderContent = () => {
    let operations = null;
    const selected = allSelected[activeTab];

    if (numSelected) {
      operations = (
        <Space>
          <CellSetOperation
            icon={<MergeCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, union(selected, properties)));
            }}
            ariaLabel='Union of selected'
            helpTitle='Create new cell set by combining selected sets in the current tab.'
          />
          <CellSetOperation
            icon={<BlockOutlined />}
            onCreate={(name, color) => {
              dispatch(
                createCellSet(experimentId, name, color, intersection(selected, properties)),
              );
            }}
            ariaLabel='Intersection of selected'
            helpTitle='Create new cell set from intersection of selected sets in the current tab.'
          />
          <CellSetOperation
            icon={<SplitCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, complement(selected, properties)));
            }}
            ariaLabel='Complement of selected'
            helpTitle='Create new cell set from the complement of the selected sets in the current tab.'
          />
          <Text type='primary' id='selectedCellSets'>
            {`${numSelected} cell${numSelected === 1 ? '' : 's'} selected`}
            {activeTab === 'metadataCategorical'}
          </Text>
        </Space>
      );
    }

    return (
      <>
        <Tabs
          size='small'
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          tabBarExtraContent={operations}
        >
          <TabPane tab='Cell sets' key='cellSets'>
            <HierarchicalTree
              experimentId={experimentId}
              treeData={cellSetTreeData}
              store={FOCUS_TYPE}
              onCheck={onCheck}
              onNodeUpdate={onNodeUpdate}
              onNodeDelete={onNodeDelete}
              onCellSetReorder={onCellSetReorder}
              showHideButton
              checkedKeys={selected}
            />
          </TabPane>
          <TabPane tab='Metadata' key='metadataCategorical'>
            {metadataTreeData?.length > 0 ? (
              <HierarchicalTree
                experimentId={experimentId}
                treeData={metadataTreeData}
                store={FOCUS_TYPE}
                onCheck={onCheck}
                onNodeUpdate={onNodeUpdate}
                onNodeDelete={onNodeDelete}
                onCellSetReorder={onCellSetReorder}
                showHideButton
                checkedKeys={selected}
              />
            )
              : (
                <Empty description={(
                  <>
                    <Text type='primary'>You don&apos;t have any metadata added yet.</Text>
                    <Text type='secondary'>Metadata is an experimental feature for certain pre-processed or multi-sample data sets.</Text>
                  </>
                )}
                />
              )}
          </TabPane>

        </Tabs>
      </>
    );
  };

  if (!accessible) return <Skeleton active={false} title={false} />;
  if (!cellSetTreeData || !metadataTreeData) return <Skeleton active title={false} avatar />;

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
        {hidden.size > 0 ? (
          <Alert
            message={`${hidden.size} cell set${hidden.size > 1 ? 's are' : ' is'} currently hidden.`}
            type='warning'
            action={<Button type='link' size='small' onClick={() => dispatch(unhideAllCellSets(experimentId))}>Unhide all</Button>}
          />
        ) : (<></>)}
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
