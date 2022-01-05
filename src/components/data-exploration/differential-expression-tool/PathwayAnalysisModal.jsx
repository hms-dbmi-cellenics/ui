import React, { useState } from 'react';
import {
  Modal, Alert, Radio, Space, InputNumber, Select,
} from 'antd';
import PropTypes from 'prop-types';
import AdvancedFilteringModal from './AdvancedFilteringModal';

const PathwayAnalysisModal = (props) => {
  const { onCancel } = props;
  const [externalService, setExternalService] = useState('pantherdb');
  const [advancedFilteringOpen, setAdvancedFilteringOpen] = useState(false);

  const speciesOptions = [{
    value: 'humanAndMouse',
    label: 'Human and Mouse',
  }, {
    value: 'melanogaster',
    label: 'D. melanogaster',
  }, {
    value: 'cerevisiae',
    label: 'S. cerevisiae',
  }, {
    value: 'elegans',
    label: 'C. elegans',
  }, {
    value: 'rerio',
    label: 'D. rerio',
  }];

  return (
    <>
      <Modal
        visible
        title='Pathway Analysis'
        onCancel={onCancel}
        okText='Launch'
      >
        <Space direction='vertical'>
          {/* display the alert only if there are no filter applied to diff expr */}
          <Alert
            type='warning'
            showIcon
            message={(
              <p>
                You have not performed any filtering on the genes!
                <a onClick={() => setAdvancedFilteringOpen(!advancedFilteringOpen)}>
                  {' '}
                  Click here to open the advanced filtering options.
                </a>
              </p>
            )}
          />

          <b>External service</b>
          <Radio.Group value={externalService} onChange={(e) => setExternalService(e.target.value)}>
            <Radio value='pantherdb'>pantherdb</Radio>
            <Radio value='enrichr'>enrichr</Radio>
          </Radio.Group>
          <Space>
            <Space direction='vertical'>
              <b>Species</b>

              <Select style={{ width: 200 }} options={speciesOptions} />
            </Space>
            <Space direction='vertical'>

              <b>Number of genes</b>
              <InputNumber />
            </Space>

          </Space>
          {externalService === 'pantherdb' && (
            <p>
              It is
              <b> strongly recommended </b>
              {' '}
              to input the reference list of genes by setting it in "Reference List"
              then re-run the pathway analysis in the pantherdb page. You can either
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
PathwayAnalysisModal.propTypes = {
  onCancel: PropTypes.func.isRequired,
};
export default PathwayAnalysisModal;
