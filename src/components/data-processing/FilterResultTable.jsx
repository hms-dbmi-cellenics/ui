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
      num_cells: 'Number of cells',
      total_genes: 'Number of genes detected',
      median_genes: 'Median number of genes per cell',
      median_umis: 'Median UMI counts per cell',
    };

    // Shows the absolute change followed by the percentage in brackets,
    // e.g. "-423 (0.1%)". Percentage is omitted when the "before" value is 0.
    const formatChange = (beforeValue, afterValue) => {
      const diff = afterValue - beforeValue;
      const signedDiff = diff > 0 ? `+${diff}` : `${diff}`;

      if (!beforeValue) return signedDiff;

      const percent = (diff / beforeValue) * 100;
      const fixedPercent = Math.abs(percent).toFixed(1);
      return `${signedDiff} (${fixedPercent}%)`;
    };

    const dataSource = Object.keys(before).map((key) => ({
      key,
      title: titles[key],
      before: before[key],
      after: after[key],
      change: formatChange(before[key], after[key]),
    }));

    const columns = [
      {
        fixed: 'left',
        title: 'Statistic',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: 'Before',
        dataIndex: 'before',
        key: 'before',
        align: 'right',
      },
      {
        title: 'After',
        dataIndex: 'after',
        key: 'after',
        align: 'right',
      },
      {
        title: 'Change (%)',
        dataIndex: 'change',
        key: 'change',
        align: 'right',
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
