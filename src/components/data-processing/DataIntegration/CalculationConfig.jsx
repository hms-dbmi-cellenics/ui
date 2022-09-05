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
  Typography,
} from 'antd';

import {
  QuestionCircleOutlined,
} from '@ant-design/icons';

import _ from 'lodash';

import { generateDataProcessingPlotUuid } from 'utils/generateCustomPlotUuid';
import { updateFilterSettings } from 'redux/actions/experimentSettings';
import NormalisationOptions from './NormalisationOptions';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

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

  const methods = [
    {
      value: 'harmony',
      text: 'Harmony',
      disabled: false,
    },
    {
      value: 'seuratv4',
      text: 'Seurat v4',
      disabled: false,
    },
    {
      value: 'fastmnn',
      text: 'Fast MNN',
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
        Method&nbsp;
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
    <Collapse defaultActiveKey='data-integration'>
      <Panel header='Data Integration' key='data-integration'>
        <Space direction='vertical' style={{ width: '100%' }} />
        <Form size='small'>
          <Form.Item>
            <Text>
              <strong style={{ marginRight: '0.5rem' }}>Data integration settings:</strong>
              <Tooltip title='Integration of multiple samples corrects for batch effect. These methods identify shared cell states that are present across different datasets, even if they were collected from different individuals, experimental conditions, technologies, or even species. The user selects the integration method and sets the controls, as appropriate. Harmony is selected as default.'>
                <QuestionCircleOutlined />
              </Tooltip>
            </Text>
          </Form.Item>
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
          <Form.Item>
            <Text>
              <strong style={{ marginRight: '0.5rem' }}>Dimensionality reduction settings:</strong>
              <Tooltip title='Dimensionality reduction is necessary to summarise and visualise single cell RNA-seq data. The most common method is Principal Component Analysis. The user sets the number of Principal Components (PCs). This is the number that explains the majority of the variation within the dataset (ideally >90%), and is typically set between 5 and 30.'>
                <QuestionCircleOutlined />
              </Tooltip>
            </Text>
          </Form.Item>
          <div style={{ paddingLeft: '1rem' }}>
            <Form.Item label='Number of Principal Components'>
              <InputNumber
                value={numPCs}
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
                  Exclude genes categories&nbsp;
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
                  <Checkbox disabled value='ribosomal'>Ribosomal</Checkbox>
                  <Checkbox disabled value='mitochondrial'>Mitochondrial</Checkbox>
                  <Checkbox value='cellCycle'>
                    <span>
                      Cell cycle genes&nbsp;
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
        </Form>
      </Panel>
    </Collapse>
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
