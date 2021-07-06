import { EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS } from '../../../actionTypes/experimentSettings';

const discardChangedQCFilters = () => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_DISCARD_CHANGED_QC_FILTERS,
    payload: {},
  });
};

export default discardChangedQCFilters;
