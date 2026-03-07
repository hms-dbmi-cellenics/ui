import React, { useState, useEffect, useRef } from 'react';
import {
  useSelector,
  useDispatch,
} from 'react-redux';
import {
  Space, Button, Alert, Tooltip,
} from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import _ from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

import { getCellSets } from 'redux/selectors';
import loadDifferentialExpression from 'redux/actions/differentialExpression/loadDifferentialExpression';

import GeneTable from 'components/data-exploration/generic-gene-table/GeneTable';
import ExportAsCSV from 'components/plots/ExportAsCSV';

import AdvancedFilteringModal from 'components/data-exploration/differential-expression-tool/AdvancedFilteringModal';
import LaunchPathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/LaunchPathwayAnalysisModal';
import { setGeneOrdering } from 'redux/actions/differentialExpression';

const DiffExprResults = (props) => {
  const {
    experimentId, onGoBack, width, height,
  } = props;

  const dispatch = useDispatch();
  const {
    data, error, loading,
  } = useSelector((state) => state.differentialExpression.properties);
  const {
    type: comparisonType,
    group: comparisonGroup,
    advancedFilters,
  } = useSelector((state) => state.differentialExpression.comparison);
  const { properties } = useSelector(getCellSets());
  const experimentName = useSelector((state) => state.experimentSettings.info.experimentName);

  const [dataShown, setDataShown] = useState(data);
  const [advancedFilteringModalVisible, setAdvancedFilteringModalVisible] = useState(false);
  const [pathwayAnalysisModalVisible, setPathwayAnalysisModalVisible] = useState(false);
  const [columns, setColumns] = useState([]);
  const geneTableState = useRef({});

  const buildColumns = (rowData) => {
    const rowDataKeys = Object.keys(rowData[0]);
    return columnDefinitions.filter(({ key }) => rowDataKeys.includes(key));
  };

  useEffect(() => {
    if (!data.length || !Object.keys(properties).length) return;
    let cols = buildColumns(data);
    // Remove FDR column if it's a within-group comparison
    if (comparisonType === 'within') {
      cols = cols.filter(col => col.key !== 'p_val_adj');
    }
    setColumns(cols);
    setDataShown(data);
  }, [data, properties, comparisonType]);

  const loadData = (loadAllState) => {
    geneTableState.current = loadAllState;
    const { sorter } = loadAllState;

    const sortOrder = sorter.order === 'ascend' ? 'ASC' : 'DESC';
    dispatch(setGeneOrdering(sorter.field, sortOrder));

    dispatch(
      loadDifferentialExpression(
        experimentId,
        comparisonGroup[comparisonType],
        comparisonType,
        loadAllState,
      ),
    );
  };

  const applyAdvancedFilters = (filters) => {
    dispatch(loadDifferentialExpression(
      experimentId,
      comparisonGroup[comparisonType],
      comparisonType,
      geneTableState.current,
      filters,
    ));
  };

  const optionName = (word) => {
    const [rootGroup, clusterName] = word.split('/');

    let printString = '';

    if (!clusterName) {
      printString = _.capitalize(rootGroup);
    } else if (clusterName === 'rest') {
      printString = `Rest of ${properties[rootGroup].name}`;
    } else {
      printString = properties[clusterName]?.name || _.capitalize(clusterName);
    }

    return <strong>{printString}</strong>;
  };

  const { basis, cellSet, compareWith } = comparisonGroup[comparisonType];

  const geneTooltipText = `All genes present in the dataset are shown in the differential expression results table. Note that a gene is typically considered 'differentially expressed' based on established thresholds on FDR and/or log fold change. You should apply your own criteria and thresholds to filter the resulting list of genes using the "Filter results" button.`;

  const getCSVData = () => {
    if (!dataShown?.length) return [];
    return dataShown.map((row) => {
      const { _row, ...csvRow } = row;
      return csvRow;
    });
  };

  const getCellSetKey = (word) => {
    // Extract the cell set name part (after '/' if present)
    const key = word?.split('/')[1] || word;
    // Get the friendly name from properties or use the key as fallback
    return (properties[key]?.name || _.capitalize(key || '')).replace(/\s+/g, '_');
  };

  const date = dayjs.utc().format('YYYY-MM-DD-HH-mm-ss');
  const experimentNameClean = experimentName?.replace(/\s+/g, '_') || 'experiment';
  const cellSetName = getCellSetKey(cellSet);
  const compareWithName = getCellSetKey(compareWith);
  const basisName = getCellSetKey(basis);
  const csvFileName = `${experimentNameClean}-${cellSetName}_vs_${compareWithName}_in_${basisName}.csv`;

  return (
    <Space direction='vertical' style={{ width: '100%' }}>

      {/* This is needed so changes to the export alert don't cause the table to re-render. */}
      <Space direction='horizontal'>
        <Button size='small' onClick={onGoBack}>
          <span>
            <LeftOutlined />
            Go back
          </span>
        </Button>
        <Button size='small' onClick={() => setAdvancedFilteringModalVisible(!advancedFilteringModalVisible)}>
          Filter results
        </Button>
        <Button size='small' onClick={() => setPathwayAnalysisModalVisible(!pathwayAnalysisModalVisible)}>
          Pathway analysis
        </Button>
        <ExportAsCSV data={getCSVData()} filename={csvFileName} disabled={!dataShown?.length} />
      </Space>
      {advancedFilteringModalVisible && (
        <AdvancedFilteringModal
          onLaunch={(filters) => {
            applyAdvancedFilters(filters);
            setAdvancedFilteringModalVisible(false);
          }}
          onCancel={() => setAdvancedFilteringModalVisible(false)}
        />
      )}
      <div id='settingsText'>
        {optionName(cellSet)}
        {' '}
        vs.
        {' '}
        {optionName(compareWith)}
        {' '}
        in
        {' '}
        {optionName(basis)}
      </div>
      <GeneTable
        experimentId={experimentId}
        initialTableState={{
          sorter: {
            field: 'logFC',
            columnKey: 'logFC',
            order: 'descend',
          },
        }}
        columns={columns}
        loading={loading}
        error={error}
        width={width}
        height={height - 57}
        propData={dataShown}
        loadData={loadData}
        extraOptions={null}
        geneColumnTooltipText={geneTooltipText}
        geneColumnWidth={columns.length < 4 ? '150px' : '100px'}
      />
      {
        pathwayAnalysisModalVisible && (
          <LaunchPathwayAnalysisModal
            onOpenAdvancedFilters={() => setAdvancedFilteringModalVisible(true)}
            onCancel={() => setPathwayAnalysisModalVisible(false)}
            advancedFiltersAdded={advancedFilters.length > 0}
          />
        )
      }
    </Space>
  );
};

const formatDecimal = (value, decimals) => {
  if (value === undefined || value === null) return '';
  return parseFloat(value).toFixed(decimals).replace(/\.?0+$/, '');
};

const formatFDR = (value) => {
  if (value === undefined || value === null) return '';
  const num = parseFloat(value);

  // If number is very small, use exponential notation with 1 decimal
  if (num < 0.01 || num.toString().includes('e')) {
    return num.toExponential(1);
  }
  // Otherwise use decimal format with max 2 decimals
  return formatDecimal(value, 2);
};

const columnDefinitions = [
  {
    title: 'logFC',
    key: 'logFC',
    sorter: true,
    showSorterTooltip: false,
    render: (score) => formatDecimal(score, 1),
  },
  {
    title: 'FDR',
    key: 'p_val_adj',
    sorter: true,
    showSorterTooltip: false,
    render: (score, record) => <Tooltip title={`FDR: ${record.p_val_adj}`}>{formatFDR(score)}</Tooltip>,
  },
  {
    title: 'Pct 1',
    key: 'pct_1',
    sorter: true,
    showSorterTooltip: {
      title: 'The percentage of cells where the feature is detected in the first group',
    },
    render: (score) => formatDecimal(score, 1),
  },
  {
    title: 'Pct 2',
    key: 'pct_2',
    sorter: true,
    showSorterTooltip: {
      title: 'The percentage of cells where the feature is detected in the second group',
    },
    render: (score) => formatDecimal(score, 1),
  },
  {
    title: 'AUC',
    key: 'auc',
    sorter: true,
    showSorterTooltip: {
      title: 'Area under the ROC curve',
    },
    render: (score) => formatDecimal(score, 2),
  },
];

DiffExprResults.defaultProps = {};

DiffExprResults.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onGoBack: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

export default DiffExprResults;
