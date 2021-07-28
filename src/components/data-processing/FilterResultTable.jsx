import React from 'react';
import PropTypes from 'prop-types';

import { Table, Empty } from 'antd';

const FilterResultTable = (props) => {
  const { tableData } = props;

  const renderTable = () => {
    // loadPlotConfig returns an empty array in case plot data does not exist
    // Meanwhile, this data for this table is an object. So if tableData is an array
    // That means table data does not exist
    if (Array.isArray(tableData)
        || !tableData?.after
        || !tableData?.before
    ) {
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    const { before, after } = tableData;

    // Rearrange data to fit table
    const titles = {
      num_cells: 'Estimated number of cells',
      total_genes: 'Total number of genes',
      median_genes: 'Median number of genes per cell',
      median_umis: 'Median UMI counts per cell',
    };

    const percentChanged = (number, total, decimalPoints = 2) => {
      const ratio = Math.round((number / total) * (10 ** decimalPoints)) / (10 ** decimalPoints);
      const percent = ratio * 100;
      const fixedDecimal = percent.toFixed(3);
      return fixedDecimal > 0 ? `+${fixedDecimal}` : `${fixedDecimal}`;
    };

    const dataSource = Object.keys(before).map((key) => ({
      key,
      title: titles[key],
      before: before[key],
      after: after[key],
      percentChanged: percentChanged(after[key] - before[key], before[key], 5),
    }));

    const columns = [
      {
        title: 'Statistics',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: '# before',
        dataIndex: 'before',
        key: 'before',
      },
      {
        title: '# after',
        dataIndex: 'after',
        key: 'after',
      },
      {
        title: '% changed',
        dataIndex: 'percentChanged',
        key: 'percentChanged',
      },
    ];

    return (
      <Table
        bordered
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size='small'
      />
    );
  };

  return renderTable();
};

const filterTableDataShape = PropTypes.shape({
  before: PropTypes.object,
  after: PropTypes.object,
}).isRequired;

FilterResultTable.propTypes = {
  tableData: PropTypes.oneOfType([
    PropTypes.array,
    filterTableDataShape,
  ]).isRequired,
};

export default FilterResultTable;
