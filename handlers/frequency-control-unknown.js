'use strict';

/**
 * @param {Object} options
 * @returns {{only: number[], except: undefined, handler: handler}}
 */
module.exports = function (options) {
    console.log('============= Frequency control unknown - init =============');

    options = Object.assign({
        time: 3000, //ms
        count: 50,
        bantime: 600000,
    }, options || {});

    let counter = {};
    let banlist = {};

    setInterval(function () {
        counter = {};
    }, options.time);

    return {
        /**
         *
         */
        only: undefined,

        /**
         *
         */
        except: [0x4B, 0x82],

        /**
         * @param {Object} packet
         * @param {Socket} input
         * @param {Socket} output
         * @param {Function} next
         */
        handler: function (packet, input, output, next) {
            packet.payload.setPointer(0);
            let roleIdentifier = packet.opcode + '_' + packet.payload.toString('hex');

            if (banlist[roleIdentifier]) {
                return next(1);
            }

            if (!counter[roleIdentifier]) {
                counter[roleIdentifier] = 1;
                return next();
            }

            if (++counter[roleIdentifier] > options.count) {
                console.log('=========================================================================');
                console.log(`[${new Date().toLocaleString()}]: Frequency control unknown - block`);
                console.log('RoleIdentifier:', roleIdentifier);
                console.log('Packet opcode:', '0x' + packet.opcode.toString(16).toUpperCase());
                console.log('=========================================================================');
                banlist[roleIdentifier] = true;
                setTimeout(function () {
                    delete banlist[roleIdentifier];
                }, options.bantime);
                return next(1);
            }

            next();
        }
    };
};


module.exports = function (options) {
    options = Object.assign({}, {
        defaultFrequency: {
            count: 50,
            time: 5000
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
        except: [0x4B],

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
