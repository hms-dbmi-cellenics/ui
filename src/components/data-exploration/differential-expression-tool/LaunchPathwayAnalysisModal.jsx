/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState } from 'react';
import {
  Modal, Alert, Radio, Space, InputNumber, Select, Tooltip, Button,
} from 'antd';
import PropTypes from 'prop-types';
import AdvancedFilteringModal from './AdvancedFilteringModal';

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
  const { onCancel } = props;
  const externalServices = { PANTHER: 'pantherdb', ENRICHER: 'enrichr' };

  const [externalService, setExternalService] = useState(externalServices.PANTHER);
  const [advancedFilteringOpen, setAdvancedFilteringOpen] = useState(false);
  const [allGenesToggled, setAllGenesToggled] = useState(false);

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
        <Space direction='vertical' size='large'>
          {/* display the alert only if there are no filter applied to diff expr */}
          <Alert
            type='warning'
            showIcon
            message={(
              <p>
                You have not performed any filtering on the genes!
                <a
                  onClick={() => setAdvancedFilteringOpen(!advancedFilteringOpen)}
                  onKeyPress={() => setAdvancedFilteringOpen(!advancedFilteringOpen)}
                >
                  {' '}
                  Click here to open the advanced filtering options.
                </a>
              </p>
            )}
          />

          <b>External service</b>

          <Radio.Group value={externalService} onChange={(e) => setExternalService(e.target.value)}>
            {Object.keys(externalServices).map((service) => {
              const serviceName = externalServices[service];
              return (<Radio key={service} value={serviceName}>{serviceName}</Radio>);
            })}
          </Radio.Group>

          <Space size='large'>
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
                <Radio.Group value={allGenesToggled} onChange={(e) => setAllGenesToggled(e.target.value)}>
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
          </Space>
          {externalService === externalServices.PANTHER && (
            <p>
              It is
              <b> strongly recommended </b>
              {' '}
              to input the reference list of genes by setting it in "Reference List"
              then re-run the pathway analysis in the pantherdb page.
              {' '}
              <br />
              You can either
              <a> Download reference genes into file </a>
              {' '}
              or
              <a> Copy reference genes to clipboard </a>
            </p>
          )}
        </Space>
      </Modal>
      {advancedFilteringOpen && (
        <AdvancedFilteringModal onCancel={() => setAdvancedFilteringOpen(false)} />
      )}
    </>
  );
};
LaunchPathwayAnalysisModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
};
export default LaunchPathwayAnalysisModal;
