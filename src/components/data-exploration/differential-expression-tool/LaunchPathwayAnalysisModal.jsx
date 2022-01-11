import React, { useState } from 'react';
import {
  Modal, Alert, Radio, Space, InputNumber, Select, Tooltip, Button, Typography, Row,
} from 'antd';
import PropTypes from 'prop-types';

import AdvancedFilteringModal from './AdvancedFilteringModal';

const { Paragraph } = Typography;

const speciesOptions = [{
  value: 'musculus',
  label: 'Mus musculus',
}, {
  value: 'sapiens',
  label: 'Homo sapiens',
}, {
  value: 'melanogaster',
  label: 'Drosophila melanogaster',
}, {
  value: 'cerevisiae',
  label: 'Saccharomyces cerevisiae',
}, {
  value: 'elegans',
  label: 'Caenorhabditis elegans',
}, {
  value: 'rerio',
  label: 'Danio rerio',
}];

const LaunchPathwayAnalysisModal = (props) => {
  const { onCancel, advancedFiltersAdded } = props;
  const externalServices = { PANTHER: 'pantherdb', ENRICHER: 'enrichr' };

  const [externalService, setExternalService] = useState(externalServices.PANTHER);
  const [advancedFilteringOpen, setAdvancedFilteringOpen] = useState(false);
  const [allGenesToggled, setAllGenesToggled] = useState(true);

  const marginSpacing = { marginBottom: '20px', marginTop: '20x' };

  return (
    <>
      <Modal
        visible
        title='Pathway Analysis'
        width='50%'
        onCancel={onCancel}
        // remove next line once the functionality is implemented
        footer={[<Tooltip key='tooltip' title='Feature coming soon!'><Button disabled>Launch</Button></Tooltip>]}
        okText='Launch'
      >
        <Row style={{
          ...marginSpacing,
        }}
        >
          {/* display the alert only if there are no filter applied to diff expr */}
          <Paragraph style={{ width: '100%' }}>
            {!advancedFiltersAdded && (
            <Alert
              type='warning'
              showIcon
              message={(
                <>
                  You have not performed any filtering on the genes!
                  <Button
                    type='link'
                    size='small'
                    onClick={() => setAdvancedFilteringOpen(!advancedFilteringOpen)}
                    onKeyPress={() => setAdvancedFilteringOpen(!advancedFilteringOpen)}
                  >
                    Click here to open the advanced filtering options.
                  </Button>
                </>
              )}
            />
            )}
          </Paragraph>
        </Row>

        <Row style={marginSpacing}><b>External service</b></Row>

        <Row style={marginSpacing}>
          <Radio.Group value={externalService} onChange={(e) => setExternalService(e.target.value)}>
            {Object.keys(externalServices).map((service) => {
              const serviceName = externalServices[service];
              return (<Radio key={service} value={serviceName}>{serviceName}</Radio>);
            })}
          </Radio.Group>
        </Row>

        <Row style={marginSpacing}>
          <Space direction='vertical'>
            <b>Species</b>

            <Select style={{ width: 400 }}>
              {
                speciesOptions.map((option) => (
                  <Select.Option value={option.value}><i>{option.label}</i></Select.Option>
                ))
              }
            </Select>
          </Space>
          <Space
            style={{ 'margin-left': '5%' }}
            direction='vertical'
          >
            <b>Number of genes</b>
            <Space>
              <Radio.Group
                value={allGenesToggled}
                onChange={(e) => setAllGenesToggled(e.target.value)}
              >
                <Space>
                  <Radio value>All</Radio>
                  <Radio value={false}>Top</Radio>
                </Space>
              </Radio.Group>
              <InputNumber
                disabled={allGenesToggled}
                size='medium'
                style={{ width: '100px' }}
                min={0}
                placeholder='# of genes'
              />
            </Space>
          </Space>
        </Row>
        {externalService === externalServices.PANTHER && (
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
      {
        advancedFilteringOpen && (
          <AdvancedFilteringModal onCancel={() => setAdvancedFilteringOpen(false)} />
        )
      }
    </>
  );
};
LaunchPathwayAnalysisModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
  advancedFiltersAdded: PropTypes.bool.isRequired,
};
export default LaunchPathwayAnalysisModal;
