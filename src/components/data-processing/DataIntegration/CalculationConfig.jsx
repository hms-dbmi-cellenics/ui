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
  Button,
  Typography,
  Alert,
  Row,
  Col,
} from 'antd';

import {
  QuestionCircleOutlined,
} from '@ant-design/icons';

import _ from 'lodash';

import SeuratV4Options from './SeuratV4Options';

import { updateProcessingSettings, saveProcessingSettings } from '../../../redux/actions/experimentSettings';

const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

const CalculationConfig = (props) => {
  const { experimentId } = props;
  const FILTER_UUID = 'dataIntegration';

  const dispatch = useDispatch();
  const { dataIntegration, dimensionalityReduction } = useSelector(
    (state) => state.experimentSettings.processing.dataIntegration,
  );

  const elbowPlotUuid = 'dataIntegrationElbow';
  const data = useSelector((state) => state.componentConfig[elbowPlotUuid]?.plotData);

  const methods = [
    {
      value: 'seuratv4',
      text: 'Seurat v4',
      disabled: false,
    },
    {
      value: 'seuratv3',
      text: 'Seurat v3',
      disabled: true,
    },
    {
      value: 'harmony',
      text: 'Harmony',
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
    {
      value: 'fastMNN',
      text: 'Fast MNN',
      disabled: true,
    },
  ];

  const [numPCs, setNumPCs] = useState(dimensionalityReduction.numPCs);
  const [changesOutstanding, setChangesOutstanding] = useState(false);

  const updateSettings = (diff) => {
    setChangesOutstanding(true);
    dispatch(updateProcessingSettings(
      experimentId,
      FILTER_UUID,
      diff,
    ));
  };

  const applyDataIntegrationSettings = () => {
    setChangesOutstanding(false);
    dispatch(saveProcessingSettings(experimentId, FILTER_UUID));
  };

  const methodOptions = {
    seuratv4: () => <SeuratV4Options config={dataIntegration.methodSettings.seuratv4} onUpdate={updateSettings} onChange={() => setChangesOutstanding(true)} />,
  };

  const roundedVariationExplained = () => {
    const variationExplained = data?.length ? data.slice(0, dimensionalityReduction.numPCs).reduce((acum, current) => acum + current.percentVariance, 0) : 0;
    const roundingPrecision = 2;

    return _.round(variationExplained * 100, roundingPrecision);
  };

  return (
    <Collapse defaultActiveKey={['data-integration']}>
      <Panel header='Data Integration' key='data-integration'>
        <Space direction='vertical' style={{ width: '100%' }} />
        <Form size='small'>
          {changesOutstanding && (
            <Form.Item>
              <Alert
                message='Your changes are not yet applied. To rerun data integration, click Apply.'
                type='warning'
                showIcon
              />
            </Form.Item>
          )}
          <Form.Item>
            <Text>
              <strong style={{ marginRight: '0.5rem' }}>Data integration settings:</strong>
              <Tooltip title='Integration of multiple samples corrects for batch effect. These methods identify shared cell states that are present across different datasets, even if they were collected from different individuals, experimental conditions, technologies, or even species. The user selects the integration method and sets the controls, as appropriate. The latest Seurat method is selected as default.'>
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
              >
                {
                  methods.map((el) => (
                    <Option key={el.text} value={el.value} disabled={el.disabled}>{el.text}</Option>
                  ))
                }
              </Select>
            </Form.Item>

            {
              methodOptions[dataIntegration.method]()
            }

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
                  setChangesOutstanding(true);
                  setNumPCs(value);
                }}
                onPressEnter={(e) => e.preventDefault()}
                onStep={(value) => updateSettings({ dimensionalityReduction: { numPCs: value } })}
                onBlur={(e) => updateSettings({ dimensionalityReduction: { numPCs: parseInt(e.target.value, 0) } })}
              />
            </Form.Item>
            <Form.Item label='% variation explained'>
              <InputNumber
                value={roundedVariationExplained()}
                disabled
                readOnly
              />
            </Form.Item>
            <Form.Item label='Exclude genes categories:'>
              <Checkbox.Group
                onChange={(val) => updateSettings({ dimensionalityReduction: { excludeGeneCategories: val } })}
                value={dimensionalityReduction.excludeGeneCategories}
              >
                <Space direction='vertical'>
                  <Checkbox value='ribosomal'>ribosomal</Checkbox>
                  <Checkbox value='mitochondrial'>mitochondrial</Checkbox>
                  <Checkbox value='cellCycle'>cell cycle</Checkbox>
                </Space>
              </Checkbox.Group>
            </Form.Item>
            <Form.Item label='Method:'>
              <Select
                value={dimensionalityReduction.method}
                onChange={(val) => updateSettings({ dimensionalityReduction: { method: val } })}
              >
                <Option key='rpca' value='rpca'>Reciprocal PCA (RPCA)</Option>
                <Option key='cca' value='cca'>Cannonical Correlation Analysis (CCA)</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Row>
                <Col span={6}>
                  <Tooltip title={!changesOutstanding ? 'No outstanding changes' : ''}>
                    <Button
                      size='small'
                      type='primary'
                      htmlType='submit'
                      disabled={!changesOutstanding}
                      onClick={applyDataIntegrationSettings}
                    >
                      Apply
                    </Button>
                  </Tooltip>
                </Col>
              </Row>
            </Form.Item>
          </div>
        </Form>
      </Panel>
    </Collapse>
  );
};

CalculationConfig.propTypes = {
  experimentId: PropTypes.string.isRequired,
};

export default CalculationConfig;
