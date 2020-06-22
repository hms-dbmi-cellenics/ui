import React, { useState, useEffect } from 'react';
import {
  useSelector,
} from 'react-redux';

import {
  Table, Space, Button,
} from 'antd';

import PropTypes from 'prop-types';

const DiffExprResults = (props) => {
  const { onGoBack } = props;

  const isLoading = useSelector((state) => state.diffExpr.loading);
  const allData = useSelector((state) => state.diffExpr.allData);
  const total = useSelector((state) => state.diffExpr.total);

  const defaultState = {
    pagination: {
      current: 1,
      pageSize: 50,
      showSizeChanger: true,
      total,
    },
  };
  const [tableState, setTableState] = useState(defaultState);
  const [rows, setRows] = useState([]);

  const updateRows = (newTableState) => {
    const currentPage = newTableState?.pagination.current
      || tableState?.pagination.current
      || 1;

    const currentPageSize = newTableState?.pagination.pageSize
      || tableState?.pagination.pageSize
      || 1;
    const offset = ((currentPage - 1) * currentPageSize);
    const limit = currentPageSize;

    if (allData) {
      if (offset + limit > total) {
        setRows(allData.slice(offset));
      } else {
        setRows(allData.slice(offset, limit + offset));
      }
    }
  };

  useEffect(() => {
    updateRows();
  }, [tableState, allData]);

  useEffect(() => {
    const { current, pageSize, showSizeChanger } = tableState.pagination;
    setTableState(
      {
        pagination: {
          current,
          pageSize,
          showSizeChanger,
          total,
        },
      },
    );
  }, [total]);

  const columns = [
    {
      title: 'Gene',
      dataIndex: 'gene_names',
      key: 'gene_names',
      render: (geneName) => (
        <a
          href={`https://www.genecards.org/cgi-bin/carddisp.pl?gene=${geneName}`}
          target='_blank'
          rel='noreferrer'
        >
          {geneName}
        </a>
      ),
    },
    {
      title: 'pValue',
      dataIndex: 'pval',
      key: 'pval',
      render: (num) => num.toExponential(3),
    },
    {
      title: 'qValue',
      dataIndex: 'qval',
      key: 'qval',
      render: (num) => num.toExponential(3),
    },
    {
      title: 'Log2 Fold Change',
      dataIndex: 'log2fc',
      key: 'log2fc',
      render: (num) => parseFloat(num.toFixed(3)),
    },
  ];


  const handleTableChange = (newPagination) => {
    const newTableState = { pagination: newPagination };
    setTableState(newTableState);
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>

      <Button size='small' onClick={onGoBack}>Go Back</Button>
      <Table
        columns={columns}
        dataSource={rows}
        loading={isLoading}
        size='small'
        pagination={tableState?.pagination}
        scroll={{ x: 200, y: 500 }}
        onChange={handleTableChange}
      />
    </Space>
  );
};

DiffExprResults.defaultProps = {};

DiffExprResults.propTypes = {
  onGoBack: PropTypes.func.isRequired,
};


export default DiffExprResults;
