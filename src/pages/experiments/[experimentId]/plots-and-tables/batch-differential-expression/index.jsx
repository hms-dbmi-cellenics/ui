import React, { useEffect, useState } from 'react';
import {
  Radio,
  Tooltip,
  Select,
  Space,
  Button,
  Card,
  Form,
} from 'antd';
import Header from 'components/Header';
import { getCellSetsHierarchyByType, getCellSets } from 'redux/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { loadCellSets } from 'redux/actions/cellSets';
import PropTypes from 'prop-types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { plotNames } from 'utils/constants';
import getSelectOptions from 'utils/plots/getSelectOptions';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Loader from 'components/Loader';
import DiffExprSelectMenu from 'components/data-exploration/differential-expression-tool/DiffExprSelectMenu';
import getBatchDiffExpr from 'utils/differentialExpression/getBatchDiffExpr';
import getCellSetsHierarchyByName from 'redux/selectors/cellSets/getCellSetsHierarchyByName';
import ExportAsCSV from 'components/plots/ExportAsCSV';
import _ from 'lodash';

dayjs.extend(utc);

const BatchDiffExpression = (props) => {
  const { experimentId } = props;
  const [chosenOperation, setChosenOperation] = useState('fullList');
  const dispatch = useDispatch();
  const cellSets = useSelector(getCellSets());

  const rootCellSetNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => ({ key: cellSets.properties[key].name }));
  const rootMetadataCellSetNodes = useSelector(getCellSetsHierarchyByType('metadataCategorical')).map(({ key }) => ({ key: cellSets.properties[key].name }));

  const [dataLoading, setDataLoading] = useState();
  const [csvData, setCsvData] = useState([]);
  const [filename, setFilename] = useState();

  const comparisonInitialState = {
    cellSet: null,
    compareWith: null,
    basis: null,
    comparisonType: null,
  };
  const [comparison, setComparison] = useState(comparisonInitialState);

  useEffect(() => {
    if (!cellSets.hierarchy.length) {
      dispatch(loadCellSets(experimentId));
    }
  }, []);

  const changeOperation = (value) => {
    setComparison(comparisonInitialState);
    setCsvData([]);
    setDataLoading(false);

    setChosenOperation(value.target.value);
    const comparisonTypes = {
      fillList: 'within',
      compareForCellSets: 'within',
      compareForSamples: 'between',
    };
    changeComparison('comparisonType', comparisonTypes[value.target.value]);
  };

  const changeComparison = (key, value) => {
    setCsvData([]);
    const newComparison = _.cloneDeep(comparison);
    newComparison[key] = value;
    setComparison(newComparison);
  };

  const getData = async () => {
    setDataLoading(true);
    const {
      cellSet, compareWith, basis, comparisonType,
    } = comparison;
    console.log('COMPARISON ', comparison);
    const batchHierarchy = getCellSetsHierarchyByName(basis)(cellSets);
    const batchClusterNames = batchHierarchy[0].children.map((cluster) => cluster.key);

    const comparisonObject = {
      cellSet,
      compareWith,
      basis: batchClusterNames,
    };
    const data = await dispatch(getBatchDiffExpr(experimentId, comparisonObject, comparisonType));

    const date = dayjs.utc().format('YYYY-MM-DD-HH-mm-ss');
    setFilename(`BatchDE_${experimentId}_${cellSet}_vs_${compareWith}_${date}.csv`);
    setCsvData(data);
    setDataLoading(false);
    console.log('DATA IS ', data);
  };

  const renderSpecificControls = (operation) => {
    switch (operation) {
      case 'fullList':
        return (
          <>
            <div>Select the cell sets for which marker genes are to be computed in batch:</div>
            <br />
            <Select
              placeholder='Select a cell set...'
              onChange={(value) => changeComparison('basis', value)}
              value={comparison.basis}
              style={{ width: '40%' }}
              options={getSelectOptions(rootCellSetNodes)}
            />
            <br />
          </>
        );
      case 'compareForCellSets':
        return (
          <>
            Select the comparison sample/groups for which batch
            differential expression is to be computed:
            <br />
            <DiffExprSelectMenu
              title='Compare sample/group:'
              option='cellSet'
              filterType='metadataCategorical'
              onSelectCluster={(cellSet) => changeComparison('cellSet', cellSet)}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.cellSet}
              cellSets={cellSets}
            />
            <DiffExprSelectMenu
              title='To sample/group:'
              option='compareWith'
              filterType='metadataCategorical'
              onSelectCluster={(cellSet) => changeComparison('compareWith', cellSet)}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.compareWith}
              cellSets={cellSets}
            />

            In batch for each cell set in:
            <Select
              placeholder='Select a cell set...'
              onChange={(value) => changeComparison('basis', value)}
              value={comparison.basis}
              style={{ width: '33.5%' }}
              options={getSelectOptions(rootCellSetNodes)}
            />
          </>
        );
      case 'compareForSamples':
        return (
          <>
            Select the comparison cell sets for which batch
            differential expression is to be computed:
            <br />
            <DiffExprSelectMenu
              title='Compare cell set:'
              option='cellSet'
              filterType='cellSets'
              onSelectCluster={(cellSet) => changeComparison('cellSet', cellSet)}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.cellSet}
              cellSets={cellSets}
            />
            <DiffExprSelectMenu
              title='To cell set:'
              option='compareWith'
              filterType='cellSets'
              onSelectCluster={(cellSet) => changeComparison('compareWith', cellSet)}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.compareWith}
              cellSets={cellSets}
            />

            In batch for each sample/group in:
            <Select
              placeholder='Select samples or metadata...'
              onChange={(value) => changeComparison('basis', value)}
              value={comparison.basis}
              style={{ width: '34%' }}
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
        <Form size='small' layout='vertical'>

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
            <br />
            <Space direction='horizontal'>
              <ExportAsCSV type='primary' size='large' disabled={!csvData.length} data={csvData} filename={filename} />
              <Button loading={dataLoading} size='large' onClick={getData} disabled={csvData.length}> Compute </Button>
            </Space>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

BatchDiffExpression.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default BatchDiffExpression;
