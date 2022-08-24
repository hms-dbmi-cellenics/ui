import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  Modal, Alert, Radio, Space, InputNumber, Select, Button, Row, Typography,
} from 'antd';
import PropTypes from 'prop-types';

import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';
import getDiffExprGenes from 'utils/differentialExpression/getDiffExprGenes';
import writeToFileURL from 'utils/writeToFileURL';
import downloadFromUrl from 'utils/data-management/downloadFromUrl';

import getBackgroundExpressedGenes from 'utils/differentialExpression/getBackgroundExpressedGenes';
import enrichrSpecies from 'utils/pathwayAnalysis/enrichrConstants';
import pantherDBSpecies from 'utils/pathwayAnalysis/pantherDBSpecies.json';
import { pathwayServices } from 'utils/pathwayAnalysis/pathwayConstants';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const marginSpacing = { marginBottom: '20px', marginTop: '20x' };
const inlineButtonStyle = { padding: 0, height: '1rem' };

const { Paragraph } = Typography;

const LaunchPathwayAnalysisModal = (props) => {
  const {
    onCancel, onOpenAdvancedFilters, advancedFiltersAdded,
  } = props;

  const dispatch = useDispatch();

  const [externalService, setExternalService] = useState(pathwayServices.PANTHERDB);
  const [useAllGenes, setUseAllGenes] = useState(true);
  const [numGenes, setNumGenes] = useState(0);
  const [gettingBackgroundGenes, setGettingBackgroundGenes] = useState(false);
  const [launchingPathwayAnalysis, setLaunchingPathwayAnalysis] = useState(false);
  const [species, setSpecies] = useState(null);
  const speciesList = {
    [pathwayServices.PANTHERDB]: pantherDBSpecies,
    [pathwayServices.ENRICHR]: enrichrSpecies,
  };

  const getBackgroundGenesList = async () => {
    setGettingBackgroundGenes(true);
    let cleanList = null;

    try {
      const genesList = await dispatch(getBackgroundExpressedGenes());
      cleanList = genesList.join('\n');
    } catch (e) {
      handleError(e, endUserMessages.ERROR_FETCH_BACKGROUND_GENE_EXP);
    } finally {
      setGettingBackgroundGenes(false);
    }

    return cleanList;
  };

  // PantherDB and Enrichr species list have different values.
  // therefore, when switching between the two, we need to update the value to
  // correspond with a value in the species list.
  useEffect(() => {
    setSpecies(speciesList[externalService][0]?.value);
  }, [externalService]);

  const launchPathwayAnalysis = async (serviceName) => {
    setLaunchingPathwayAnalysis(true);

    try {
      const pathwayGenesList = await dispatch(getDiffExprGenes(useAllGenes, numGenes));
      launchPathwayService(serviceName, pathwayGenesList, species);
    } catch (e) {
      handleError(e, endUserMessages.ERROR_LAUNCH_PATHWAY);
    } finally {
      setLaunchingPathwayAnalysis(false);
    }
  };

  const canLaunchService = () => !launchingPathwayAnalysis && species;

  return (
    <>
      <Modal
        visible
        title='Pathway Analysis'
        width='50%'
        onCancel={onCancel}
        footer={(
          <Button
            disabled={!canLaunchService()}
            loading={launchingPathwayAnalysis}
            type='primary'
            onClick={() => launchPathwayAnalysis(externalService)}
          >
            {!canLaunchService() ? 'Loading...' : 'Launch'}
          </Button>
        )}
      >
        {!advancedFiltersAdded && (
          <Alert
            type='warning'
            showIcon
            style={{
              ...marginSpacing,
              width: '100%',
            }}
            message={(
              <>
                You have not performed any filtering on the genes!
                <Button
                  type='link'
                  size='small'
                  onClick={() => onOpenAdvancedFilters()}
                >
                  Click here to open the advanced filtering options.
                </Button>
              </>
            )}
          />
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
          <Paragraph>
            It is
            <b> strongly recommended </b>
            {' '}
            to input the reference list of genes by setting it in &quot;Reference List&quot; in the PantherDB results page
            and re-run the pathway analysis.
            {' '}
            <Button
              type='link'
              disabled={gettingBackgroundGenes}
              loading={gettingBackgroundGenes}
              style={inlineButtonStyle}
              onClick={async () => {
                const genesList = await getBackgroundGenesList();
                const fileUrl = writeToFileURL(genesList);
                downloadFromUrl(fileUrl, 'reference_genes_list.txt');
              }}
            >
              Click here to download the reference genes list
            </Button>
            .
          </Paragraph>
        )}

        <Alert
          type='warning'
          style={{
            width: '100%',
          }}
          message={(
            <>
              <Paragraph
                style={{
                  margin: 0,
                }}
              >
                You will be redirected to an external service to carry out pathway analysis. The
                {' '}
                <b>list of genes</b>
                {' '}
                and
                {' '}
                <b>species</b>
                {' '}
                will be submitted. No other information about you or your project will be sent.
              </Paragraph>
              {externalService === pathwayServices.PANTHERDB && (
                <Paragraph
                  style={{
                    margin: '1rem 0 0 0',
                  }}
                >
                  PantherDB is hosted in an unsecured server (HTTP). You will see a warning when you launch the service. Click “Send anyway” to continue.
                </Paragraph>
              )}
            </>
          )}
        />
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
