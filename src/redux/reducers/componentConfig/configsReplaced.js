// import { initialPlotDataState } from 'redux/reducers/componentConfig/initialState';

const configsReplaced = (state, action) => {
  const { updatedConfigs } = action.payload;

  console.log('updatedConfigsDebug');
  console.log(updatedConfigs);

  return state;

  // return {
  //   ...state,
  //   [plotUuid]: {
  //     ...initialPlotDataState,
  //     ...state[plotUuid],
  //     experimentId,
  //     plotType,
  //     plotData,
  //     config,
  //     outstandingChanges: false,
  //   },
  // };
};

export default configsReplaced;
