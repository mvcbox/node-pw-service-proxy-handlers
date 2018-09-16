'use strict';

/**
 * @param {Object} options
 * @returns {{only: number[], except: undefined, handler: handler}}
 */
module.exports = function (options) {
    console.log('============= Frequency control unknown - init =============');

    options = Object.assign({
        time: 1000, //ms
        count: 50,
        bantime: 600000,
    }, options || {});

    let counter = {};
    let banlist = {};
    let resetInterval = 0;

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
            let interval = Date.now() / options.time;

            if (interval - resetInterval > 1) {
                resetInterval = interval;
                counter = {};
            }

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
