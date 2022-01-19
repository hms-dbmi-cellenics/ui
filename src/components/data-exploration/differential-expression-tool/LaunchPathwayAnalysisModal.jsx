import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal, Alert, Radio, Space, InputNumber, Select, Button, Typography, Row,
} from 'antd';
import PropTypes from 'prop-types';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';
import getDiffExprGenes from 'utils/differentialExpression/getDiffExprGenes';
import writeToFileURL from 'utils/writeToFileURL';
import downloadFromUrl from 'utils/data-management/downloadFromUrl';

import getBackgroundExpressedGenes from 'utils/differentialExpression/getBackgroundExpressedGenes';
import enrichrSpecies from 'utils/pathwayAnalysis/enrichrConstants';
import pantherDBSpecies from 'utils/pathwayAnalysis/pantherDBSpecies.json';
import { pathwayServices } from 'utils/pathwayAnalysis/pathwayConstants';

const { Paragraph } = Typography;

const marginSpacing = { marginBottom: '20px', marginTop: '20x' };
const inlineButtonStyle = { padding: 0, height: '1rem' };

const calculateGenesListHash = (type, group) => JSON.stringify({ type, group });

const LaunchPathwayAnalysisModal = (props) => {
  const {
    onCancel, onOpenAdvancedFilters, advancedFiltersAdded,
  } = props;

  const backgroundGenesListHash = useRef(null);
  const dispatch = useDispatch();

  const [externalService, setExternalService] = useState(pathwayServices.PANTHERDB);
  const [useAllGenes, setUseAllGenes] = useState(true);
  const [numGenes, setNumGenes] = useState(0);
  const [waitingForExternalService, setWaitingForExternalService] = useState(false);
  const [species, setSpecies] = useState(null);
  const [backgroundGenesList, setBackgroundGenesList] = useState(null);
  const speciesList = {
    [pathwayServices.PANTHERDB]: pantherDBSpecies,
    [pathwayServices.ENRICHR]: enrichrSpecies,
  };

  const { type, group } = useSelector((state) => state.differentialExpression.comparison);

  const getBackgroundGenesList = async () => {
    const genesListHash = calculateGenesListHash(type, group);

    if (backgroundGenesListHash.current === genesListHash) {
      return backgroundGenesList;
    }

    backgroundGenesListHash.current = genesListHash;

    const genesList = await dispatch(getBackgroundExpressedGenes());
    const cleanList = genesList.join('\n');
    setBackgroundGenesList(cleanList);

    return cleanList;
  };

  // PantherDB and Enrichr species list have different values.
  // therefore, when switching between the two, we need to update the value to
  // correspond with a value in the species list.
  useEffect(() => {
    setSpecies(speciesList[externalService][0]?.value);
  }, [externalService]);

  const launchPathwayAnalysis = async (serviceName) => {
    setWaitingForExternalService(true);

    try {
      const pathwayGenesList = await dispatch(getDiffExprGenes(useAllGenes, numGenes));
      launchPathwayService(serviceName, pathwayGenesList, species);
    } catch (error) {
      pushNotificationMessage('error', 'Failed launching pathway analysis');
      console.error('Error launching pathway analysis', error);
    } finally {
      setWaitingForExternalService(false);
    }
  };

  const canLaunchService = () => !waitingForExternalService && species;

  return (
    <>
      <Modal
        visible
        title='Pathway Analysis'
        width='50%'
        onCancel={onCancel}
        footer={[
          <Button
            disabled={!canLaunchService()}
            type='primary'
            onClick={() => launchPathwayAnalysis(externalService)}
          >
            {!canLaunchService() ? 'Loading...' : 'Launch'}
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

            <Select
              loading={speciesList[externalService].length === 0}
              value={species}
              onChange={(value) => setSpecies(value)}
              style={{ width: 400 }}
            >
              {
                speciesList[externalService].map((option) => (
                  <Select.Option
                    key={option.value}
                    value={option.value}
                  >
                    <i>{option.label}</i>
                  </Select.Option>
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
            then re-run the pathway analysis in the PantherDB page.
            {' '}
            You can either
            {' '}
            <Button
              type='link'
              style={inlineButtonStyle}
              onClick={async () => {
                const genesList = await getBackgroundGenesList();
                const fileUrl = writeToFileURL(genesList);
                downloadFromUrl(fileUrl, 'genes_list.txt');
              }}
            >
              download reference genes into file
            </Button>
            {' '}
            or
            {' '}
            <Button
              type='link'
              style={inlineButtonStyle}
              onClick={async () => {
                const genesList = await getBackgroundGenesList();
                navigator.clipboard.writeText(genesList);
                pushNotificationMessage('success', 'Copied to clipboard');
              }}
            >
              copy reference genes to clipboard
            </Button>
            .
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
