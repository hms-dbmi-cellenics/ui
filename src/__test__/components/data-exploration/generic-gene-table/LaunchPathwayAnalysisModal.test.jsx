import React from 'react';
import userEvent from '@testing-library/user-event';
import LaunchPathwayAnalysisModal from 'components/data-exploration/differential-expression-tool/LaunchPathwayAnalysisModal';

import {
  render, screen, waitFor,
} from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { makeStore } from 'redux/store';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import handleError from 'utils/http/handleError';
import downloadFromUrl from 'utils/downloadFromUrl';
import writeToFile from 'utils/writeToFileURL';

import launchPathwayService from 'utils/pathwayAnalysis/launchPathwayService';
import getDiffExprGenes from 'utils/extraActionCreators/differentialExpression/getDiffExprGenes';
import getBackgroundExpressedGenes from 'utils/extraActionCreators/differentialExpression/getBackgroundExpressedGenes';
import { pathwayServices } from 'utils/pathwayAnalysis/pathwayConstants';
import enrichrSpecies from 'utils/pathwayAnalysis/enrichrConstants';
import endUserMessages from 'utils/endUserMessages';

jest.mock('utils/pathwayAnalysis/launchPathwayService');
jest.mock('utils/extraActionCreators/differentialExpression/getDiffExprGenes');
jest.mock('utils/extraActionCreators/differentialExpression/getBackgroundExpressedGenes');

jest.mock('utils/http/handleError');
jest.mock('utils/downloadFromUrl');
jest.mock('utils/writeToFileURL');

const onCancel = jest.fn();
const onOpenAdvancedFilters = jest.fn();
const mockClipboard = jest.fn();

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockClipboard,
  },
});

enableFetchMocks();

const pantherDBResponse = {
  search: {
    output: {
      genomes: {
        genome: [
          {
            name: 'human',
            taxon_id: 9606,
            short_name: 'HUMAN',
            version: 'Reference Proteome 2020_04',
            long_name: 'Homo sapiens',
          },
          {
            name: 'mouse',
            taxon_id: 10090,
            short_name: 'MOUSE',
            version: 'Reference Proteome 2020_04',
            long_name: 'Mus musculus',
          },
          {
            name: 'rat',
            taxon_id: 10116,
            short_name: 'RAT',
            version: 'Reference Proteome 2020_04',
            long_name: 'Rattus norvegicus',
          }],
      },
    },
  },
};

const renderPathwayAnalysisModal = async (store, filtersApplied = false) => {
  await act(async () => {
    render(
      <Provider store={store}>
        <LaunchPathwayAnalysisModal
          advancedFiltersAdded={filtersApplied}
          onCancel={onCancel}
          onOpenAdvancedFilters={onOpenAdvancedFilters}
        />
      </Provider>,
    );
  });
};

const genesList = ['gene1', 'gene2'];
getDiffExprGenes.mockImplementation(() => async () => Promise.resolve(genesList));
getBackgroundExpressedGenes.mockImplementation(() => async () => Promise.resolve(genesList));

let store = null;

describe('Pathway analysis modal ', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    store = makeStore();
    fetchMock.resetMocks();
    fetchMock.doMock(JSON.stringify(pantherDBResponse));
  });

  it('Renders properly', async () => {
    await renderPathwayAnalysisModal(store);
    expect(screen.getByText('You have not performed any filtering on the genes!')).toBeInTheDocument();

    Object.values(pathwayServices).forEach((serviceName) => {
      expect(screen.getByLabelText(serviceName)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(pathwayServices.ENRICHR).checked).toEqual(true);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    const closeButton = screen.getAllByLabelText('close')[0];
    closeButton.click();
    expect(onCancel).toHaveBeenCalled();
  });

  it('Clicking enrichr radio button removes suggestion text', async () => {
    await renderPathwayAnalysisModal(store);
    const enrichrRadioButton = screen.getByLabelText(pathwayServices.ENRICHR);
    userEvent.click(enrichrRadioButton);
    await waitFor(() => (
      expect(screen.queryByText('It is strongly recommended to input', { exact: false })).not.toBeInTheDocument()
    ));
  });

  it('Clicking advanced filtering modal opens the modal', async () => {
    await renderPathwayAnalysisModal(store);
    userEvent.click(screen.getByText('Click here to open the advanced filtering options.'));

    expect(onOpenAdvancedFilters).toHaveBeenCalledTimes(1);
  });

  it('Launches the service with PantherDB', async () => {
    await renderPathwayAnalysisModal(store);

    // Choose enrichr and launch the analysis
    userEvent.click(screen.getByText(pathwayServices.PANTHERDB));

    const defaultSpecies = 'HUMAN';

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.PANTHERDB,
      genesList,
      defaultSpecies,
    );
  });

  it('Launches the service with enrichr', async () => {
    await renderPathwayAnalysisModal(store);

    const defaultSpecies = 'sapiens';

    // Choose enrichr and launch the analysis
    userEvent.click(screen.getByText(pathwayServices.ENRICHR));

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.ENRICHR,
      genesList,
      defaultSpecies,
    );
  });

  it('Passes the species key correctly', async () => {
    await renderPathwayAnalysisModal(store);

    const secondSpecies = enrichrSpecies[enrichrSpecies.length - 1];

    // Choose enrichr
    userEvent.click(screen.getByText(pathwayServices.ENRICHR));

    await act(async () => {
      userEvent.click(screen.getByRole('combobox'));
    });

    // Choose another species
    const speciesOption = screen.getAllByText(secondSpecies.label)[0];
    await act(async () => {
      userEvent.click(speciesOption, undefined, { skipPointerEventsCheck: true });
    });

    // After all is ready, launch
    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(true, 0);

    expect(launchPathwayService).toHaveBeenCalledTimes(1);
    expect(launchPathwayService).toHaveBeenCalledWith(
      pathwayServices.ENRICHR,
      genesList,
      secondSpecies.value,
    );
  });

  it('Passes the number of genes correctly', async () => {
    await renderPathwayAnalysisModal(store);

    const numGenes = 5;

    // Input to use number of genes
    userEvent.click(screen.getByText('Top'));

    await act(async () => {
      userEvent.type(screen.getByRole('spinbutton'), `{backspace}${numGenes}`);
    });

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    // The first option to getDiffExpr is useAllGenes, which is true by default
    expect(getDiffExprGenes).toHaveBeenCalledTimes(1);
    expect(getDiffExprGenes).toHaveBeenCalledWith(false, numGenes);
  });

  it('Apply filters warning message is not there if there are filters', async () => {
    await renderPathwayAnalysisModal(store, true);
    expect(screen.queryByText('You have not performed any filtering on the genes!', { exact: false })).not.toBeInTheDocument();
  });

  it('Shows an error if analysis can not be launched', async () => {
    const e = new Error();
    launchPathwayService.mockImplementation(() => { throw e; });

    await renderPathwayAnalysisModal(store);

    await act(async () => {
      userEvent.click(screen.getByText('Launch'));
    });

    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError).toHaveBeenCalledWith(e, endUserMessages.ERROR_LAUNCH_PATHWAY);
  });

  it('Clicking on download link downloads the gene list', async () => {
    await renderPathwayAnalysisModal(store);

    userEvent.click(screen.getByText(pathwayServices.PANTHERDB));

    await act(async () => {
      userEvent.click(screen.getByText(/download the reference genes/i));
    });

    expect(getBackgroundExpressedGenes).toHaveBeenCalledTimes(1);
    expect(writeToFile).toHaveBeenCalledTimes(1);

    expect(writeToFile).toHaveBeenCalledWith(genesList.join('\n'));

    expect(downloadFromUrl).toHaveBeenCalledTimes(1);

    // Clicking on the download link again should not cause another work request
    expect(getBackgroundExpressedGenes).toHaveBeenCalledTimes(1);
  });

  it('It shows an error if getting background expressed genes fail', async () => {
    const e = new Error();
    getBackgroundExpressedGenes.mockImplementation(() => { throw e; });

    await renderPathwayAnalysisModal(store);

    userEvent.click(screen.getByText(pathwayServices.PANTHERDB));

    await act(async () => {
      userEvent.click(screen.getByText(/download the reference genes/i));
    });

    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError).toHaveBeenCalledWith(e, endUserMessages.ERROR_FETCH_BACKGROUND_GENE_EXP);
  });
});
