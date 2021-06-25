import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Space,
} from 'antd';
import _ from 'lodash';
import PropTypes from 'prop-types';
import FilterGenes from './FilterGenes';
import { changeGeneSelection } from '../../../redux/actions/genes';
import GeneSelectionStatus from '../../../redux/actions/genes/geneSelectionStatus';
import { geneTableUpdateReason } from '../../../utils/geneTable/geneTableUpdateReason';
import FocusButton from '../../FocusButton';
import PlatformError from '../../PlatformError';
import useLazyEffect from '../../../utils/useLazyEffect';
import GeneSelectionMenu from './GeneSelectionMenu';
import Loader from '../../Loader';

const GeneTable = (props) => {
  const {
    experimentId, onUpdate, error, loading, columns, data,
    total, initialTableState, width, height, onExportCSV,
  } = props;

  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [geneNameFilterState, setGeneNameFilterState] = useState({});

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
      searchPattern = '^'.concat(text);
    } else if (filterOption === 'Ends with') {
      searchPattern = text.concat('$');
    } else if (filterOption === 'Contains') {
      searchPattern = text;
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
        <FocusButton
          experimentId={experimentId}
          store='genes'
          lookupKey={key}
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
        showSorterTooltip: false,
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
        error={error}
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
        <>
          <GeneSelectionMenu onExportCSV={onExportCSV} experimentId={experimentId} />
          <FilterGenes
            onFilter={filterGenes}
            defaultFilterOption={geneNameFilterState.filterOption}
            defaultFilterString={geneNameFilterState.text}
          />
        </>
      )}
      <Table
        columns={renderColumns(columns)}
        dataSource={renderRows(data)}
        loading={loading ? { indicator: <Loader experimentId={experimentId} /> } : loading}
        size='small'
        pagination={{ ...tableState?.pagination, total }}
        sorter={tableState?.sorter}
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
