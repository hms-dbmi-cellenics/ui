import React from 'react';
import * as rtl from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import preloadAll from 'jest-next-dynamic';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import _ from 'lodash';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import {
  initialComponentConfigStates,
} from '../../../redux/reducers/componentConfig/initialState';
import initialExperimentState from '../../../redux/reducers/experimentSettings/initialState';
import rootReducer from '../../../redux/reducers/index';
import genes from '../../../redux/reducers/genes/initialState';
import * as loadConfig from '../../../redux/reducers/componentConfig/loadConfig';
import { updatePlotConfig } from '../../../redux/actions/componentConfig/index';
import ViolinIndex from '../../../pages/experiments/[experimentId]/plots-and-tables/violin/index';
import * as generateViolinSpec from '../../../utils/plotSpecs/generateViolinSpec';
import { fetchCachedWork } from '../../../utils/cacheRequest';
import { mockCellSets1 as cellSets } from '../../test-utils/cellSets.mock';
import { expectStringInVegaCanvas } from '../../test-utils/vega-utils';

jest.mock('localforage');
enableFetchMocks();
jest.mock('../../../components/plots/Header', () => () => <div />);
jest.mock('../../../utils/cacheRequest', () => ({
  fetchCachedWork: jest.fn().mockImplementation((expId, timedOut, body) => {
    if (body.name === 'ListGenes') {
      return new Promise((resolve) => resolve({
        rows: [{ gene_names: 'MockGeneWithHighestDispersion', dispersions: 54.0228 }],
      }));
    }
    if (body.name === 'GeneExpression') {
      return new Promise((resolve) => {
        const requestedExpression = {};
        body.genes.forEach((geneName) => {
          requestedExpression[geneName] = {
            rawExpression: {
              min: 0,
              max: 1.6,
              expression: [0, 0.4, 0.5, 1.6, 0, 1],
            },
            zScore: [1, 1.4, 1.5, 2.6, 2, 2],
          };
        });
        resolve(requestedExpression);
      });
    }
  }),
}));

const defaultStore = {
  cellSets,
  componentConfig: initialComponentConfigStates,
  embeddings: {},
  experimentSettings: {
    ...initialExperimentState,
    backendStatus: {
      status: {
        pipeline: {
          startDate: '2020-01-01T00:00:00',
        },
      },
    },
  },
  genes,
};

const experimentId = 'mockExperimentId';
const plotUuid = 'ViolinMain'; // At some point this will stop being hardcoded

describe('ViolinIndex', () => {
  let store = null;
  let loadConfigSpy = null;
  let generateSpecSpy = null;

  beforeAll(async () => {
    await preloadAll();
  });
  beforeEach(() => {
    jest.clearAllMocks(); // Do not mistake with resetAllMocks()!
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}), { status: 404, statusText: '404 Not Found' });
    loadConfigSpy = jest.spyOn(loadConfig, 'default');
    generateSpecSpy = jest.spyOn(generateViolinSpec, 'generateSpec');
  });

  const renderViolinIndex = async () => {
    store = createStore(rootReducer, _.cloneDeep(defaultStore), applyMiddleware(thunk));
    rtl.render(
      <Provider store={store}>
        <ViolinIndex
          experimentId={experimentId}
        />
      </Provider>,
    );
    await rtl.waitFor(() => expect(loadConfigSpy).toHaveBeenCalledTimes(1));
    await rtl.waitFor(() => expect(fetchCachedWork).toHaveBeenCalledTimes(2));
  };

  it('loads by default the gene with the highest dispersion, allows another to be selected, and updates the plot\'s title', async () => {
    await renderViolinIndex();

    const geneSelection = rtl.screen.getAllByRole('tab')[0];
    expect(geneSelection).toHaveTextContent('Gene Selection');
    const panelContainer = geneSelection.parentElement;

    userEvent.click(geneSelection);
    const geneInput = rtl.getByRole(panelContainer, 'textbox');
    expect(geneInput).toHaveValue('MockGeneWithHighestDispersion');
    expect(store.getState().componentConfig[plotUuid].config.shownGene).toBe('MockGeneWithHighestDispersion');

    const newGeneShown = 'NewGeneShown';
    userEvent.type(geneInput, `{selectall}{del}${newGeneShown}`);
    userEvent.click(rtl.getByRole(panelContainer, 'button'));
    expect(store.getState().componentConfig[plotUuid].config.shownGene).toBe(newGeneShown);

    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));
    await expectStringInVegaCanvas(newGeneShown, 1);
  });

  it('allows selection of the grouping/points, defaulting to louvain and All', async () => {
    await renderViolinIndex();

    const dataSelection = rtl.screen.getAllByRole('tab')[1];
    expect(dataSelection).toHaveTextContent('Select Data');
    const panelContainer = dataSelection.parentElement;

    userEvent.click(dataSelection);

    // Testing Selection is awkard :-(
    // The popup descends from the `body`, not from `panelContainer`
    // The `listbox` element that we need to wait for is not really the popup
    // (and I don't not what it is), but rather a sibling of it
    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[0]);
    const popup1 = rtl.screen.getByRole('listbox').parentNode;
    expect(popup1).toHaveTextContent('Louvain clusters');
    expect(popup1).toHaveTextContent('Samples');
    expect(popup1).toHaveTextContent('Scratchpad');
    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[0]);

    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[1]);
    const popup2 = rtl.screen.getAllByRole('listbox')[1].parentNode;
    expect(popup2).toHaveTextContent('cluster a');
    expect(popup2).toHaveTextContent('Sample 1');
    userEvent.click(rtl.getAllByRole(panelContainer, 'combobox')[1]);

    // Testing the default values
    const inputFields = rtl.getAllByRole(panelContainer, 'combobox');
    expect(inputFields.length).toEqual(2);
    expect(inputFields[0].parentNode.parentNode).toHaveTextContent('Louvain clusters');
    expect(inputFields[1].parentNode.parentNode).toHaveTextContent('All');

    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));
    await expectStringInVegaCanvas('cluster a', 1);

    // Testing the effect of grouping by sample
    store.dispatch(updatePlotConfig(plotUuid, { selectedCellSet: 'sample' }));
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(2));
    await expectStringInVegaCanvas('Sample 1', 1);
  }, 8000);
  it('has a Data Tranformation panel', async () => {
    await renderViolinIndex();

    const tabs = rtl.screen.getAllByRole('tab');
    const dataTransformation = tabs.find((tab) => tab.textContent === 'Data Transformation');
    const panelContainer = dataTransformation.parentElement;
    userEvent.click(dataTransformation);

    // Normalization
    const weAreAbleToGetRawValue = false; // TO-DO
    if (weAreAbleToGetRawValue) {
      await expectStringInVegaCanvas('Normalised Expression', 1);
      const radioButtons = rtl.getAllByRole(panelContainer, 'radio');
      expect(radioButtons[0].parentNode.parentNode).toHaveTextContent('Normalised');
      expect(radioButtons[1].parentNode.parentNode).toHaveTextContent('Raw values');
      userEvent.click(radioButtons[1]);
      await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(2));
      await expectStringInVegaCanvas('Raw Expression', 1);
    }

    // Slider
    const slider = rtl.getByRole(panelContainer, 'slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '1');
    expect(slider).toHaveAttribute('aria-valuenow', '0.3');
  });

  it('has a Markers panel', async () => {
    await renderViolinIndex();

    const tabs = rtl.screen.getAllByRole('tab');
    const markers = tabs.find((tab) => tab.textContent === 'Markers');
    const panelContainer = markers.parentElement;
    userEvent.click(markers);

    const radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(4);
    expect(panelContainer).toHaveTextContent(/cell markers/i);
    expect(radioButtons[0]).toBeChecked();
    // toHaveDisplayValue() currently does not support input[type="radio"]
    expect(radioButtons[0].parentNode.parentNode).toHaveTextContent('Show');

    const slider = rtl.getByRole(panelContainer, 'slider');
    expect(slider).toHaveAttribute('aria-valuemin', '1');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '5');

    expect(panelContainer).toHaveTextContent(/median and interquartile range/i);
    expect(radioButtons[3]).toBeChecked();
    expect(radioButtons[3].parentNode.parentNode).toHaveTextContent('Hide');
  });

  it('has a Lengend panel', async () => {
    await renderViolinIndex();

    const tabs = rtl.screen.getAllByRole('tab');
    const markers = tabs.find((tab) => tab.textContent === 'Legend');
    const panelContainer = markers.parentElement;
    userEvent.click(markers);

    let radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(2);
    expect(panelContainer).toHaveTextContent(/toggle/i);
    expect(radioButtons[1]).toBeChecked();
    // toHaveDisplayValue() currently does not support input[type="radio"]
    expect(radioButtons[1].parentNode.parentNode).toHaveTextContent('Hide');

    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));
    await expectStringInVegaCanvas('cluster a', 1);

    userEvent.click(radioButtons[0]);
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(2));
    radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(5);
    expect(panelContainer).toHaveTextContent(/position/i);
    expect(radioButtons[2]).toBeChecked();
    expect(radioButtons[2].parentNode.parentNode).toHaveTextContent('Top');

    await expectStringInVegaCanvas('cluster a', 2);
  });

  it('allows the gene name to be overriden as the title and clears the override upon new gene selection', async () => {
    await renderViolinIndex();
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));

    let tabs = rtl.screen.getAllByRole('tab');
    const mainSchema = tabs.find((tab) => tab.textContent === 'Main schema');
    userEvent.click(mainSchema);
    tabs = rtl.screen.getAllByRole('tab');
    const titleTab = tabs.find((tab) => tab.textContent === 'Title');
    userEvent.click(titleTab);
    let panelContainer = mainSchema.parentElement;
    const titleInput = rtl.getByRole(panelContainer, 'textbox');
    expect(titleInput).toHaveValue('');
    await expectStringInVegaCanvas('MockGeneWithHighestDispersion', 1);

    const titleOverride = '€'; // Single character so that useUpdateThrottled does not mess with the tests
    generateSpecSpy.mockClear();
    userEvent.type(titleInput, titleOverride);
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalled());
    await expectStringInVegaCanvas('MockGeneWithHighestDispersion', 0);
    await expectStringInVegaCanvas(titleOverride, 1);

    const geneSelection = tabs.find((tab) => tab.textContent === 'Gene Selection');
    panelContainer = geneSelection.parentNode;
    userEvent.click(geneSelection);
    const geneInput = rtl.getByRole(panelContainer, 'textbox');
    const newGeneShown = 'NewGeneShown';
    generateSpecSpy.mockClear();
    userEvent.type(geneInput, `{selectall}{del}${newGeneShown}`);
    userEvent.click(rtl.getByRole(panelContainer, 'button'));
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalled());
    await expectStringInVegaCanvas(newGeneShown, 1);
  });

  it.skip('has an Axis and Margins panel (TO-DO)', async () => {
    await renderViolinIndex();

    const tabs = rtl.screen.getAllByRole('tab');
    const markers = tabs.find((tab) => tab.textContent === 'Axes and Margins');
    const panelContainer = markers.parentElement;
    userEvent.click(markers);

    // TO-DO: review these tests onec the missing violin plot features
    // are implemented and the `.skip` can be removed
    expect(panelContainer).toHaveTextContent(/linear/i);
    expect(panelContainer).toHaveTextContent(/angled/i);

    let radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(2);
    expect(panelContainer).toHaveTextContent(/toggle/i);
    expect(radioButtons[1]).toBeChecked();
    // toHaveDisplayValue() currently does not support input[type="radio"]
    expect(radioButtons[1].parentNode.parentNode).toHaveTextContent('Hide');

    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(1));
    await expectStringInVegaCanvas('cluster a', 1);

    userEvent.click(radioButtons[0]);
    await rtl.waitFor(() => expect(generateSpecSpy).toHaveBeenCalledTimes(2));
    radioButtons = rtl.getAllByRole(panelContainer, 'radio');
    expect(radioButtons.length).toBe(5);
    expect(panelContainer).toHaveTextContent(/position/i);
    expect(radioButtons[2]).toBeChecked();
    expect(radioButtons[2].parentNode.parentNode).toHaveTextContent('Top');

    await expectStringInVegaCanvas('cluster a', 2);
  });
});
