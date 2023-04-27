import React, { useEffect, useState, useCallback } from 'react';
import {
  Radio,
  Tooltip,
  Select,
  Space,
  Button,
  Card,
  Form,
  Alert,
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
import getBatchDiffExpr from 'utils/differentialExpression/getBatchDiffExpr';
import getCellSetsHierarchyByName from 'redux/selectors/cellSets/getCellSetsHierarchyByName';
import { zipSync } from 'fflate';
import { saveAs } from 'file-saver';
import checkCanRunDiffExpr, { canRunDiffExprResults } from 'utils/differentialExpression/checkCanRunDiffExpr';

import _ from 'lodash';

const BatchDiffExpression = (props) => {
  const { experimentId } = props;
  const [chosenOperation, setChosenOperation] = useState('fullList');
  const dispatch = useDispatch();
  const cellSets = useSelector(getCellSets());
  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);
  const rootCellSetNodes = useSelector(getCellSetsHierarchyByType('cellSets')).map(({ key }) => ({ key: cellSets.properties[key].name }));
  const rootMetadataCellSetNodes = useSelector(getCellSetsHierarchyByType('metadataCategorical')).map(({ key }) => ({ key: cellSets.properties[key].name }));

  const [dataLoading, setDataLoading] = useState();
  const [csvData, setCsvData] = useState([]);

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

  useEffect(() => {
    setCsvData([]);
    setDataLoading(false);

    setChosenOperation(chosenOperation);
    const comparisonTypes = {
      fullList: 'within',
      compareForCellSets: 'within',
      compareForSamples: 'between',
    };
    setComparison({ ...comparisonInitialState, comparisonType: comparisonTypes[chosenOperation] });
  }, [chosenOperation]);

  const changeComparison = (key, value) => {
    setCsvData([]);
    const newComparison = _.cloneDeep(comparison);
    newComparison[key] = value;
    setComparison(newComparison);
  };

  const getBatchClusterNames = (basis) => {
    const batchHierarchy = getCellSetsHierarchyByName(basis)(cellSets);
    const batchClusterNames = batchHierarchy[0].children.map((cluster) => cluster.key);
    return batchClusterNames;
  };

  const canRunDiffExpr = (comparisonGroup) => {
    const { properties, hierarchy } = cellSets;
    return checkCanRunDiffExpr(
      properties,
      hierarchy,
      { [comparisonGroup.comparisonType]: comparisonGroup },
      comparisonGroup.comparisonType,
      true,
    );
  };
  const isFormValid = useCallback(() => {
    const { cellSet, compareWith, basis } = comparison;
    if (!basis) return false;
    const batchClusterNames = getBatchClusterNames(basis);

    if (cellSet && compareWith && basis) {
      const results = batchClusterNames.map((currentBasis) => (
        canRunDiffExpr({ ...comparison, basis: currentBasis })));
      console.log('LOOK AT RESULTS LOL ', results);
      return results;
    }
    if (chosenOperation === 'fullList' && basis) {
      const results = batchClusterNames.map((currentBasis) => (
        canRunDiffExpr({
          ...comparison, basis: 'all', compareWith: 'background', cellSet: currentBasis,
        })));
      return results;
    }
    return false;
  }, [comparison, chosenOperation]);

  const downloadCSVsAsZip = (data) => {
    const encoder = new TextEncoder();
    const archiveName = `batchDE_${experimentName}`;

    const batchClusterNames = getBatchClusterNames(comparison.basis);
    const CSVs = data.reduce((accumulator, currentData, indx) => {
      let csvString;
      let fileName;
      if (!currentData.error) {
        // Get the column names from the keys of the first object in currentData
        const columnNames = Object.keys(currentData[0]).join(',');
        const csvRows = currentData.map((obj) => Object.values(obj).join(','));

        // Add the column names as the first row and join the CSV data with new lines
        csvString = `${columnNames}\n${csvRows.join('\n')}`;
        fileName = `DE-${batchClusterNames[indx]}.csv`;
      } else {
        // If currentData[0] is not an array, include the error message in the CSV file
        csvString = `error\n${currentData.error}`;
        fileName = `DE-${batchClusterNames[indx]}-error.csv`;
      }

      const encodedString = encoder.encode(csvString);
      accumulator[fileName] = encodedString;
      return accumulator;
    }, {});

    const zipped = zipSync({ [archiveName]: CSVs });

    const blob = new Blob([zipped], { type: 'application/zip' });
    saveAs(blob, archiveName);
  };

  const getData = async () => {
    setDataLoading(true);
    const {
      cellSet, compareWith, basis, comparisonType,
    } = comparison;

    let comparisonObject = {};
    const batchClusterNames = getBatchClusterNames(basis);

    if (chosenOperation === 'fullList') {
      comparisonObject = {
        cellSet: batchClusterNames,
        compareWith: 'background',
        basis: ['all'],
      };
    } else {
      comparisonObject = {
        cellSet: [cellSet],
        compareWith,
        basis: batchClusterNames,
      };
    }
    const data = await dispatch(getBatchDiffExpr(experimentId, comparisonObject, comparisonType));
    setCsvData(data);
    setDataLoading(false);
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
        console.log('select optionsss ', getSelectOptions(rootCellSetNodes));
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
  console.log('csvData.length || !isFormValid(),', csvData.length || !isFormValid());
  return (
    <div width='60%'>
      <Header title={plotNames.BATCH_DIFFERENTIAL_EXPRESSION} />
      <Card>
        <div> Select the batch differential expression calculation to perform:</div>
        {' '}
        <br />
        <Form size='small' layout='vertical'>

          <Radio.Group value={chosenOperation} onChange={(e) => { setChosenOperation(e.target.value); }}>
            <Space direction='vertical'>
              <Space direction='horizontal'>
                <Radio value='fullList'>
                  Generate a full list of marker genes for all cell sets
                  {'   '}
                  <Tooltip title='Each cell set will be compared to all other cells, using all samples.'>
                    <InfoCircleOutlined />
                  </Tooltip>
                </Radio>
              </Space>
              <Radio value='compareForCellSets'>
                Compare two selected samples/groups within a cell set for all cell sets
              </Radio>
              <Radio value='compareForSamples'>
                Compare between two cell sets for all samples/groups
              </Radio>
            </Space>
          </Radio.Group>

          <br />
          <br />
          <Space direction='vertical'>
            {renderSpecificControls(chosenOperation)}
            <Space direction='horizontal'>
              {
                isFormValid().length && isFormValid().includes(canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR)
                  ? (
                    <Alert
                      message='Warning'
                      style={{ width: '50%' }}
                      description={(
                        <>
                          One or more of the selected samples/groups does not contain enough cells in the selected cell set.
                          Those comparisons will be skipped.
                        </>
                      )}
                      type='error'
                      showIcon
                    />
                  )
                  : isFormValid().length && isFormValid().includes(canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING)
                    ? (
                      <Alert
                        message='Warning'
                        style={{ width: '50%' }}
                        description={(
                          <>
                            For one of more of the comparisons, there are fewer than 3 samples with the minimum number of cells (10).
                            Only logFC values will be calculated and results should be used for exploratory purposes only.
                          </>
                        )}
                        type='warning'
                        showIcon
                      />
                    )
                    : <></>
              }
            </Space>
            <br />
            <Space direction='horizontal'>
              <Button
                disabled={!csvData.length}
                size='large'
                type='primary'
                onClick={() => downloadCSVsAsZip(csvData)}
              >
                Download Archive
              </Button>
              <Button
                loading={dataLoading}
                size='large'
                onClick={() => { getData(); }}
                disabled={csvData.length || !isFormValid()}
              >
                {dataLoading ? 'Computing' : 'Compute'}
              </Button>
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
