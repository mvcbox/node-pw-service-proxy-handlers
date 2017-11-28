'use strict';

module.exports = function (options) {
    options = Object.assign({}, {
        count: 3,
        time: 1000
    }, options || {});

    let banlist = {};
    let storage = {};

    setInterval(function () {
        storage = {};
    }, 1000 * 60 * 60);

    return {
        /**
         * @type {Array}
         */
        only: [0x4F, 0x12C3, 0x60, 0xE3],

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
            let roleid;

            if (0x4F === packet.opcode || 0x12C3 === packet.opcode) {
                roleid = packet.payload.offset(2).readInt32BE();
            } else if (0x60 === packet.opcode) {
                roleid = packet.payload.offset(2).offset(packet.payload.readCUInt()).readInt32BE();
            } else if (0xE3 === packet.opcode) {
                roleid = packet.payload.offset(3).offset(packet.payload.readCUInt()).readInt32BE();
            } else {
                packet.payload.setPointer(0);
                return next();
            }

            packet.payload.setPointer(0);

            if (banlist[roleid]) {
                return next(1);
            }

            if (!storage[roleid]) {
                storage[roleid] = {
                    tstamp: Date.now(),
                    count: 1
                };

                return next();
            }

            if (++storage[roleid].count > options.count) {
                if (Date.now() - storage[roleid].tstamp < options.time) {
                    console.info("\n[" + new Date().toLocaleString() + ']: ======= OOG Chat Flood =======');
                    console.log('Ban roleid:', roleid);
                    banlist[roleid] = true;
                    return next(1);
                }

                storage[roleid] = {
                    tstamp: Date.now(),
                    count: 1
                };
            }

            next();
        }
    };
};
