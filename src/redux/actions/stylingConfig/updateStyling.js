import STYLING_CONFIG_UPDATE from '../../actionTypes/stylingConfig';

const updateStylingConfig = (experimentId, setting, configChange) => (dispatch) => {
  dispatch({
    type: STYLING_CONFIG_UPDATE,
    payload:
    {
      experimentId,
      setting: configChange,
    },
  });
};

export default updateStylingConfig;
