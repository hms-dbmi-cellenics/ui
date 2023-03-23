import React, { useEffect, useState } from 'react';
import {
  Radio,
  Tooltip,
  Select,
  Space,
  Button,
  Card,
} from 'antd';
import Header from 'components/Header';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { loadCellSets } from 'redux/actions/cellSets';
import PropTypes from 'prop-types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { plotNames } from 'utils/constants';
import getSelectOptions from 'utils/plots/getSelectOptions';
import Loader from 'components/Loader';
import DiffExprSelectMenu from 'components/data-exploration/differential-expression-tool/DiffExprSelectMenu';

const BatchDiffExpression = (props) => {
  const { experimentId } = props;
  const [chosenOperation, setChosenOperation] = useState('fullList');
  const dispatch = useDispatch();
  const rootCellSetNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => ({ key: cellSets.properties[key].name }));
  const rootMetadataCellSetNodes = useSelector(getCellSetsHierarchyByType('metadataCategorical')).map(({ key }) => ({ key: cellSets.properties[key].name }));
  const cellSets = useSelector(getCellSets());
  const rootCellSetNames = rootCellSetNodes
    .map((cellSet) => ({ key: cellSets.properties[cellSet].name }));

  const [rootCellSet, setRootCellSet] = useState();
  const [selectedComparison, setSelectedComparison] = useState({ cellSet: '' });

  const [toComparison, setToComparison] = useState();
  useEffect(() => {
    if (!cellSets.hierarchy.length) {
      dispatch(loadCellSets(experimentId));
    }
  }, []);

  const changeOperation = (value) => {
    setChosenOperation(value.target.value);
    setSelectedComparison({ cellSet: '' });
    setToComparison({ cellSet: '' });
    setRootCellSet(null);
  };

  const renderSpecificControls = (operation) => {
    switch (operation) {
      case 'fullList':
        return (
          <>
            <div>Select the cell sets for which marker genes are to be computed in batch:</div>
            <Select
              placeholder='Select a cell set...'
              onChange={(value) => setRootCellSet(value)}
              value={rootCellSet}
              style={{ width: '40%' }}
              options={getSelectOptions(rootCellSetNames)}
            />
            <br />
          </>
        );
      case 'compareForCellSets':
        return (
          <>
            <div>
              Select the comparison sample/groups for which batch
              differential expression is to be computed:
            </div>
            <br />
            <DiffExprSelectMenu
              title='Compare sample/group:'
              option='cellSet'
              filterType='metadataCategorical'
              onSelectCluster={(cellSet) => setSelectedComparison({ cellSet })}
              value={selectedComparison.cellSet}
              selectedComparison={selectedComparison}
              cellSets={cellSets}
            />
            <DiffExprSelectMenu
              title='To sample/group:'
              option='compareWith'
              filterType='metadataCategorical'
              onSelectCluster={(cellSet) => setToComparison({ cellSet })}
              selectedComparison={selectedComparison}
              value={toComparison.cellSet}
              cellSets={cellSets}
            />
            In batch for each cell set in:
            <Select
              placeholder='Select a cell set...'
              onChange={(value) => setRootCellSet(value)}
              value={rootCellSet}
              style={{ width: '40%' }}
              options={getSelectOptions(rootCellSetNames)}
            />
          </>
        );
      case 'compareForSamples':
        return (
          <>
            <div>
              Select the comparison cell sets for which batch
              differential expression is to be computed:
            </div>
            <br />
            <DiffExprSelectMenu
              title='Compare cell set:'
              option='cellSet'
              filterType='cellSets'
              onSelectCluster={(cellSet) => setSelectedComparison({ cellSet })}
              selectedComparison={selectedComparison}
              value={selectedComparison.cellSet}
              cellSets={cellSets}
            />
            <DiffExprSelectMenu
              title='To cell set:'
              option='compareWith'
              filterType='cellSets'
              onSelectCluster={(cellSet) => setToComparison({ cellSet })}
              selectedComparison={selectedComparison}
              value={toComparison.cellSet}
              cellSets={cellSets}
            />
            In batch for each sample/group in:
            <Select
              placeholder='Select a cell set...'
              onChange={(value) => setRootCellSet(value)}
              value={rootCellSet}
              style={{ width: '40%' }}
              options={getSelectOptions(rootMetadataCellSetNodes)}
            />
          </>
        );
      default:
        return (<h1>Invalid option</h1>);
    }
  };

  if (!cellSets.accessible) {
    return (
      <center>
        <Loader experimentId={experimentId} />
      </center>
    );
  }
  return (
    <div width='60%'>
      <Header title={plotNames.BATCH_DIFFERENTIAL_EXPRESSION} />
      <Card>
        <div> Select the batch differential expression calculation to perform:</div>
        {' '}
        <br />
        <Radio.Group value={chosenOperation} onChange={(e) => { changeOperation(e); }}>
          <Space direction='vertical'>
            <Space direction='horizontal'>
              <Radio value='fullList'>
                Generate a full list of marker genes for all cell sets
              </Radio>
              <Tooltip title='Each cell set will be compared to all other cells, using all samples.'>
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
            <Radio value='compareForCellSets'>
              Compare between two selected samples/groups for all cell sets
            </Radio>
            <Radio value='compareForSamples'>
              Compare between two selected cell sets for all samples/groups
            </Radio>
          </Space>
        </Radio.Group>
        <br />
        <br />
        <Space direction='vertical'>
          {renderSpecificControls(chosenOperation)}
          <Button type='primary'>Export as CSV...</Button>
        </Space>
      </Card>
    </div>
  );
};

BatchDiffExpression.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default BatchDiffExpression;
