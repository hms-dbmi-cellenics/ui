import React, { useState, useEffect } from 'react';
import {
  useSelector,
  useDispatch,
} from 'react-redux';
import {
  Space, Button, Alert, Tooltip, Typography,
} from 'antd';
import Link from 'next/link';
import { LeftOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { getCellSets } from 'redux/selectors';
import loadDifferentialExpression from 'redux/actions/differentialExpression/loadDifferentialExpression';

import { geneTableUpdateReason } from 'utils/geneTable/geneTableUpdateReason';
import GeneTable from 'components/data-exploration/generic-gene-table/GeneTable';

import AdvancedFilteringModal from 'components/data-exploration/differential-expression-tool/AdvancedFilteringModal';
import LaunchPathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/LaunchPathwayAnalysisModal';

const { Text } = Typography;

const DiffExprResults = (props) => {
  const {
    experimentId, onGoBack, width, height,
  } = props;

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.differentialExpression.properties.loading);
  const data = useSelector((state) => state.differentialExpression.properties.data);
  const total = useSelector((state) => state.differentialExpression.properties.total);
  const error = useSelector((state) => state.differentialExpression.properties.error);
  const comparisonGroup = useSelector((state) => state.differentialExpression.comparison.group);
  const comparisonType = useSelector((state) => state.differentialExpression.comparison.type);
  const { properties } = useSelector(getCellSets());

  const [dataShown, setDataShown] = useState(data);
  const [exportAlert, setExportAlert] = useState(false);
  const [settingsListed, setSettingsListed] = useState(false);
  const [advancedFilteringShown, setAdvancedFilteringShown] = useState(false);
  const [pathwayAnalysisModal, setPathwayAnalysisModal] = useState(false);

  const columns = [
    {
      title: 'logFC',
      key: 'logFC',
      sorter: true,
      showSorterTooltip: false,
    },
    {
      title: 'adj p-value',
      key: 'p_val_adj',
      sorter: true,
      showSorterTooltip: false,
      render: (score, record) => <Tooltip title={`adj p-value: ${record.p_val_adj}`}>{score}</Tooltip>,
    },
    {
      title: 'Pct 1',
      key: 'pct_1',
      sorter: true,
      showSorterTooltip: {
        title: 'The percentage of cells where the feature is detected in the first group',
      },
    },
    {
      title: 'Pct 2',
      key: 'pct_2',
      sorter: true,
      showSorterTooltip: {
        title: 'The percentage of cells where the feature is detected in the second group',
      },
    },
    {
      title: 'AUC',
      key: 'auc',
      sorter: true,
      showSorterTooltip: {
        title: 'Area under the ROC curve',
      },
    },
  ];

  // When data changes, update rows.
  useEffect(() => {
    if (data && properties) {
      setDataShown(data);
    }
  }, [data, properties]);

  const onUpdate = (newState, reason) => {
    // We handle `loading` and `loaded` in the HOC, no need to react to these.
    if (reason === geneTableUpdateReason.loaded || reason === geneTableUpdateReason.loading) {
      return;
    }

    dispatch(
      loadDifferentialExpression(
        experimentId,
        comparisonGroup[comparisonType],
        comparisonType,
        newState,
      ),
    );
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

    return <Text strong>{printString}</Text>;
  };

  const { basis, cellSet, compareWith } = comparisonGroup[comparisonType];

  const renderExportAlert = () => {
    if (!exportAlert) return null;
    return (
      <Alert
        message={(
          <span>
            Exporting to CSV is not currently available here. Use the&nbsp;
            <Link
              target='_blank'
              as={`/experiments/${experimentId}/plots-and-tables/volcano`}
              href='/experiments/[experimentId]/plots-and-tables/volcano'
              passHref
            >
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a target='_blank'>volcano plot</a>
            </Link>
            &nbsp;in Plots and Tables to export results (opens in new tab).
          </span>
        )}
        type='info'
        closable
        showIcon
        afterClose={() => {
          setExportAlert(false);
        }}
      />
    );
  };
  const applyAdvancedFilters = (filters) => {
    dispatch(loadDifferentialExpression(
      experimentId,
      comparisonGroup[comparisonType],
      comparisonType,
      false,
      filters,
    ));
  };

  return (
    <Space direction='vertical' style={{ width: '100%' }}>

      {/* This is needed so changes to the export alert don't cause the table to re-render. */}
      <Space direction='vertical' style={{ width: '100%' }}>
        <Button size='small' onClick={onGoBack}>
          <span>
            <LeftOutlined />
            Go back
          </span>
        </Button>
        {renderExportAlert()}
        <Space direction='horizontal'>
          <Button id='settingsButton' onClick={() => setSettingsListed(!settingsListed)}>
            {settingsListed ? 'Hide' : 'Show'}
            {' '}
            settings
          </Button>
          <Button onClick={() => setAdvancedFilteringShown(!advancedFilteringShown)}>
            Advanced filtering
          </Button>
        </Space>
      </Space>
      {advancedFilteringShown && (
        <AdvancedFilteringModal
          onLaunch={applyAdvancedFilters}
          onCancel={() => setAdvancedFilteringShown(false)}
        />
      )}
      {settingsListed
        ? (
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
        ) : <div />}
      <GeneTable
        experimentId={experimentId}
        initialTableState={{
          sorter: {
            field: 'logFC',
            columnKey: 'logFC',
            order: 'descend',
          },
        }}
        onUpdate={onUpdate}
        columns={columns}
        loading={loading}
        error={error}
        width={width}
        height={height - 70 - (exportAlert ? 70 : 0) - (settingsListed ? 70 : 0)}
        data={dataShown}
        total={total}
        extraOptions={(
          <>
            <Button type='link' size='small' onClick={() => setExportAlert(true)}>Export as CSV</Button>
            <Button type='link' size='small' onClick={() => setPathwayAnalysisModal(!pathwayAnalysisModal)}>Pathway analysis</Button>
          </>
        )}
      />
      {
        pathwayAnalysisModal && (
          <LaunchPathwayAnalysisModal onCancel={() => setPathwayAnalysisModal(false)} />
        )
      }
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
