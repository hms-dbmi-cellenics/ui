import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import {
  Collapse,
  Space,
  Select,
  InputNumber,
  Form,
  Checkbox,
  Tooltip,
  Alert,
} from 'antd';

import {
  QuestionCircleOutlined,
} from '@ant-design/icons';

import _ from 'lodash';
import { downsamplingMethods } from 'utils/constants';

import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import { updateFilterSettings } from 'redux/actions/experimentSettings';
import NormalisationOptions from './NormalisationOptions';

const { Option } = Select;
const { Panel } = Collapse;

const getDownsampling = (downsamplingConfig = {}) => {
  const { method = downsamplingMethods.NONE, methodSettings = {} } = downsamplingConfig;

  if (method === downsamplingMethods.NONE || !(method in methodSettings)) {
    return { method };
  }

  // only return percentage to keep if not NONE
  return { method, percentageToKeep: methodSettings[method].percentageToKeep };
};

const CalculationConfig = (props) => {
  const {
    onConfigChange, disabled, disableDataIntegration,
  } = props;
  const FILTER_UUID = 'dataIntegration';
  const dispatch = useDispatch();
  const { dataIntegration, dimensionalityReduction } = useSelector(
    (state) => state.experimentSettings.processing.dataIntegration,
  );
  const elbowPlotUuid = generateDataProcessingPlotUuid(null, FILTER_UUID, 1);
  const data = useSelector((state) => state.componentConfig[elbowPlotUuid]?.plotData);
  const downsampling = getDownsampling(
    useSelector((state) => state.experimentSettings.processing.dataIntegration.downsampling),
  );

  const methods = [
    {
      value: 'harmony',
      text: 'Harmony',
      disabled: false,
    },
    {
      value: 'fastmnn',
      text: 'Fast MNN',
      disabled: false,
    },
    {
      value: 'seuratv4',
      text: 'Seurat v4',
      disabled: false,
    },
    {
      value: 'unisample',
      text: 'No integration',
      disabled: false,
    },
    {
      value: 'seuratv3',
      text: 'Seurat v3',
      disabled: true,
    },
    {
      value: 'conos',
      text: 'Conos',
      disabled: true,
    },
    {
      value: 'liger',
      text: 'Liger',
      disabled: true,
    },
  ];

  const [numPCs, setNumPCs] = useState(dimensionalityReduction.numPCs);

  const updateSettings = (diff) => {
    onConfigChange();
    dispatch(updateFilterSettings(
      FILTER_UUID,
      diff,
    ));
  };

  const roundedVariationExplained = () => {
    const variationExplained = data?.length
      ? data.slice(0, dimensionalityReduction.numPCs).reduce(
        (acum, current) => acum + current.percentVariance, 0,
      ) : 0;
    const roundingPrecision = 2;

    return _.round(variationExplained * 100, roundingPrecision);
  };

  const renderDimReductionMethod = () => (
    <Form.Item label={(
      <span>
        Method
        {' '}
        <Tooltip overlay={(
          <span>
            To integrate data, dimensional reduction is performed to find so called "anchors".
            cross-dataset pairs of cells that are in a matched biological state (‘anchors’), are both to correct for technical
            differences between datasets
            (i.e. batch effect correction), and to perform comparative scRNA-seq analysis across experimental conditions.
            CCA is well-suited when cell types are conserved, but there are very substantial differences
            in gene expression across experiments.
            However, CCA-based integration may also lead to overcorrection, especially when a large proportion of cells are
            non-overlapping across datasets.

            RPCA-based integration runs significantly faster, and also represents a more conservative approach where
            cells in different biological states are less likely to ‘align’ after integration.
            More info
            <a
              href='https://satijalab.org/seurat/articles/integration_rpca.html'
              target='_blank'
              rel='noreferrer'
            >
              {' '}
              <code>here</code>
            </a>
          </span>
        )}
        >
          <QuestionCircleOutlined />
        </Tooltip>
      </span>
    )}
    >

      <Select
        value={dimensionalityReduction.method}
        onChange={(val) => updateSettings({ dimensionalityReduction: { method: val } })}
        disabled={disabled}
      >
        <Option key='rpca' value='rpca'>Reciprocal PCA (RPCA)</Option>
        <Option key='cca' value='cca'>Canonical Correlation Analysis (CCA)</Option>
      </Select>
    </Form.Item>
  );

  return (
    <Form size='small'>

      <Collapse defaultActiveKey='data-integration'>
        <Panel header='Data Integration' key='data-integration'>
          <Form.Item style={{ marginBottom: 0 }}>
            <p>
              <strong style={{ marginRight: '0.5rem' }}>Data integration settings:</strong>
              <Tooltip title='Integration of multiple samples corrects for batch effect. These methods identify shared cell states that are present across different datasets, even if they were collected from different individuals, experimental conditions, technologies, or even species. The user selects the integration method and sets the controls, as appropriate. Harmony is selected as default.'>
                <QuestionCircleOutlined />
              </Tooltip>
            </p>
          </Form.Item>

          {
            dataIntegration.method === 'seuratv4'
            && (
              <Form.Item>
                <Alert
                  type='warning'
                  description='SeuratV4 is a computationally expensive method. It is highly likely that the integration will fail as it requires more resources than are currently available. We recommended you to evaluate other methods before using SeuratV4.'
                />
              </Form.Item>
            )
          }

          <div style={{ paddingLeft: '1rem' }}>
            <Form.Item
              label='Method:'
            >
              <Select
                value={dataIntegration.method}
                onChange={(val) => updateSettings({ dataIntegration: { method: val } })}
                disabled={disableDataIntegration || disabled}
              >
                {
                  methods.map((el) => (
                    <Option key={el.text} value={el.value} disabled={el.disabled}>
                      {
                        el.disabled ? (
                          <Tooltip title='Will be supported in a later version' placement='left'>
                            {el.text}
                          </Tooltip>
                        ) : el.text
                      }

                    </Option>
                  ))
                }
              </Select>
            </Form.Item>

            <NormalisationOptions
              config={dataIntegration.methodSettings[dataIntegration.method]}
              onUpdate={updateSettings}
              methodId={dataIntegration.method}
              onChange={() => onConfigChange()}
              disabled={disableDataIntegration || disabled}
            />

          </div>
          <Form.Item style={{ marginBottom: 0, marginTop: '1rem' }}>
            <p>
              <strong style={{ marginRight: '0.5rem' }}>Dimensionality reduction settings:</strong>
              <Tooltip title='Dimensionality reduction is necessary to summarise and visualise single cell RNA-seq data. The most common method is Principal Component Analysis. The user sets the number of Principal Components (PCs). This is the number that explains the majority of the variation within the dataset (ideally >90%), and is typically set between 5 and 30.'>
                <QuestionCircleOutlined />
              </Tooltip>
            </p>
          </Form.Item>
          <div style={{ paddingLeft: '1rem' }}>
            <Form.Item label='Number of Principal Components'>
              <InputNumber
                value={numPCs}
                aria-label='Number of Principal Components'
                max={data?.length || 100}
                min={0}
                onChange={(value) => {
                  onConfigChange();
                  setNumPCs(value);
                }}
                onPressEnter={(e) => e.preventDefault()}
                onStep={(value) => updateSettings({ dimensionalityReduction: { numPCs: value } })}
                onBlur={(e) => updateSettings(
                  { dimensionalityReduction: { numPCs: parseInt(e.target.value, 0) } },
                )}
                disabled={disabled}
              />
            </Form.Item>
            <Form.Item label='% variation explained'>
              <InputNumber
                value={roundedVariationExplained()}
                disabled={disabled}
                readOnly
              />
            </Form.Item>
            <Form.Item
              label={(
                <span>
                  Exclude genes categories
                  {' '}
                  <Tooltip
                    title='Normalization can be biased by certain gene categories such the ones listed here.
                    Checking them will ignore those categories.
                    For example, cell cycle genes should be removed if sampling timepoints occured throughout the day.
                    Those genes can otherwise introduce within-cell-type heterogeneity that can obscure the differences
                    in expression between cell types.'
                  >
                    <QuestionCircleOutlined />
                  </Tooltip>
                </span>
              )}
            >

              <Checkbox.Group
                onChange={(val) => updateSettings(
                  { dimensionalityReduction: { excludeGeneCategories: val } },
                )}
                value={dimensionalityReduction.excludeGeneCategories}
              >
                <Space direction='vertical'>
                  <Checkbox value='ribosomal'>Ribosomal</Checkbox>
                  <Checkbox disabled value='mitochondrial'>Mitochondrial</Checkbox>
                  <Checkbox value='cellCycle'>
                    <span>
                      Cell cycle genes
                      {' '}
                      <Tooltip
                        title='Currently only available for human and mice species. Do not check this box if your cells are from a different species.'
                      >
                        <QuestionCircleOutlined />
                      </Tooltip>
                    </span>
                  </Checkbox>
                </Space>
              </Checkbox.Group>
            </Form.Item>

            {dataIntegration.method === 'seuratv4' ? renderDimReductionMethod() : <></>}

          </div>
        </Panel>
      </Collapse>
      <Collapse>
        <Panel header='Downsampling Options' key='downsampling-options'>
          <Space direction='vertical' style={{ width: '100%' }} />
          <Form.Item>
            <p>
              <strong style={{ marginRight: '0.5rem' }}>Downsampling settings:</strong>
              <Tooltip title='Large datasets (e.g. >100,000 cells) can be downsampled specifically for the integration step. This speeds up the time it takes to integrate large datasets using some methods (especially Seurat_v4 and FastMNN), and enables large datasets to successfully complete the pipeline. Once the data are integrated, the full data are available for downstream analysis and visualization.'>
                <QuestionCircleOutlined />
              </Tooltip>
            </p>
          </Form.Item>
          <div style={{ paddingLeft: '1rem' }}>

            <Form.Item label={(
              <span>
                Method
                {' '}
                <Tooltip
                  overlay={(
                    <>
                      <span style={downsampling.method === downsamplingMethods.GEOSKETCH ? {} : { display: 'none' }}>
                        Geometric sketching finds random subsamples of a dataset that preserve the underlying geometry,
                        which is described in this paper:
                        <a
                          href='https://www.sciencedirect.com/science/article/pii/S2405471219301528'
                          target='_blank'
                          rel='noreferrer'
                        >
                          {' '}
                          <code>Geometric sketching compactly summarizes the single-cell transcriptomic landscape</code>
                        </a>
                      </span>
                      <span style={downsampling.method === downsamplingMethods.NONE ? {} : { display: 'none' }}>
                        No downsampling will be used during the data integration
                      </span>
                    </>
                  )}
                >
                  <QuestionCircleOutlined />
                </Tooltip>
              </span>
            )}
            >

              <Select
                aria-label='Downsampling method'
                value={downsampling.method}
                onChange={(val) => {
                  let downsamplingSettings = {};
                  // only update the percentageToKeep value when the method is not None
                  if (val !== downsamplingMethods.NONE) {
                    downsamplingSettings = {
                      method: val,
                      methodSettings: {
                        [val]: {
                          percentageToKeep: downsamplingMethods.DEFAULT_PERC_TO_KEEP,
                        },
                      },
                    };
                  } else {
                    downsamplingSettings = { method: val };
                  }
                  updateSettings({ downsampling: downsamplingSettings });
                }}
              >
                <Option value={downsamplingMethods.NONE}>
                  No Downsampling
                </Option>
                <Option value={downsamplingMethods.GEOSKETCH}>
                  Geometric Sketching
                </Option>

              </Select>
            </Form.Item>
            <Form.Item label='% of cells to keep'>
              <InputNumber
                aria-label='% of cells to keep'
                disabled={downsampling.method !== downsamplingMethods.GEOSKETCH}
                value={downsampling.percentageToKeep}
                max={100}
                min={0}
                onChange={(value) => {
                  updateSettings({
                    downsampling: {
                      methodSettings:
                      {
                        [downsampling.method]: { percentageToKeep: parseInt(value, 0) },
                      },

                    },
                  });
                }}
              />
            </Form.Item>
          </div>
        </Panel>
      </Collapse>
    </Form>

  );
};

CalculationConfig.propTypes = {
  onConfigChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  disableDataIntegration: PropTypes.bool,
};

CalculationConfig.defaultProps = {
  disabled: false,
  disableDataIntegration: false,
};

export default CalculationConfig;
