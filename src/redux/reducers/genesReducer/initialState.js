/**
 * The store has the following format:
 * {
 *    genes: {
 *      properties: {
 *        loading: [],
 *        error: false,
 *        data {
  *        TGFB1: {
 *            id: "ENS013131313",
 *            dispersion: 0.2
 *         }
 *        },
 *        views: {
 *          gene-view-props: {
 *            fetching: false,
 *            error: false,
 *            data: ['TGFB1', 'FOXP2', 'MYC'],
 *            total: 20
 *          }
 *        }
 *      }
 *      expression: {
 *        data: {
 *          TGFB1: {
 *            min: 0.0,
 *            max: 7.0,
 *            data: [3.4, 2.2, 1.1]
 *          }
 *        },
 *        error: false,
 *        loading: [],
 *      },
 *      selected: [],
 *      focused: "MYC"
 *    }
 * }
 */

const initialViewState = {
  fetching: false,
  error: false,
  data: [],
};

const initialExpressionState = {
  min: 0,
  max: 0,
  data: [],
};

const initialState = {
  properties: {
    loading: [],
    views: {},
    data: {},
  },
  expression: {
    loading: [],
    error: false,
    data: {},
  },
  selected: [],
  focused: undefined,
};

export { initialViewState, initialExpressionState };
export default initialState;
