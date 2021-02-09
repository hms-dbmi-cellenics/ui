import React, { useState } from 'react';
import _ from 'lodash';

import {
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
  InfoCircleOutlined,
} from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

const CalculationConfig = () => {
  const methodOptions = [
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

  const initialState = {
    dataIntegration: {
      method: 'seuratv4',
      noGenes: 2000,
      normalisation: 'logNormalise',
    },
    dimensionalityReduction: {
      numPCs: 30,
      variationExplained: 91,
      excludeGeneCategories: [],
      method: 'rpca',
    },
  };

  const [changesOutstanding, setChangesOutstanding] = useState(false);
  const [settings, setSettings] = useState(initialState);
  const [savedSettings, setSavedSettings] = useState(initialState);

  const updateSettings = (diff) => {
    const newSettings = _.cloneDeep(settings);

    // Customizer function to replace value of array in object
    const arrayMerge = (obj, src) => {
      if (_.isArray(obj)) {
        return src;
      }
    };

    _.mergeWith(newSettings, diff, arrayMerge);

    setChangesOutstanding(!_.isEqual(newSettings, savedSettings));
    setSettings(newSettings);
  };

  return (
    <>
      <Space direction='vertical' style={{ width: '100%' }} />
      <Form size='small'>
        <Form.Item>
          <Text>
            <span style={{ marginRight: '0.5rem' }}>Set the parameters for Data Integration</span>
            <Tooltip title='Integration of multiple samples corrects for batch effect. These methods identify shared cell states that are present across different datasets, even if they were collected from different individuals, experimental conditions, technologies, or even species. The user selects the integration method and sets the controls, as appropriate. The latest Seurat method is selected as default.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>
          </Text>
        </Form.Item>
        <div style={{ paddingLeft: '1rem' }}>
          <Form.Item
            label='Method:'
          >
            <Select
              value={settings.dataIntegration.method}
              onChange={(val) => updateSettings({ dataIntegration: { method: val } })}
            >
              {
                methodOptions.map((el) => (
                  <Option value={el.value} disabled={el.disabled}>{el.text}</Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item label='# of genes:'>
            <InputNumber
              value={settings.dataIntegration.noGenes}
              step={100}
              min={1}
              onChange={(value) => updateSettings({ dataIntegration: { noGenes: value } })}
              onStep={(value) => updateSettings({ dataIntegration: { noGenes: value } })}
            />
          </Form.Item>
          <Form.Item label='Normalisation:'>
            <Select
              value={settings.dataIntegration.normalisation}
              onChange={(val) => updateSettings({ dataIntegration: { normalisation: val } })}
            >
              <Option value='logNormalise'>LogNormalise</Option>
              <Option value='scTransform'>SCTransform</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item>
          <Text>
            <span style={{ marginRight: '0.5rem' }}>Set the parameters for Dimensionality Reduction</span>
            <Tooltip title='Dimensionality reduction is necessary to summarise and visualise single cell RNA-seq data. The most common method is Principal Component Analysis. The user sets the number of Principal Components (PCs). This is the number that explains the majority of the variation within the dataset (ideally >90%), and is typically set between 5 and 30.'>
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>
          </Text>
        </Form.Item>
        <div style={{ paddingLeft: '1rem' }}>
          <Form.Item label='Number of Principal Components'>
            <InputNumber
              value={settings.dimensionalityReduction.numPCs}
              onChange={(value) => updateSettings({ dimensionalityReduction: { numPCs: value } })}
              onStep={(value) => updateSettings({ dimensionalityReduction: { numPCs: value } })}
            />
          </Form.Item>
          <Form.Item label='% variation explained'>
            <InputNumber
              value={settings.dimensionalityReduction.variationExplained}
              readOnly
            />
          </Form.Item>
          <Form.Item label='Exclude genes categories:'>
            <Checkbox.Group
              onChange={(val) => updateSettings({ dimensionalityReduction: { excludeGeneCategories: val } })}
              value={settings.dimensionalityReduction.excludeGeneCategories}
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
              value={settings.dimensionalityReduction.method}
              onChange={(val) => updateSettings({ dimensionalityReduction: { method: val } })}
            >
              <Option value='rpca'>Reciprocal PCA (RPCA)</Option>
              <Option value='cca'>Cannonical Correlation Analysis (CCA)</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Row>
              <Col span={6}>
                <Button
                  type='primary'
                  htmlType='submit'
                  disabled={!changesOutstanding}
                  onClick={() => {
                    setSavedSettings(settings);
                    setChangesOutstanding(!changesOutstanding);
                  }}
                >
                  Run

                </Button>
              </Col>
              <Col span={18}>
                {changesOutstanding && (
                  <Alert
                    message='The settings changes are not reflected in the plots - click run to update the plots.'
                    type='warning'
                    showIcon
                  />
                )}
              </Col>
            </Row>
          </Form.Item>
        </div>
      </Form>
    </>
  );
};

export default CalculationConfig;
