import React from 'react';
import PropTypes from 'prop-types';
import {
  Collapse, Radio, Form, Slider, Skeleton,
} from 'antd';
import SelectData from 'components/plots/styling/SelectData';
import SingleGeneSelection from '../SingleGeneSelection';

const { Panel } = Collapse;

const ViolinControls = (props) => {
  const {
    config, onUpdate, setSearchedGene, cellSets,
  } = props;

  return (
    <Collapse>
      <Panel header='Gene selection' key='Gene selection'>
        <SingleGeneSelection
          config={config}
          setSearchedGene={setSearchedGene}
        />
      </Panel>
      <Panel header='Select data' key='Select data'>
        <SelectData
          config={config}
          onUpdate={onUpdate}
          cellSets={cellSets}
          axisName='x'
        />
      </Panel>
      <Panel header='Data transformation' key='16'>
        {config ? (
          <div>
            <Form.Item>
              <p>Transform Gene Expression</p>
              <Radio.Group
                onChange={(e) => onUpdate({ normalised: e.target.value })}
                value={config.normalised}
              >
                <Radio value='normalised'>Normalized</Radio>
                <Radio value='raw'>Raw values</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item label='Bandwidth Adjustment'>
              <Slider
                value={config.kdeBandwidth}
                min={0}
                max={1}
                onChange={(val) => onUpdate({ kdeBandwidth: val })}
                step={0.05}
              />
            </Form.Item>
          </div>
        ) : <Skeleton.Input style={{ width: 200 }} active />}
      </Panel>
    </Collapse>
  );
};

ViolinControls.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  setSearchedGene: PropTypes.func.isRequired,
  cellSets: PropTypes.object.isRequired,
};
export default ViolinControls;
