import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Table, Space, Tooltip,
} from 'antd';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { changeGeneSelection } from 'redux/actions/genes';
import GeneSelectionStatus from 'redux/actions/genes/geneSelectionStatus';
import FocusButton from 'components/FocusButton';
import PlatformError from 'components/PlatformError';
import GeneSelectionMenu from 'components/data-exploration/generic-gene-table/GeneSelectionMenu';
import FilterGenes, { sanitizeString } from 'components/data-exploration/generic-gene-table/FilterGenes';
import Loader from 'components/Loader';

const valueComparator = (key) => (a, b) => {
  if (typeof a[key] === 'string') return a[key].localeCompare(b[key]);
  if (typeof a[key] === 'number') return a[key] - b[key];
  return 0;
};

const GeneTable = (props) => {
  const {
    experimentId, error, loading, columns, propData, loadData,
    total, initialTableState, width, height, extraOptions, geneColumnTooltipText,
  } = props;

  const dispatch = useDispatch();
  const selectedGenes = useSelector((state) => state.genes.selected);
  const [geneNameFilterState, setGeneNameFilterState] = useState({});

  const tableStateAllEntries = {
    pagination: {
      current: 1,
      pageSize: 1000000,
      showSizeChanger: true,
      total,
    },
    geneNamesFilter: null,
  };

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    setTableData(propData);
  }, [propData]);

  const [tableState, setTableState] = useState(
    _.merge(
      tableStateAllEntries,
      initialTableState,
    ),
  );

  // Load all entries and then set table state to display only 50
  useEffect(() => {
    loadData(tableStateAllEntries);
    setTableState(
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
  }, []);

  const getSortOrder = (key) => {
    if (key === tableState.sorter.columnKey) {
      return tableState.sorter.order;
    }
    return null;
  };

  const handleTableChange = (newPagination, a, newSorter) => {
    const newTableState = { ...tableState, pagination: newPagination, sorter: newSorter };

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

    let newData = _.cloneDeep(propData);
    newData = newData.filter((entry) => sanitizeString(`${entry.gene_names}`).match(searchPattern));

    const newTableState = {
      ...tableState,
      pagination: { ...tableState.pagination, current: 1, total: newData.length },
      geneNamesFilter: searchPattern,
    };

    setTableData(newData);
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
        fixed: 'left',
        title: '',
        dataIndex: 'lookup',
        key: 'lookup',
        width: '50px',
      },
      {
        fixed: 'left',
        title: (
          geneColumnTooltipText
            ? (
              <Tooltip
                title={geneColumnTooltipText}
                placement='top'
                trigger='hover'
              >
                Gene
              </Tooltip>
            )
            : 'Gene'
        ),
        dataIndex: 'gene_names',
        key: 'gene_names',
        sorter: valueComparator('gene_names'),
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
        modifiedColumn.sorter = valueComparator(column.key);
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
        onClick={() => loadData(tableStateAllEntries)}
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
          <GeneSelectionMenu extraOptions={extraOptions} experimentId={experimentId} />
          <FilterGenes
            onFilter={filterGenes}
            defaultFilterOption={geneNameFilterState.filterOption}
            defaultFilterString={geneNameFilterState.text}
          />
        </>
      )}
      <Table
        columns={renderColumns(columns)}
        dataSource={renderRows(tableData)}
        loading={loading ? { indicator: <Loader experimentId={experimentId} /> } : loading}
        size='small'
        pagination={{ ...tableState?.pagination }}
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
  extraOptions: null,
  geneColumnTooltipText: null,
};

GeneTable.propTypes = {
  experimentId: PropTypes.string.isRequired,
  columns: PropTypes.array.isRequired,
  propData: PropTypes.array.isRequired,
  loadData: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired,
  error: PropTypes.PropTypes.oneOfType(
    [
      PropTypes.string,
      PropTypes.bool,
    ],
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  initialTableState: PropTypes.object,
  extraOptions: PropTypes.node,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  geneColumnTooltipText: PropTypes.string,
};

export default GeneTable;
