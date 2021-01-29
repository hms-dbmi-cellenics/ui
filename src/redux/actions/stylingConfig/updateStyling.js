import STYLING_CONFIG_UPDATE from '../../actionTypes/stylingConfig';

const updateStylingConfig = (experimentId, settingName, configChange) => (dispatch) => {
  dispatch({
    type: STYLING_CONFIG_UPDATE,
    payload:
      { experimentId, settingName, configChange },
  });
};

export default updateStylingConfig;
