import React, {
  useEffect, useState, useCallback, useMemo,
} from 'react';
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
import { getCellSetsHierarchyByType, getCellSets, getCellSetsHierarchyByKeys } from 'redux/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { loadCellSets } from 'redux/actions/cellSets';
import PropTypes from 'prop-types';
import { InfoCircleOutlined } from '@ant-design/icons';
import { plotNames } from 'utils/constants';
import Loader from 'components/Loader';
import DiffExprSelect from 'components/data-exploration/differential-expression-tool/DiffExprSelect';
import getBatchDiffExpr from 'utils/extraActionCreators/differentialExpression/getBatchDiffExpr';
import { zipSync } from 'fflate';
import { saveAs } from 'file-saver';
import _ from 'lodash';
import checkCanRunDiffExpr, { canRunDiffExprResults } from 'utils/extraActionCreators/differentialExpression/checkCanRunDiffExpr';
import { metadataKeyToName } from 'utils/data-management/metadataUtils';

const comparisonTypes = {
  fullList: 'within',
  compareForCellSets: 'between',
  compareForSamples: 'within',
};
const comparisonInitialState = {
  cellSet: null,
  compareWith: null,
  basis: null,
  comparisonType: null,
};

const cellSetNameFromKey = (properties, key) => {
  // some entries have the parent cell set in the name like sample/213123-asda-2321
  // the second part after the slash is needed to return the cell set name
  const keySplitted = key?.split('/')[1] || key;
  return properties[keySplitted]?.name.replace(/\s+/g, '_') || keySplitted;
};

const BatchDiffExpression = (props) => {
  const { experimentId } = props;
  const [chosenOperation, setChosenOperation] = useState('fullList');
  const dispatch = useDispatch();
  const cellSets = useSelector(getCellSets());
  const { properties, hierarchy } = cellSets;
  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);

  const cellSetNodes = useSelector(getCellSetsHierarchyByType('cellSets'));
  const clmNodes = useSelector(getCellSetsHierarchyByType('CLM'));

  const metadataCellSetNodes = useSelector(getCellSetsHierarchyByType('metadataCategorical'));
  const clmPerSampleNodes = useSelector(getCellSetsHierarchyByType('CLMPerSample'));

  const [dataLoading, setDataLoading] = useState();

  const [comparison, setComparison] = useState(comparisonInitialState);
  const batchCellSetKeys = useSelector(getCellSetsHierarchyByKeys([comparison.basis]))[0]?.children
    .map((child) => child.key);
  const batchCellSetNames = batchCellSetKeys?.map((key) => cellSetNameFromKey(properties, key));

  const [sample] = useSelector(getCellSetsHierarchyByKeys(['sample']));

  const cellDefinedNodes = useMemo(
    () => [...cellSetNodes, ...clmNodes],
    [cellSetNodes, clmNodes],
  );

  const sampleDefinedNodes = useMemo(
    () => [...metadataCellSetNodes, ...clmPerSampleNodes],
    [metadataCellSetNodes, clmPerSampleNodes],
  );

  const isDatasetUnisample = useMemo(() => sample?.children.length === 1, [sample]);
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    changeComparison({
      ...comparisonInitialState,
      comparisonType: comparisonTypes[chosenOperation],
    });
    setDataLoading(false);
    setChosenOperation(chosenOperation);
  }, [chosenOperation]);

  const changeComparison = (diff) => {
    setComparison({
      ...comparison,
      ...diff,
    });
  };
  const canRunDiffExpr = (comparisonGroup) => checkCanRunDiffExpr(
    properties,
    hierarchy,
    { [comparisonGroup.comparisonType]: comparisonGroup },
    comparisonGroup.comparisonType,
    true,
  );

  const getResult = (initialComparison) => batchCellSetKeys.reduce((acc, currentBasis) => {
    const curr = canRunDiffExpr({ ...initialComparison, basis: currentBasis });
    if (acc !== canRunDiffExprResults.TRUE) {
      return acc;
    }
    return curr !== canRunDiffExprResults.TRUE ? curr : acc;
  }, canRunDiffExprResults.TRUE);

  const isFormInvalid = useCallback(() => {
    const { cellSet, compareWith, basis } = comparison;
    if (cellSet && compareWith && basis) {
      return getResult(comparison);
    }

    if (chosenOperation === 'fullList' && basis) {
      return false;
    }
    return true;
  }, [comparison, chosenOperation]);

  const downloadCSVsAsZip = (data) => {
    const encoder = new TextEncoder();
    let archiveName;
    const { cellSet, compareWith, basis } = comparison;
    const experimentNameNoSpace = experimentName.replace(/\s+/g, '_');
    if (chosenOperation === 'fullList') {
      archiveName = `${experimentNameNoSpace}-FULL-LIST-${cellSetNameFromKey(properties, basis)}`;
    } else {
      archiveName = `${experimentNameNoSpace}-${cellSetNameFromKey(properties, cellSet)}-TO-${cellSetNameFromKey(properties, compareWith)}-IN-${cellSetNameFromKey(properties, basis)}`;
    }
    const CSVs = data.reduce((accumulator, currentData, indx) => {
      let csvString;
      let fileName;
      if (!currentData.error) {
        // Get the column names from the keys of the first object in currentData
        const columnNames = Object.keys(currentData[0]).join(',');
        const csvRows = currentData.map((obj) => Object.values(obj).join(','));
        csvString = `${columnNames}\n${csvRows.join('\n')}`;
        fileName = `DE-${batchCellSetNames[indx]}.csv`;
      } else {
        // If currentData[0] is not an array, include the error message in the CSV file
        csvString = `error\n${currentData.error}`;
        fileName = `DE-${batchCellSetNames[indx]}-error.csv`;
      }
      const encodedString = encoder.encode(csvString);
      accumulator[fileName] = encodedString;
      return accumulator;
    }, {});

    const zipped = zipSync({ [archiveName]: CSVs });

    const blob = new Blob([zipped], { type: 'application/zip' });
    saveAs(blob, archiveName);
  };

  const getSelectOptions = useCallback((options) => {
    const selectOptions = [];
    if (options?.length === 0) return;

    Array.from(options).forEach((option) => {
      selectOptions.push({
        value: option.key,
        label: _.upperFirst(metadataKeyToName(option.name)),
      });
    });
    return selectOptions;
  }, []);

  const getData = async () => {
    setDataLoading(true);
    const data = await dispatch(
      getBatchDiffExpr(experimentId, comparison, chosenOperation, batchCellSetKeys),
    );
    setDataLoading(false);
    downloadCSVsAsZip(data);
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
              onChange={(value) => changeComparison({ basis: value })}
              value={comparison.basis}
              style={{ width: '40%' }}
              options={getSelectOptions(cellDefinedNodes)}
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
            <DiffExprSelect
              title='Compare sample/group:'
              option='cellSet'
              filterTypes={['metadataCategorical', 'CLMPerSample']}
              onSelectCluster={(cellSet) => changeComparison({ cellSet })}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.cellSet}
              cellSets={cellSets}
            />
            <DiffExprSelect
              title='To sample/group:'
              option='compareWith'
              filterTypes={['metadataCategorical', 'CLMPerSample']}
              onSelectCluster={(cellSet) => changeComparison({ compareWith: cellSet })}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.compareWith}
              cellSets={cellSets}
            />

            In batch for each cell set in:
            <Select
              placeholder='Select a cell set...'
              onChange={(value) => changeComparison({ basis: value })}
              value={comparison.basis}
              style={{ width: '33.5%' }}
              options={getSelectOptions(cellDefinedNodes)}
            />
          </>
        );
      case 'compareForSamples':
        return (
          <>
            Select the comparison cell sets for which batch
            differential expression is to be computed:
            <br />
            <DiffExprSelect
              title='Compare cell set:'
              option='cellSet'
              filterTypes={['cellSets', 'CLM']}
              onSelectCluster={(cellSet) => changeComparison({ cellSet })}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.cellSet}
              cellSets={cellSets}
            />
            <DiffExprSelect
              title='To cell set:'
              option='compareWith'
              filterTypes={['cellSets', 'CLM']}
              onSelectCluster={(cellSet) => changeComparison({ compareWith: cellSet })}
              selectedComparison={{ cellSet: comparison.cellSet }}
              value={comparison.compareWith}
              cellSets={cellSets}
            />

            In batch for each sample/group in:
            <Select
              placeholder='Select samples or metadata...'
              onChange={(value) => changeComparison({ basis: value })}
              value={comparison.basis}
              style={{ width: '34%' }}
              options={getSelectOptions(sampleDefinedNodes)}
            />
          </>
        );
      default:
        return (<h1>Invalid option</h1>);
    }
  };

  if (!cellSets.accessible || dataLoading) {
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

          <Radio.Group
            value={chosenOperation}
            onChange={(e) => { setChosenOperation(e.target.value); }}
          >
            <Space direction='vertical'>
              <Radio value='fullList' disabled={dataLoading}>
                Generate a full list of marker genes for all cell sets
                {'   '}
                <Tooltip title='Each cell set will be compared to all other cells, using all samples.'>
                  <InfoCircleOutlined />
                </Tooltip>
              </Radio>
              <Radio value='compareForCellSets' disabled={isDatasetUnisample || dataLoading}>
                {
                  isDatasetUnisample ? (
                    <Tooltip
                      overlay={(
                        <span>
                          Comparison between samples/groups is
                          not possible with a dataset that contains only 1 sample
                        </span>
                      )}
                    >
                      Compare between two selected samples/groups in a cell set for all cell sets
                    </Tooltip>
                  ) : (
                    'Compare between two selected samples/groups in a cell set for all cell sets'
                  )
                }
              </Radio>
              <Radio value='compareForSamples' disabled={dataLoading}>
                Compare two cell sets for all samples/groups
              </Radio>
            </Space>
          </Radio.Group>

          <br />
          <br />
          <Space direction='vertical'>
            {renderSpecificControls(chosenOperation)}
            <Space direction='horizontal'>
              {
                isFormInvalid() === canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR
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
                      type='warning'
                      showIcon
                    />
                  )
                  : isFormInvalid() === canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING
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
                disabled={isFormInvalid() === true}
                loading={dataLoading}
                size='large'
                type='primary'
                onClick={() => getData()}
              >
                Compute and Download
              </Button>
            </Space>
            This might take several minutes to complete.
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
