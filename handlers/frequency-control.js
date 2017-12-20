'use strict';

const _ = require('lodash');
const PACKET_LIST = {
    0x4F: 'PublicChat',
    0x12C3: 'FactionChat',
    0x60: 'PrivateChat',
    0xE3: 'ChatRoomSpeak',
    0xFA1: 'TradeStart',
    0xCA: 'AddFriend',
    0xDD: 'ChatRoomInvite'
};

module.exports = function (options) {
    options = Object.assign({}, {
        frequency: {},
        defaultFrequency: {
            count: 5,
            time: 1000
        },
        whitelist: []
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
        only: _.chain(PACKET_LIST).keys().map(Number).value(),

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
            let frequency = options.frequency[packet.opcode] || options.defaultFrequency;
            let roleid;
            let storageKey;

            switch (packet.opcode) {
                // PublicChat
                case 0x4F:
                    roleid = packet.payload.offset(2).readInt32BE();
                    storageKey = '0x4F_' + roleid;
                    break;

                // FactionChat
                case 0x12C3:
                    roleid = packet.payload.offset(2).readInt32BE();
                    storageKey = '0x12C3_' + roleid;
                    break;

                // PrivateChat
                case 0x60:
                    let channel = packet.payload.readUInt8();
                    let emotion = packet.payload.readUInt8();
                    let src_name = packet.payload.readPwString();
                    roleid = packet.payload.readInt32BE();
                    let dst_name = packet.payload.readPwString();
                    let dstroleid = packet.payload.readInt32BE();
                    storageKey = '0x60_' + channel + '_' + roleid + '_' + dstroleid;
                    if ('' === src_name) {
                        banlist[roleid] = true;
                    }
                    break;

                // ChatRoomSpeak
                case 0xE3:
                    roleid = packet.payload.offset(3).offset(packet.payload.readCUInt()).readInt32BE();
                    storageKey = '0xE3_' + roleid;
                    break;

                // TradeStart
                case 0xFA1:
                    roleid = packet.payload.readInt32BE();
                    storageKey = '0xFA1_' + roleid;
                    break;

                // AddFriend
                case 0xCA:
                    roleid = packet.payload.readInt32BE();
                    storageKey = '0xCA_' + roleid;
                    break;

                case 0xDD:
                    roleid = packet.payload.offset(6).readInt32BE();
                    storageKey = '0xDD_' + roleid;
                    break;

                // Other
                default:
                    packet.payload.setPointer(0);
                    return next();
            }

            packet.payload.setPointer(0);

            if (options.whitelist.indexOf(roleid) > -1) {
                return next();
            }

            if (banlist[roleid]) {
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
                    console.log("\n[" + new Date().toLocaleString() + ']: ============ Frequency control ============');
                    console.log('Opcode:', '0x' + packet.opcode.toString(16).toUpperCase());
                    console.log('Storage key:', storageKey);
                    console.log('Ban roleid:', roleid);
                    banlist[roleid] = true;
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
