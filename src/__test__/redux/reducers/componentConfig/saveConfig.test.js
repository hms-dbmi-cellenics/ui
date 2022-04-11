import saveReducer from '../../../../redux/reducers/componentConfig/saveConfig';

describe('saveconfig', () => {
  it('Last updated date is set', () => {
    const newState = saveReducer({}, {
      payload: {
        plotUuid: 'embeddingCategoricalMain',
        lastUpdated: 'Wed Oct 28 2020',
      },
    });
    expect(newState).toMatchSnapshot();
  });
});
