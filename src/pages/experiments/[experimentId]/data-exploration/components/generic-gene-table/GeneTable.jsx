import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Space, Skeleton,
} from 'antd';
import _ from 'lodash';
import PropTypes from 'prop-types';
import FilterGenes from './FilterGenes';
import { changeGeneSelection, setFocusedGene } from '../../../../../../redux/actions/genes';
import GeneSelectionStatus from '../../../../../../redux/actions/genes/geneSelectionStatus';
import { geneTableUpdateReason } from '../../../../../../utils/geneTable/geneTableUpdateReason';

import GeneLookupButton from './GeneLookupButton';
import isBrowser from '../../../../../../utils/environment';
import PlatformError from '../../../../../../components/PlatformError';
import useLazyEffect from '../../../../../../utils/useLazyEffect';
import SelectionIndicator from './SelectionIndicator';
import ListSelected from './ListSelected';

const GeneTable = (props) => {
  const {
    experimentId, onUpdate, error, loading, columns, data,
    total, initialTableState, width, height, onExportCSV,
  } = props;

  const dispatch = useDispatch();
  const focusedGene = useSelector((state) => state.genes.focused);
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [geneNameFilterState, setGeneNameFilterState] = useState({});

  if (!isBrowser) {
    return (<Skeleton active />);
  }

  const [tableState, setTableState] = useState(
    _.merge(
      {
        pagination: {
          current: 1,
          pageSize: 50,
          showSizeChanger: true,
          total,
        },
        geneNamesFilter: null,
      },
      initialTableState,
    ),
  );

  useEffect(() => {
    onUpdate(tableState, geneTableUpdateReason.mounted);
  }, []);

  useLazyEffect(() => {
    onUpdate(tableState, loading ? geneTableUpdateReason.loading : geneTableUpdateReason.loaded);
  }, [loading]);

  const getSortOrder = (key) => {
    if (key === tableState.sorter.columnKey) {
      return tableState.sorter.order;
    }
    return null;
  };

  const handleTableChange = (newPagination, a, newSorter) => {
    const newTableState = { ...tableState, pagination: newPagination, sorter: { ...newSorter } };

    onUpdate(newTableState, geneTableUpdateReason.paginated);
    setTableState(newTableState);
  };

  const filterGenes = (filter) => {
    const { filterOption, text } = filter;

    let searchPattern;
    if (filterOption === 'Starts with') {
      searchPattern = text.concat('%');
    } else if (filterOption === 'Ends with') {
      searchPattern = '%'.concat(text);
    } else if (filterOption === 'Contains') {
      searchPattern = '%'.concat(text, '%');
    }

    const newTableState = {
      ...tableState,
      pagination: { ...tableState.pagination, current: 1 },
      geneNamesFilter: searchPattern,
    };

    onUpdate(newTableState, geneTableUpdateReason.filtered);
    setTableState(newTableState);
    setGeneNameFilterState(filter);
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

  /**
   * Render rows and decorate them appropriately (e.g., adding a focus button)
   */
  const renderRows = (rows) => rows.map((row) => {
    const key = row.gene_names;

    return {
      ...row,
      key,
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
    };
  });

  /**
   * Render column data to be inserted into antd Table from a supplied column list.
   */
  const renderColumns = (propColumns) => {
    const baseColumns = [
      {
        title: '',
        dataIndex: 'lookup',
        key: 'lookup',
        width: '50px',
      },
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
    ];

    const newColumns = propColumns.map((column) => {
      const modifiedColumn = { ...column, dataIndex: column.key };

      if (column.sorter) {
        modifiedColumn.sortOrder = getSortOrder(column.key);
      }

      return modifiedColumn;
    });

    return [...baseColumns, ...newColumns];
  };

  // The gene list couldn't load.
  if (error) {
    return (
      <PlatformError
        description={error}
        onClick={() => onUpdate(tableState, geneTableUpdateReason.retry)}
      />
    );
  }

  return (
    <Space
      direction='vertical'
      style={{ width: '100%' }}
    >
      {loading ? <></> : (
        <Space direction='vertical' style={{ width: '100%' }}>
          <SelectionIndicator
            experimentId={experimentId}
            showCSV={onExportCSV !== null}
            onExportCSV={onExportCSV}
          />
          <ListSelected />
          <FilterGenes
            onFilter={filterGenes}
            defaultFilterOption={geneNameFilterState.filterOption}
            defaultFilterString={geneNameFilterState.text}
          />
        </Space>
      )}
      <Table
        columns={renderColumns(columns)}
        dataSource={renderRows(data)}
        loading={loading}
        size='small'
        pagination={{ ...tableState ?.pagination, total }}
        sorter={tableState ?.sorter}
        scroll={{ x: width, y: height - 294 }}
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

GeneTable.defaultProps = {
  initialTableState: {},
  onExportCSV: null,
};

GeneTable.propTypes = {
  experimentId: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired,
  data: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  error: PropTypes.PropTypes.oneOfType(
    [
      PropTypes.string,
      PropTypes.bool,
    ],
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  initialTableState: PropTypes.object,
  onExportCSV: PropTypes.func,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default GeneTable;
