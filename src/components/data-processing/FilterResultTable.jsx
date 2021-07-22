import React from 'react';
import PropTypes from 'prop-types';

import { Table, Typography, Empty } from 'antd';

const { Text, Paragraph } = Typography;

const FilterResultTable = (props) => {
  const { tableData } = props;

  const renderTable = () => {
    // loadPlotConfig returns an empty array in case plot data does not exist
    // Meanwhile, this data for this table is an object. So if tableData is an array
    // That means table data does not exist
    if (Array.isArray(tableData)) {
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

    const roundedDecimal = (number, total, decimalPoints = 2) => Math.round((number / total) * (10 ** decimalPoints)) / 10 ** decimalPoints;

    const dataSource = Object.keys(before).map((key) => ({
      key,
      title: titles[key],
      before: before[key],
      after: after[key],
      perc_removed: roundedDecimal(before[key] - after[key], before[key], 4).toFixed(4),
    }));

    const columns = [
      {
        title: '',
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
        title: '% removed',
        dataIndex: 'perc_removed',
        key: 'perc_removed',
      },
    ];

    return (
      <Table
        bordered
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size='small'
        style={{ width: '100%' }}
      />
    );
  };

  return (
    <>
      <Paragraph>
        <Text style={{ fontSize: '1.2em' }} strong>Filter statistics</Text>
      </Paragraph>
      {renderTable()}
    </>
  );
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
