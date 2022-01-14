import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Modal, Alert, Radio, Space, InputNumber, Select, Button, Typography, Row,
} from 'antd';
import PropTypes from 'prop-types';

import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';
import getDiffExprGenes from 'utils/differentialExpression/getDiffExprGenes';
import { pathwayServices, speciesList } from 'utils/pathwayAnalysis/pathwayConstants';

const { Paragraph } = Typography;

const LaunchPathwayAnalysisModal = (props) => {
  const {
    onCancel, onOpenAdvancedFilters, advancedFiltersAdded,
  } = props;

  const [externalService, setExternalService] = useState(pathwayServices.PANTHERDB);
  const [useAllGenes, setUseAllGenes] = useState(true);
  const [numGenes, setNumGenes] = useState(0);
  const [waitingForExternalService, setWaitingForExternalService] = useState(false);
  const [species, setSpecies] = useState(speciesList[0]?.value);

  const dispatch = useDispatch();

  const marginSpacing = { marginBottom: '20px', marginTop: '20x' };

  const launchPathwayAnalysis = async (serviceName) => {
    setWaitingForExternalService(true);

    try {
      const pathwayGenesList = await dispatch(getDiffExprGenes(useAllGenes, numGenes));
      launchPathwayService(serviceName, pathwayGenesList, species);
    } catch (error) {
      throw new Error('Error launching pathway analysis', error);
    } finally {
      setWaitingForExternalService(false);
    }
  };

  return (
    <>
      <Modal
        visible
        title='Pathway Analysis'
        width='50%'
        onCancel={onCancel}
        footer={[
          <Button
            disabled={waitingForExternalService}
            type='primary'
            onClick={() => launchPathwayAnalysis(externalService)}
          >
            {waitingForExternalService ? 'Loading...' : 'Launch'}
          </Button>,
        ]}
      >
        {!advancedFiltersAdded && (
          <Row style={{
            ...marginSpacing,
          }}
          >
            {/* display the alert only if there are no filter applied to diff expr */}
            <Paragraph style={{ width: '100%' }}>
              <Alert
                type='warning'
                showIcon
                message={(
                  <>
                    You have not performed any filtering on the genes!
                    <Button
                      type='link'
                      size='small'
                      onClick={() => onOpenAdvancedFilters()}
                      onKeyPress={() => onOpenAdvancedFilters()}
                    >
                      Click here to open the advanced filtering options.
                    </Button>
                  </>
                )}
              />
            </Paragraph>
          </Row>
        )}

        <Row style={marginSpacing}><b>External service</b></Row>

        <Row style={marginSpacing}>
          <Radio.Group value={externalService} onChange={(e) => setExternalService(e.target.value)}>
            {Object.keys(pathwayServices).map((service) => {
              const serviceName = pathwayServices[service];
              return (<Radio key={service} value={serviceName}>{serviceName}</Radio>);
            })}
          </Radio.Group>
        </Row>

        <Row style={marginSpacing}>
          <Space direction='vertical'>
            <b>Species</b>

            <Select value={species} onChange={(value) => setSpecies(value)} style={{ width: 400 }}>
              {
                speciesList.map((option) => (
                  <Select.Option value={option.value}><i>{option.label}</i></Select.Option>
                ))
              }
            </Select>
          </Space>
          <Space
            style={{ marginLeft: '5%' }}
            direction='vertical'
          >
            <b>Number of genes</b>
            <Space>
              <Radio.Group
                value={useAllGenes}
                onChange={(e) => setUseAllGenes(e.target.value)}
              >
                <Space>
                  <Radio value>All</Radio>
                  <Radio value={false}>Top</Radio>
                </Space>
              </Radio.Group>
              <InputNumber
                value={numGenes}
                onChange={(value) => setNumGenes(value)}
                disabled={useAllGenes}
                size='medium'
                style={{ width: '100px' }}
                min={0}
                placeholder='# of genes'
              />
            </Space>
          </Space>
        </Row>
        {externalService === pathwayServices.PANTHERDB && (
          <p>
            It is
            <b> strongly recommended </b>
            {' '}
            to input the reference list of genes by setting it in &quot;Reference List&quot;
            then re-run the pathway analysis in the pantherdb page.
            {' '}
            You can either download reference genes into file or copy reference genes to clipboard.
          </p>
        )}
      </Modal>
    </>
  );
};

LaunchPathwayAnalysisModal.propTypes = {
  onOpenAdvancedFilters: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  advancedFiltersAdded: PropTypes.bool,
};

LaunchPathwayAnalysisModal.defaultProps = {
  onOpenAdvancedFilters: null,
  advancedFiltersAdded: false,
};

export default LaunchPathwayAnalysisModal;
