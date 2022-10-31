import moment from 'moment';

class Chronometer {
  static chronometers = {};

  /**
   *
   * @param {*} key Key of the chronometer to get
   * @returns
   */
  static get(key) {
    return this.chronometers[key];
  }

  /**
   *
   * @param {*} key Optional. If set, it will make this chronometer
   * accessible through Chronometer.get(key)
   */
  constructor(key = undefined) {
    if (key) {
      this.key = key;

      Chronometer.chronometers[key] = this;
    }
  }

  start() {
    this.startTime = moment();
  }

  stop() {
    return moment.duration(moment().diff(this.startDate));
  }
}

export default Chronometer;
