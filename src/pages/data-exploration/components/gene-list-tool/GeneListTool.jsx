import React, { useState } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Table, Space,
} from 'antd';

import PropTypes from 'prop-types';
import FilterGenes from './FilterGenes';
import { updateGeneList } from '../../../../redux/actions';

const GeneListTool = (props) => {
  const { experimentID } = props;
  const dispatch = useDispatch();

  const isLoading = useSelector((state) => state.geneList.loading);
  const rows = useSelector((state) => state.geneList.rows);
  const tableState = useSelector((state) => state.geneList.tableState);
  const [geneNamesFilter, setGeneNamesFilter] = useState(null);

  if (!tableState) {
    const defaultState = {
      pagination: {
        current: 1,
        pageSize: 15,
        showSizeChanger: true,
        total: 1,
      },
      sorter: {
        field: 'dispersions',
        order: 'descend',
      },
      geneNamesFilter,
    };

    dispatch(updateGeneList(experimentID, defaultState));
  }

  const getSortOrderIfExists = (key) => {
    if (key === tableState?.sorter.columnKey) {
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
      sortOrder: getSortOrderIfExists('gene_names'),
    },
    {
      title: 'Dispersion',
      dataIndex: 'dispersions',
      key: 'dispersions',
      sorter: true,
      sortOrder: getSortOrderIfExists('dispersions'),
      render: (num) => parseFloat(num.toFixed(3)),
    },
  ];

  const handleTableChange = (newPagination, _, newSorter) => {
    const newTableState = { pagination: newPagination, sorter: { ...newSorter }, geneNamesFilter };
    dispatch(updateGeneList(experimentID, newTableState));
  };

  const filterGenes = (searchPattern) => {
    const newTableState = { pagination: tableState.pagination, sorter: { ...tableState.sorter }, geneNamesFilter: searchPattern };
    dispatch(updateGeneList(experimentID, newTableState));
    setGeneNamesFilter(searchPattern);
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <FilterGenes filterGenes={filterGenes} />
      <Table
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        size='small'
        pagination={tableState?.pagination}
        sorter={tableState?.sorter}
        onChange={handleTableChange}
      />
    </Space>
  );
};


GeneListTool.defaultProps = {};

GeneListTool.propTypes = {
  experimentID: PropTypes.string.isRequired,
};

export default GeneListTool;
