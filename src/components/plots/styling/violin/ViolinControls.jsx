import React from 'react';
import PropTypes from 'prop-types';
import {
  Collapse, Radio, Form, Slider, Skeleton,
} from 'antd';
import SelectData from 'components/plots/styling/SelectData';
import MultiViewEditor from 'components/plots/styling/MultiViewEditor';
import GeneSearchBar from 'components/plots/GeneSearchBar';

const { Panel } = Collapse;

const ViolinControls = (props) => {
  const {
    config,
    multiViewConfig,
    onUpdate,
    onUpdateConditional,
    updateAll,
    setUpdateAll,
    onMultiViewUpdate,
    selectedPlotUuid,
    setSelectedPlotUuid,
    addGeneToMultiView,
    cellSets,
    shownGenes,
  } = props;

  const genesToDisable = config ? [config.shownGene] : [];

  return (
    <Collapse>
      <Panel header='Gene selection' key='gene-selection'>
        <GeneSearchBar
          genesToDisable={genesToDisable}
          onSelect={(gene) => onUpdate({ shownGene: gene, title: { text: gene } })}
          allowMultiple={false}
          buttonText='Search'
        />
      </Panel>
      <Panel header='View multiple plots' key='view-multiple-plots'>
        <MultiViewEditor
          multiViewConfig={multiViewConfig}
          addGeneToMultiView={addGeneToMultiView}
          updateAll={updateAll}
          setUpdateAll={setUpdateAll}
          onMultiViewUpdate={onMultiViewUpdate}
          selectedPlotUuid={selectedPlotUuid}
          setSelectedPlotUuid={setSelectedPlotUuid}
          shownGenes={shownGenes}
        />
      </Panel>
      <Panel header='Select data' key='select-data'>
        <SelectData
          config={config}
          onUpdate={onUpdateConditional}
          cellSets={cellSets}
          firstSelectionText='Select the cell sets or metadata that cells are grouped by (determines the x-axis)'
        />
      </Panel>
      <Panel header='Data transformation' key='data-transformation'>
        {config ? (
          <div>
            <Form.Item>
              <p>Transform Gene Expression</p>
              <Radio.Group
                onChange={(e) => onUpdateConditional({ normalised: e.target.value })}
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
                onChange={(val) => onUpdateConditional({ kdeBandwidth: val })}
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
  config: PropTypes.object,
  multiViewConfig: PropTypes.object,
  onUpdate: PropTypes.func.isRequired,
  onUpdateConditional: PropTypes.func.isRequired,
  updateAll: PropTypes.bool.isRequired,
  setUpdateAll: PropTypes.func.isRequired,
  onMultiViewUpdate: PropTypes.func.isRequired,
  addGeneToMultiView: PropTypes.func.isRequired,
  selectedPlotUuid: PropTypes.string.isRequired,
  setSelectedPlotUuid: PropTypes.func.isRequired,
  cellSets: PropTypes.object.isRequired,
  shownGenes: PropTypes.array,
};

ViolinControls.defaultProps = {
  config: null,
  multiViewConfig: null,
  shownGenes: [],
};

export default ViolinControls;
