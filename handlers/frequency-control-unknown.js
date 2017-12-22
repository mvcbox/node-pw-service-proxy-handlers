'use strict';

module.exports = function (options) {
    options = Object.assign({}, {
        defaultFrequency: {
            count: 25,
            time: 1000
        }
    }, options || {});

    let banlist = {};
    let storage = {};

    setInterval(function () {
        storage = {};
    }, 60000);

    return {
        /**
         * @type {Array}
         */
        only: undefined,

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
            packet.payload.setPointer(0);
            let frequency = options.defaultFrequency;
            let storageKey = packet.opcode + '_' + packet.payload.toString('hex');

            packet.payload.setPointer(0);

            if (banlist[storageKey]) {
                return next(1);
            }

            if (!storage[storageKey]) {
                storage[storageKey] = {
                    tstamp: Date.now(),
                    count: 1
                };

                return next();
            }

            if (++storage[storageKey].count > frequency.count) {
                if (Date.now() - storage[storageKey].tstamp < frequency.time) {
                    console.log("\n[" + new Date().toLocaleString() + ']: ============ Frequency control unknown ============');
                    console.log('Opcode:', '0x' + packet.opcode.toString(16).toUpperCase());
                    console.log('Content:', storageKey);
                    banlist[storageKey] = true;
                    return next(1);
                }

                storage[storageKey] = {
                    tstamp: Date.now(),
                    count: 1
                };
            }

            next();
        }
    };
};
