import React from 'react';
import PropTypes from 'prop-types';
import {
  Collapse, Radio, Form, Slider, Skeleton,
} from 'antd';
import SelectData from 'components/plots/styling/SelectData';
import MultiViewEditor from 'components/plots/styling/MultiViewEditor';
import { plotUuids, plotTypes } from 'utils/constants';
import GeneSearchBar from 'components/plots/GeneSearchBar';

const { Panel } = Collapse;
const plotUuid = plotUuids.VIOLIN_PLOT;
const plotType = plotTypes.VIOLIN_PLOT;
const ViolinControls = (props) => {
  const {
    experimentId,
    config,
    onUpdateConditional,
    updateAll,
    setUpdateAll,
    selectedPlotUuid,
    setSelectedPlotUuid,
    cellSets,
    shownGenes,
    changeSelectedPlotGene,
  } = props;

  return (
    <Collapse defaultActiveKey='view-multiple-plots'>
      <Panel header='Gene selection' key='gene-selection'>
        <GeneSearchBar
          onSelect={changeSelectedPlotGene}
          allowMultiple={false}
          buttonText='Search'
        />
      </Panel>
      <Panel header='View multiple plots' key='view-multiple-plots'>
        <MultiViewEditor
          updateAll={updateAll}
          experimentId={experimentId}
          setUpdateAll={setUpdateAll}
          plotUuid={plotUuid}
          plotType={plotType}
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
                <Radio value='raw'>Raw values</Radio>
                <Radio value='zScore'>Z-score</Radio>
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
  onUpdateConditional: PropTypes.func.isRequired,
  updateAll: PropTypes.bool.isRequired,
  setUpdateAll: PropTypes.func.isRequired,
  selectedPlotUuid: PropTypes.string.isRequired,
  setSelectedPlotUuid: PropTypes.func.isRequired,
  cellSets: PropTypes.object.isRequired,
  shownGenes: PropTypes.array.isRequired,
  experimentId: PropTypes.string.isRequired,
  changeSelectedPlotGene: PropTypes.func.isRequired,
};

ViolinControls.defaultProps = {
  config: null,
};

export default ViolinControls;
