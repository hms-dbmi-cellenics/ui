import React from 'react';
import PropTypes from 'prop-types';

import { Table, Typography } from 'antd';

const { Text, Paragraph } = Typography;

const FilterResultTable = (props) => {
  console.log(props);

  const { tableData: { before, after } } = props;

  // Rearrange data to fit table
  const titles = {
    num_cells: 'Estimated number of cells',
    total_genes: 'Total number of genes',
    median_genes: 'Median number of genes per cell',
    median_umis: 'Median UMI counts per cell',
  };

  const roundedDecimal = (number, total, decimalPoints = 2) => Math.round((number / total) * (10 ** decimalPoints)) / 10 ** decimalPoints;

  const dataSource = Object.keys(before).map((key) => ({
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
    <>
      <Paragraph>
        <Text style={{ fontSize: '1.2em' }} strong>Filter statistics</Text>
      </Paragraph>
      <Table
        bordered
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        size='small'
        style={{ width: '100%' }}
      />
    </>
  );
};

FilterResultTable.propTypes = {
  tableData: PropTypes.shape({
    before: PropTypes.object,
    after: PropTypes.object,
  }).isRequired,
};

export default FilterResultTable;
