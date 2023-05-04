import React, { useState, useEffect, useCallback } from 'react';
import {
  useSelector, useDispatch,
} from 'react-redux';

import {
  Button, Form, Radio, Tooltip, Space, Alert,
} from 'antd';

import { InfoCircleOutlined } from '@ant-design/icons';
import Loader from 'components/Loader';
import PropTypes from 'prop-types';
import { loadCellSets } from 'redux/actions/cellSets';
import { getCellSets } from 'redux/selectors';
import { setComparisonGroup, setComparisonType } from 'redux/actions/differentialExpression';
import checkCanRunDiffExpr, { canRunDiffExprResults } from 'utils/extraActionCreators/differentialExpression/checkCanRunDiffExpr';
import DiffExprSelect from 'components/data-exploration/differential-expression-tool/DiffExprSelect';

const ComparisonType = Object.freeze({ BETWEEN: 'between', WITHIN: 'within' });

const DiffExprCompute = (props) => {
  const {
    experimentId, onCompute,
  } = props;

  const dispatch = useDispatch();
  const cellSets = useSelector(getCellSets());
  const { properties, hierarchy } = cellSets;
  const [isFormValid, setIsFormValid] = useState(false);
  const [numSamples, setNumSamples] = useState(0);
  const comparisonGroup = useSelector((state) => state.differentialExpression.comparison.group);
  const selectedComparison = useSelector((state) => state.differentialExpression.comparison.type);
  const { basis, cellSet, compareWith } = comparisonGroup?.[selectedComparison] || {};

  /**
   * Loads cell set on initial render if it does not already exist in the store.
   */
  useEffect(() => {
    dispatch(loadCellSets(experimentId));
  }, []);

  useEffect(() => {
    if (hierarchy && hierarchy.length === 0) return;

    const samples = hierarchy?.find(
      (rootNode) => (rootNode.key === 'sample'),
    )?.children;

    setNumSamples(samples.length);

    // Auto select the only sample if there is only one sample
    if (samples.length === 1) {
      const theOnlySampleOption = {
        ...comparisonGroup[ComparisonType.WITHIN],
        type: ComparisonType.WITHIN,
        basis: `sample/${samples[0].key}`,
      };
      dispatch(setComparisonGroup(theOnlySampleOption));
    }
  }, [Object.keys(properties).length]);

  // Evaluate if the selected comparisons can be run. Returns results
  // that can be used to display appropriate warnings and errors if it cannot be run.
  const canRunDiffExpr = useCallback(() => checkCanRunDiffExpr(
    properties,
    hierarchy,
    comparisonGroup,
    selectedComparison,
  ), [basis, cellSet, compareWith, numSamples]);

  const validateForm = () => {
    if (!cellSet || !compareWith || !basis) {
      setIsFormValid(false);
      return;
    }

    setIsFormValid(true);
  };

  // Validate form when the groups selected changes.
  useEffect(() => {
    validateForm();
  }, [comparisonGroup[selectedComparison]]);

  /**
   * Updates the selected clusters.
   * @param {string} cellSet The key of the cell set.
   * @param {string} option The option string (`cellSet` or `compareWith`).
   */
  const onSelectCluster = (cellSet, option) => {
    dispatch(setComparisonGroup({
      ...comparisonGroup[selectedComparison],
      type: selectedComparison,
      [option]:
        cellSet,
    }));
  };

  /**
   * Constructs a form item, a `Select` field with selectable clusters.
   */
  const renderClusterSelectorItem = ({
    title, option, filterType,
  }) => {
    if (!cellSets.accessible) {
      return (
        <center>
          <Loader experimentId={experimentId} />
        </center>
      );
    }
    return (
      <DiffExprSelect
        title={title}
        option={option}
        filterType={filterType}
        onSelectCluster={onSelectCluster}
        selectedComparison={comparisonGroup[selectedComparison]}
        cellSets={cellSets}
      />
    );
  };

  return (
    <Form size='small' layout='vertical'>
      <Radio.Group
        onChange={(e) => {
          dispatch(setComparisonType(e.target.value));
        }}
        defaultValue={selectedComparison}
      >
        <Radio
          value={ComparisonType.WITHIN}
        >
          <Space>
            Compare cell sets within a sample/group
            <Tooltip overlay={(
              <span>
                For finding marker genes that distinguish one cluster from another. The calculation uses the presto implementation of the Wilcoxon rank sum test and auROC analysis. For more information see the
                {' '}
                <a
                  href='https://rdrr.io/github/immunogenomics/presto/f/vignettes/getting-started.Rmd'
                  target='_blank'
                  rel='noreferrer'
                >
                  presto vignette
                </a>
                .
              </span>
            )}
            >
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        </Radio>
        <Radio
          value={ComparisonType.BETWEEN}
          disabled={numSamples === 1}
        >
          <Space>
            {
              numSamples === 1 ? (
                <Tooltip
                  overlay={(<span>Comparison between samples/groups is not possible with a dataset that contains only 1 sample</span>)}
                >
                  Compare a selected cell set between samples/groups
                </Tooltip>
              ) : (
                'Compare a selected cell set between samples/groups'
              )
            }
            <Tooltip overlay={(
              <span>
                For finding genes that are differentially expressed between two experimental groups. This analysis uses a
                {' '}
                <a
                  href='http://bioconductor.org/books/3.14/OSCA.workflows/segerstolpe-human-pancreas-smart-seq2.html#segerstolpe-comparison'
                  target='_blank'
                  rel='noreferrer'
                >
                  pseudobulk limma-voom workflow
                </a>
                .
              </span>
            )}
            >
              <InfoCircleOutlined />
            </Tooltip>
          </Space>
        </Radio>
      </Radio.Group>

      {selectedComparison === ComparisonType.WITHIN
        ? (
          <>
            {
              renderClusterSelectorItem({
                title: 'Compare cell set:',
                option: 'cellSet',
                filterType: 'cellSets',
              })
            }

            {renderClusterSelectorItem({
              title: 'and cell set:',
              option: 'compareWith',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'within sample/group:',
              option: 'basis',
              filterType: 'metadataCategorical',
            })}
          </>
        ) : (
          <>
            {renderClusterSelectorItem({
              title: 'Compare cell set:',
              option: 'basis',
              filterType: 'cellSets',
            })}

            {renderClusterSelectorItem({
              title: 'between sample/group:',
              option: 'cellSet',
              filterType: 'metadataCategorical',
            })}

            {renderClusterSelectorItem({
              title: 'and sample/group:',
              option: 'compareWith',
              filterType: 'metadataCategorical',
            })}
          </>
        )}
      <Space direction='vertical'>
        {
          isFormValid && canRunDiffExpr() === canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR
            ? (
              <Alert
                message='Error'
                description={(
                  <>
                    One or more of the selected samples/groups does not contain enough cells in the selected cell set.
                    Therefore, the analysis can not be run. Select other cell set(s) or samples/groups to compare.
                  </>
                )}
                type='error'
                showIcon
              />
            )
            : isFormValid && canRunDiffExpr() === canRunDiffExprResults.INSUFFICIENT_CELLS_WARNING
              ? (
                <Alert
                  message='Warning'
                  description={(
                    <>
                      For the selected comparison, there are fewer than 3 samples with the minimum number of cells (10).
                      Only logFC values will be calculated and results should be used for exploratory purposes only.
                    </>
                  )}
                  type='warning'
                  showIcon
                />
              )
              : <></>
        }
        <Space direction='horizontal'>
          <Button
            size='small'
            disabled={!isFormValid
              || [
                canRunDiffExprResults.FALSE,
                canRunDiffExprResults.INSUFFCIENT_CELLS_ERROR,
              ].includes(canRunDiffExpr())}
            onClick={() => onCompute()}
          >
            Compute
          </Button>
        </Space>
      </Space>
    </Form>
  );
};

DiffExprCompute.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onCompute: PropTypes.func.isRequired,
};

export default DiffExprCompute;
export { ComparisonType };
