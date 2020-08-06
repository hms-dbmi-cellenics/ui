import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Space, Button, Typography, Empty, Skeleton,
} from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import FilterGenes from './FilterGenes';
import { changeGeneSelection, setFocusedGene, loadPaginatedGeneProperties } from '../../../../redux/actions/genes';
import GeneSelectionStatus from '../../../../redux/actions/genes/geneSelectionStatus';

import GeneLookupButton from './GeneLookupButton';
import isBrowser from '../../../../utils/environment';

const { Text } = Typography;

const GeneListTool = (props) => {
  const { experimentId } = props;

  // eslint-disable-next-line react/destructuring-assignment
  const [tableUuid] = useState(props.uuid || uuidv4());

  const dispatch = useDispatch();
  const focusedGene = useSelector((state) => state.genes.focused);
  const selectedGenes = useSelector((state) => state.genes.selected);

  const properties = useSelector((state) => state.genes.properties.data);
  const propertiesLoading = useSelector((state) => state.genes.properties.loading);

  const viewState = useSelector((state) => state.genes.properties.views[tableUuid]);
  const error = useSelector((state) => state.genes.properties.views[tableUuid]?.error);
  const componentFetching = useSelector(
    (state) => state.genes.properties.views[tableUuid]?.fetching,
  );
  const tableRowKeys = useSelector((state) => state.genes.properties.views[tableUuid]?.data);
  const totalResults = useSelector((state) => state.genes.properties.views[tableUuid]?.total);

  const [tableRows, setTableRows] = useState([]);

  const [geneNamesFilter, setGeneNamesFilter] = useState(null);
  const PROPERTIES = ['dispersions'];

  if (!isBrowser) {
    return (<Skeleton active />);
  }

  const [tableState, setTableState] = useState(
    {
      pagination: {
        current: 1,
        pageSize: 50,
        showSizeChanger: true,
        total: 1,
      },
      sorter: {
        field: 'dispersions',
        order: 'descend',
      },
      geneNamesFilter,
    },
  );

  const isTableLoading = () => {
    // Load if the view is not yet created (pre-dispatch).
    if (!viewState) {
      return true;
    }

    // Load if the view is actively fetching (post-dispatch, pre-result).
    if (componentFetching) {
      return true;
    }

    // Load if anything is updating the properties we are listening for.
    if (_.intersection(PROPERTIES, propertiesLoading).length > 0) {
      return true;
    }

    return false;
  };

  // On initial render, start loading the data for the initial state.
  useEffect(() => {
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, tableUuid, tableState));
  }, []);

  // When data or focus changes, update rows.
  useEffect(() => {
    if (!tableRowKeys) {
      return;
    }

    const newRows = [];

    tableRowKeys.forEach((key) => {
      newRows.push({
        key,
        gene_names: key,
        dispersions: properties[key].dispersions,
        lookup: (
          <GeneLookupButton
            focused={key === focusedGene}
            onClick={() => {
              if (key !== focusedGene) {
                dispatch(setFocusedGene(experimentId, key));
              } else {
                dispatch(setFocusedGene(experimentId, undefined));
              }
            }}
          />
        ),
      });
    });

    setTableRows(newRows);
  }, [tableRowKeys, focusedGene]);

  // Update total results if changes.
  useEffect(() => {
    if (!totalResults) {
      return;
    }

    setTableState({
      ...tableState,
      pagination: {
        ...tableState.pagination,
        total: totalResults,
      },
    });
  }, [totalResults]);

  const getSortOrder = (key) => {
    if (key === tableState.sorter.columnKey) {
      return tableState.sorter.order;
    }
    return null;
  };

  const columns = [
    {
      title: 'Gene',
      dataIndex: 'gene_names',
      key: 'gene_names',
      sorter: true,
      render: (geneName) => (
        <a
          href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${geneName}`}
          target='_blank'
          rel='noreferrer'
        >
          {geneName}
        </a>
      ),
      sortOrder: getSortOrder('gene_names'),
    },
    {
      title: '',
      dataIndex: 'lookup',
      key: 'lookup',
    },
    {
      title: 'Dispersion',
      dataIndex: 'dispersions',
      key: 'dispersions',
      sorter: true,
      sortOrder: getSortOrder('dispersions'),
      render: (num) => parseFloat(num.toFixed(3)),
    },
  ];

  const handleTableChange = (newPagination, a, newSorter) => {
    const newTableState = { pagination: newPagination, sorter: { ...newSorter }, geneNamesFilter };
    setTableState(newTableState);
    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, tableUuid, newTableState));
  };

  const filterGenes = (searchPattern) => {
    const newTableState = {
      pagination: { ...tableState.pagination, current: 1 },
      sorter: { ...tableState.sorter },
      geneNamesFilter: searchPattern,
    };

    dispatch(loadPaginatedGeneProperties(experimentId, PROPERTIES, tableUuid, newTableState));
    setTableState(newTableState);
    setGeneNamesFilter(searchPattern);
  };

  const rowSelection = {
    onSelect: (gene, selected) => {
      dispatch(changeGeneSelection(experimentId, [gene.key],
        (selected) ? GeneSelectionStatus.select : GeneSelectionStatus.deselect));
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
      // changeRows returns the row objects for all genes that were affected
      // by the (de)selection event.
      const genes = [];
      changeRows.forEach((row) => genes.push(row.gene_names));

      dispatch(changeGeneSelection(experimentId, genes,
        (selected) ? GeneSelectionStatus.select : GeneSelectionStatus.deselect));
    },
  };

  const clearAll = () => {
    dispatch(changeGeneSelection(experimentId, selectedGenes, GeneSelectionStatus.deselect));
  };

  const selectionIndicator = () => {
    if (selectedGenes.length === 0) {
      return <></>;
    }
    return (
      <Text type='secondary'>
        {selectedGenes.length}
        &nbsp;gene
        {selectedGenes.length === 1 ? '' : 's'}
        &nbsp;selected
        <Button type='link' onClick={clearAll}>Clear</Button>
      </Text>
    );
  };

  // The gene list couldn't load.
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
          onClick={() => dispatch(
            loadPaginatedGeneProperties(experimentId, PROPERTIES, tableUuid, tableState),
          )}
        >
          Try again
        </Button>
      </Empty>
    );
  }

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {isTableLoading() ? <></> : (
        <Space>
          <FilterGenes filterGenes={filterGenes} />
          {selectionIndicator()}
        </Space>
      )}
      <Table
        columns={columns}
        dataSource={tableRows}
        loading={isTableLoading()}
        size='small'
        pagination={tableState?.pagination}
        sorter={tableState?.sorter}
        scroll={{ x: 200, y: 350 }}
        onChange={handleTableChange}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedGenes,
          ...rowSelection,
        }}
      />
    </Space>
  );
};


GeneListTool.defaultProps = {
  uuid: undefined,
};

GeneListTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
  uuid: PropTypes.string,
};

export default GeneListTool;
