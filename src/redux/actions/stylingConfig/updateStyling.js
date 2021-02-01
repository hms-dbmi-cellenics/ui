import STYLING_CONFIG_UPDATE from '../../actionTypes/stylingConfig';

const updateStylingConfig = (experimentId, configChange) => (dispatch) => {
  dispatch({
    type: STYLING_CONFIG_UPDATE,
    payload:
      { experimentId, configChange },
  });
};

export default updateStylingConfig;
