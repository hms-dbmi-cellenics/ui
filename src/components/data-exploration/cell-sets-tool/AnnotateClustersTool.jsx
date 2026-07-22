import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import {
  Alert,
  Button,
  Input, Modal, Radio, Select, Space, Table, Tooltip, Typography,
} from 'antd';
import { runCellSetsAnnotation, runCassiaAnnotation } from 'redux/actions/cellSets';
import { useDispatch } from 'react-redux';

const { Text, Paragraph } = Typography;

// Illustrative sample of what is actually sent to CASSIA's LLM provider: for
// each cluster, only the marker gene *names*, ranked by avg_log2FC from highest
// to lowest (top 50). The summary statistics (avg_log2FC, pct.1, pct.2) are used
// only locally to rank and filter the genes — they are NOT included in the prompt.
const exampleMarkerColumns = [
  { title: 'cluster', dataIndex: 'cluster', key: 'cluster' },
  { title: 'ranked marker genes (highest → lowest)', dataIndex: 'genes', key: 'genes' },
];

const exampleMarkerData = [
  { key: 1, cluster: 1, genes: 'CD3D, IL7R, CD3E, TRAC, CD2, LTB, … (top 50)' },
  { key: 2, cluster: 2, genes: 'MS4A1, CD79A, CD79B, CD19, HLA-DRA, TCL1A, … (top 50)' },
];

const tissueOptions = [
  'Immune system',
  'Pancreas',
  'Liver',
  'Eye',
  'Kidney',
  'Brain',
  'Lung',
  'Adrenal',
  'Heart',
  'Intestine',
  'Muscle',
  'Placenta',
  'Spleen',
  'Stomach',
  'Thymus',
];

const speciesOptions = [
  'human',
  'mouse',
];

const scTypeTooltipText = (
  <>
    Automatic annotation is performed using ScType, a marker gene-based tool
    developed by Aleksandr Ianevski et al.
    It uses a marker genes database which was build using
    {' '}
    <a target='_blank' href='http://biocc.hrbmu.edu.cn/CellMarker/' rel='noreferrer'>CellMarker</a>
    ,
    {' '}
    <a target='_blank' href='https://panglaodb.se/' rel='noreferrer'>PanglaoDB</a>
    ,
    and 15 novel cell types with corresponding marker genes added by
    manual curation of more than 10 papers.
    The current version of the ScType database contains a total of
    3,980 cell markers for 194 cell types in 17 human tissues and 4,212 cell markers
    for 194 cell types in 17 mouse tissues.
    More details can be found in
    {' '}
    <a target='_blank' href='https://www.nature.com/articles/s41467-022-28803-w' rel='noreferrer'>the ScType paper</a>
    {' '}
    and in
    {' '}
    <a target='_blank' href='https://github.com/IanevskiAleksandr/sc-type' rel='noreferrer'>the ScType github repo</a>
    .
  </>
);

const cassiaTooltipText = (
  <>
    Automatic annotation is performed using CASSIA, a multi-agent large language
    model system for interpretable cell type annotation developed by Elliot Xie
    et al. It computes marker genes per cluster and uses an LLM to predict cell
    types. Enter the species and tissue as free text (e.g. &quot;Human&quot;
    and &quot;Large Intestine&quot;).
    More details can be found in
    {' '}
    <a target='_blank' href='https://github.com/ElliotXie/CASSIA' rel='noreferrer'>the CASSIA github repo</a>
    .
  </>
);

const ANNOTATION_METHODS = {
  SCTYPE: 'sctype',
  CASSIA: 'cassia',
};

const AnnotateClustersTool = ({ experimentId, onRunAnnotation }) => {
  const dispatch = useDispatch();

  const [method, setMethod] = useState(ANNOTATION_METHODS.CASSIA);
  const [tissue, setTissue] = useState(null);
  const [species, setSpecies] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [cassiaModalVisible, setCassiaModalVisible] = useState(false);

  const isCassia = method === ANNOTATION_METHODS.CASSIA;

  // tissue/species have different valid values per method (enum vs free text)
  const onMethodChange = (e) => {
    setMethod(e.target.value);
    setTissue(null);
    setSpecies(null);
    setAdditionalInfo('');
  };

  const onCompute = () => {
    // CASSIA sends data to an external LLM provider, so confirm first
    if (isCassia) {
      setCassiaModalVisible(true);
      return;
    }
    dispatch(runCellSetsAnnotation(experimentId, species, tissue));
    onRunAnnotation();
  };

  const onConfirmCassia = () => {
    setCassiaModalVisible(false);
    dispatch(runCassiaAnnotation(experimentId, species, tissue, additionalInfo));
    onRunAnnotation();
  };

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <Radio.Group value={method} onChange={onMethodChange}>
        <Tooltip title={cassiaTooltipText}>
          <Radio value={ANNOTATION_METHODS.CASSIA}>CASSIA</Radio>
        </Tooltip>
        <Tooltip title={scTypeTooltipText}>
          <Radio value={ANNOTATION_METHODS.SCTYPE}>ScType</Radio>
        </Tooltip>
      </Radio.Group>

      <Space direction='vertical' style={{ width: '100%' }}>
        Tissue type:
        {isCassia ? (
          <Input
            value={tissue ?? ''}
            placeholder='e.g. Large Intestine'
            onChange={(e) => setTissue(e.target.value || null)}
            style={{ width: '100%' }}
            size='small'
          />
        ) : (
          <Select
            options={tissueOptions.map((option) => ({ label: option, value: option }))}
            value={tissue}
            placeholder='Select a tissue type'
            onChange={setTissue}
            style={{ width: '100%' }}
            size='small'
          />
        )}
      </Space>

      <Space direction='vertical' style={{ width: '100%' }}>
        Species:
        {isCassia ? (
          <Input
            value={species ?? ''}
            placeholder='e.g. Human'
            onChange={(e) => setSpecies(e.target.value || null)}
            style={{ width: '100%' }}
            size='small'
          />
        ) : (
          <Select
            options={speciesOptions.map((option) => ({ label: option, value: option }))}
            value={species}
            placeholder='Select a species'
            onChange={setSpecies}
            style={{ width: '100%' }}
            size='small'
          />
        )}
      </Space>

      {isCassia && (
        <Space direction='vertical' style={{ width: '100%' }}>
          Additional context (optional):
          <Input.TextArea
            value={additionalInfo}
            placeholder={'e.g. Samples include colorectal tumor and normal adjacent tissue; '
              + 'expect malignant epithelial populations.'}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 5 }}
            style={{ width: '100%' }}
            size='small'
          />
        </Space>
      )}

      <Button
        onClick={onCompute}
        disabled={_.isNil(tissue) || _.isNil(species)}
        size='small'
      >
        Compute
      </Button>

      <Modal
        title='Confirm CASSIA annotation'
        open={cassiaModalVisible}
        onCancel={() => setCassiaModalVisible(false)}
        onOk={onConfirmCassia}
        okText='Continue'
        cancelText='Cancel'
        width={640}
      >
        <Space direction='vertical' size='middle' style={{ width: '100%' }}>
          <Alert
            type='warning'
            showIcon
            message='This sends data to Amazon Bedrock'
            description={(
              <>
                CASSIA uses a large language model hosted on Amazon Bedrock to
                annotate your clusters. Continuing will send the data below
                outside Cellenics to that service.
                {' '}
                Per
                {' '}
                <a
                  target='_blank'
                  rel='noreferrer'
                  href='https://aws.amazon.com/bedrock/faqs/#security--banojj'
                >
                  AWS
                </a>
                , your inputs and the model outputs are not shared with the
                model providers and are not used to train any models, and the
                data is encrypted in transit and at rest within the AWS region.
              </>
            )}
          />

          <Paragraph style={{ marginBottom: 0 }}>
            Only the following is sent — no raw expression counts and no
            cell-level data leave Cellenics:
            <ul style={{ marginBottom: 0 }}>
              <li>
                the
                {' '}
                <Text strong>names of the top marker genes for each cluster</Text>
                {' '}
                (ranked by fold-change, highest first), in the format shown
                below — the underlying summary statistics are used only to rank
                and filter the genes and are not sent
              </li>
              <li>
                the tissue type
                {' '}
                <Text code>{tissue}</Text>
                {' '}
                and species
                {' '}
                <Text code>{species}</Text>
              </li>
              {additionalInfo.trim() && (
                <li>
                  the additional context you entered:
                  {' '}
                  <Text code>{additionalInfo.trim()}</Text>
                </li>
              )}
            </ul>
          </Paragraph>

          <div>
            <Text type='secondary'>
              Example of the ranked marker gene list sent per cluster
              (illustrative genes):
            </Text>
            <Table
              columns={exampleMarkerColumns}
              dataSource={exampleMarkerData}
              size='small'
              pagination={false}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </Space>
  );
};

AnnotateClustersTool.defaultProps = {};

AnnotateClustersTool.propTypes = {
  experimentId: PropTypes.string.isRequired,
  onRunAnnotation: PropTypes.func.isRequired,
};

export default AnnotateClustersTool;
