'use strict';

const _ = require('lodash');

/**
 * @param {Object} options
 * @return {{only: undefined, except: undefined, handler: handler}}
 */
module.exports = function (options) {
    options = _.merge({
        // 'limit' or 'drop'
        mode: 'limit',
        limitModeOptions: {
            frequency: 10
        }
    }, options || {});

    let counters = {};
    let banlist = {};

    setInterval(function () {
        counters = {};
    }, 1000);

    return {
        /**
         * @type {Array}
         */
        only: [0xD9],

        /**
         * @type {Array}
         */
        except: undefined,

        /**
         * @param {Object} packet
         * @param {Socket} input
         * @param {Socket} output
         * @param {Function} next
         */
        handler: function (packet, input, output, next) {
            switch (options.mode) {
                case 'drop':
                    next(1);
                    break;
                case 'limit':
                    let roleid = packet.payload.readInt32BE();

                    if (banlist[roleid]) {
                        return next(1);
                    }

                    if (counters[roleid] > options.limitModeOptions.frequency) {
                        banlist[roleid] = true;
                        return next(1);
                    }

                    if (counters[roleid]) {
                        ++counters[roleid];
                    } else {
                        counters[roleid] = 1;
                    }

                    next();
                    break;
                default:
                    next();
            }
        }
    };
};
