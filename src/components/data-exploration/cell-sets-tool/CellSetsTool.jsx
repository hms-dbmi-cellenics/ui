import _ from 'lodash';
import React, {
  useEffect, useRef, useState, useCallback,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  Alert, Button, Empty, Skeleton, Space, Tabs, Typography,
} from 'antd';

import { BlockOutlined, MergeCellsOutlined, SplitCellsOutlined } from '@ant-design/icons';

import { animateScroll, Element } from 'react-scroll';
import HierarchicalTree from '../hierarchical-tree/HierarchicalTree';
import {
  createCellSet,
  deleteCellSet,
  loadCellSets,
  unhideAllCellSets,
  updateCellSetHierarchy,
  updateCellSetProperty,
  updateCellSetSelected,
} from '../../../redux/actions/cellSets';
import { loadGeneExpression } from '../../../redux/actions/genes';
import composeTree from '../../../utils/composeTree';
import { isBrowser } from '../../../utils/environment';
import endUserMessages from '../../../utils/endUserMessages';
import PlatformError from '../../PlatformError';
import CellSetOperation from './CellSetOperation';
import { complement, intersection, union } from '../../../utils/cellSetOperations';

const { Text } = Typography;

const { TabPane } = Tabs;

const generateFilteredCellIndices = (geneExpressions) => {
  // Determine filtered cells from gene expression data. This is currently
  // the only way to determine whether a cell is filtered.
  const [arbitraryGeneExpression] = Object.values(geneExpressions);
  const expressionValues = arbitraryGeneExpression?.rawExpression.expression ?? [];
  return new Set(_.filter(
    _.range(expressionValues.length),
    (i) => expressionValues[i] === null,
  ));
};

const CellSetsTool = (props) => {
  const { experimentId, width, height } = props;

  const dispatch = useDispatch();

  const loading = useSelector((state) => state.cellSets.loading);
  const error = useSelector((state) => state.cellSets.error);
  const hierarchy = useSelector((state) => state.cellSets.hierarchy);
  const properties = useSelector((state) => state.cellSets.properties);
  const hidden = useSelector((state) => state.cellSets.hidden);
  const allSelected = useSelector((state) => state.cellSets.selected);
  const notifications = useSelector((state) => state.notifications);

  const genes = useSelector(
    (state) => state.genes,
  );
  const filteredCells = useRef(new Set());

  const [activeTab, setActiveTab] = useState('cellSets');

  useEffect(() => {
    filteredCells.current = generateFilteredCellIndices(genes.expression.data);
  }, [genes.expression.data]);

  useEffect(() => {
    // load the expression data for an arbitrary gene so that we can determine
    // which cells are filtered
    const [gene] = Object.keys(genes.properties.data);
    if (Object.is(gene, undefined)) return;

    dispatch(loadGeneExpression(experimentId, [gene], 'CellSetsTool'));
  }, [genes.properties.data]);

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
      && notifications.message.message === endUserMessages.NEW_CLUSTER_CREATED
    ) {
      animateScroll.scrollTo(height, {
        containerId: 'cell-set-tool-container',
      });
    }
  }, [notifications]);

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

    const numSelectedUnfiltered = new Set([...selectedCells]
      .filter((cellIndex) => !filteredCells.current.has(cellIndex)));
    setNumSelected(numSelectedUnfiltered.size);
  }, [activeTab, allSelected, properties]);

  const onNodeUpdate = useCallback((key, data) => {
    dispatch(updateCellSetProperty(experimentId, key, data));
  }, [experimentId]);

  const onNodeDelete = useCallback((key) => {
    dispatch(deleteCellSet(experimentId, key));
  }, [experimentId]);

  const onHierarchyUpdate = useCallback((newHierarchy) => {
    dispatch(updateCellSetHierarchy(experimentId, newHierarchy));
  }, [experimentId]);

  const onCheck = useCallback((keys) => {
    dispatch(updateCellSetSelected(experimentId, keys, activeTab));
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
            helpTitle='Create new cell set by combining selected sets'
          />
          <CellSetOperation
            icon={<BlockOutlined />}
            onCreate={(name, color) => {
              dispatch(
                createCellSet(experimentId, name, color, intersection(selected, properties)),
              );
            }}
            ariaLabel='Intersection of selected'
            helpTitle='Create new cell set from intersection of selected sets'
          />
          <CellSetOperation
            icon={<SplitCellsOutlined />}
            onCreate={(name, color) => {
              dispatch(createCellSet(experimentId, name, color, complement(selected, properties)));
            }}
            ariaLabel='Complement of selected'
            helpTitle='Create new cell set from the complement of the selected sets'
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
              treeData={cellSetTreeData}
              onCheck={onCheck}
              store={FOCUS_TYPE}
              experimentId={experimentId}
              onNodeUpdate={onNodeUpdate}
              onNodeDelete={onNodeDelete}
              onHierarchyUpdate={onHierarchyUpdate}
              defaultExpandAll
              showHideButton
              checkedKeys={selected}
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

  if (loading) return <Skeleton active={false} title={false} />;
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
        overflow: 'scroll',
        paddingLeft: '5px',
        paddingRight: '5px',
      }}
    >
      <Space direction='vertical' style={{ width: '100%' }}>
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
export { generateFilteredCellIndices };
