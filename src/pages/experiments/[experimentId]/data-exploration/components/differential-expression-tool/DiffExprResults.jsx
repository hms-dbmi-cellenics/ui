import React, { useState, useEffect } from 'react';

import {
  useSelector,
  useDispatch,
} from 'react-redux';

import {
  Space, Button,
} from 'antd';

import PropTypes from 'prop-types';

import GeneTable from '../generic-gene-table/GeneTable';

import { geneTableUpdateReason } from '../../../../../../utils/geneTable/geneTableUpdateReason';

import loadDifferentialExpression from '../../../../../../redux/actions/loadDifferentialExpression';

const DiffExprResults = (props) => {
  const {
    experimentId, onGoBack, cellSets, width, height,
  } = props;

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.differentialExpression.properties.loading);
  const data = useSelector((state) => state.differentialExpression.properties.data);
  const total = useSelector((state) => state.differentialExpression.properties.total);
  const error = useSelector((state) => state.differentialExpression.properties.error);

  const [dataShown, setDataShown] = useState(data);

  const columns = [
    {
      title: 'p value',
      key: 'pval',
      render: (num) => num.toExponential(1),
      sorter: true,
    },
    {
      title: 'q value',
      key: 'qval',
      render: (num) => num.toExponential(1),
      sorter: true,
    },
    {
      title: 'log2 FC',
      key: 'log2fc',
      render: (num) => parseFloat(num.toFixed(1)),
      sorter: true,
    },
  ];

  // When data changes, update rows.
  useEffect(() => {
    if (data) {
      setDataShown(data);
    }
  }, [data]);

  const isTableLoading = () => data.length === 0 || loading;

  const onUpdate = (newState, reason) => {
    // We handle `loading` and `loaded` in the HOC, no need to react to these.
    if (reason === geneTableUpdateReason.loaded || reason === geneTableUpdateReason.loading) {
      return;
    }

    dispatch(
      loadDifferentialExpression(experimentId, cellSets, newState),
    );
  };

  console.warn('rendering results gene table', cellSets);


  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      <Button type='primary' size='small' onClick={onGoBack}>Go Back</Button>
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
        loading={isTableLoading()}
        error={error}
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
  cellSets: PropTypes.object.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};


export default DiffExprResults;
