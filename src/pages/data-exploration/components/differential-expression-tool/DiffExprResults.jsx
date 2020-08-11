import React, { useState } from 'react';

import {
  useSelector,
} from 'react-redux';

import {
  Space, Button,
} from 'antd';

import _ from 'lodash';

import PropTypes from 'prop-types';

import GeneTable from '../gene-list-tool/GeneTable';

const DiffExprResults = (props) => {
  const {
    experimentId, onGoBack, width, height,
  } = props;

  const loading = useSelector((state) => state.differentialExpression.properties.loading);
  const data = useSelector((state) => state.differentialExpression.properties.data);
  const total = useSelector((state) => state.differentialExpression.properties.total);

  const [dataShown, setDataShown] = useState(data);

  const columns = [
    {
      title: 'p-value',
      key: 'pval',
      render: (num) => num.toExponential(3),
      sorter: true,
    },
    {
      title: 'q-value',
      key: 'qval',
      render: (num) => num.toExponential(3),
      sorter: true,
    },
    {
      title: 'log2 fold change',
      key: 'log2fc',
      render: (num) => parseFloat(num.toFixed(3)),
      sorter: true,
    },
  ];


  const onUpdate = (newState) => {
    // Apply sorting
    const { field: sortField, order: sortOrder } = newState.sorter;
    let newData = _.orderBy(data, [sortField], [(sortOrder === 'ascend') ? 'asc' : 'desc']);

    // Apply pagination
    const { current, pageSize: limit } = newState.pagination;
    const offset = ((current - 1) * limit);
    newData = newData.slice(offset, offset + limit);

    setDataShown(newData);
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Button size='small' onClick={onGoBack}>Go Back</Button>
      <GeneTable
        experimentId={experimentId}
        initialTableState={{
          sorter: {
            field: 'qval',
            columnKey: 'qval',
            order: 'ascend',
          },
        }}
        onUpdate={onUpdate}
        columns={columns}
        loading={loading}

        // This component only loads when we already have data saved in the store,
        // so error conditions never happen.
        // This will change once we use pagination to fetch partial views of
        // differential expression dynamically.
        error={false}

        width={width}
        height={height}
        data={dataShown}
        total={total}
      />
    </Space>
  );
};

DiffExprResults.defaultProps = {};

DiffExprResults.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onGoBack: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};


export default DiffExprResults;
