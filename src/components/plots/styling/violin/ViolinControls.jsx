/* eslint-disable import/no-unresolved */
import React from 'react';
import PropTypes from 'prop-types';
import {
  Collapse, Radio, Form, Slider, Skeleton,
} from 'antd';
import { useSelector } from 'react-redux';
import SelectData from 'components/plots/styling/violin/SelectData';
import SingleGeneSelection from '../SingleGeneSelection';

const { Panel } = Collapse;

const ViolinControls = (props) => {
  const { config, onUpdate, setSearchedGene } = props;
  const cellSets = useSelector((state) => state.cellSets);

  return (
    <>
      <Collapse>
        <Panel header='Gene Selection' key='666'>
          <SingleGeneSelection
            config={config}
            setSearchedGene={setSearchedGene}
          />
        </Panel>
        <Panel header='Select Data' key='15'>
          {config && !cellSets.loading && !cellSets.error ? (
            <SelectData
              config={config}
              onUpdate={onUpdate}
              cellSets={cellSets}
            />
          ) : <Skeleton.Input style={{ width: 200 }} active />}
        </Panel>
        <Panel header='Data Transformation' key='16'>
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
    </>
  );
};

ViolinControls.propTypes = {
  config: PropTypes.object.isRequired,
  onUpdate: PropTypes.func.isRequired,
  setSearchedGene: PropTypes.func.isRequired,
};
export default ViolinControls;
