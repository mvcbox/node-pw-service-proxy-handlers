'use strict';

/**
 * @return {{only: undefined, except: undefined, handler: handler}}
 */
module.exports = function () {
    return {
        /**
         * @type {Array}
         */
        only: [0x54],

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
            packet.payload.setPointer(0).offset(12);
            let gender = packet.payload.readUInt8();
            packet.payload.offset(1);
            let occupation = packet.payload.readUInt8();
            packet.payload.setPointer(0);

            if (4 === occupation && 0 !== gender || 3 === occupation && 1 !== gender) {
                next(1);
            } else {
                next();
            }
        }
    };
};
