'use strict';

const _ = require('lodash');
const PACKET_LIST = {
    0x4F: 'PublicChat',
    0x12C3: 'FactionChat',
    0x60: 'PrivateChat',
    0xE3: 'ChatRoomSpeak',
    0xFA1: 'TradeStart',
    0xCA: 'AddFriend',
    0xDD: 'ChatRoomInvite',
    0x352: 'BattleGetMap',
    0x226: 'MatrixPasswdArg'
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
        banlist = {};
        storage = {};
    }, 1000 * 60 * 15);

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
            let uniqueIdentifier;
            let storageKey;

            switch (packet.opcode) {
                // PublicChat
                case 0x4F:
                    uniqueIdentifier = packet.payload.offset(2).readInt32BE();
                    storageKey = '0x4F_' + uniqueIdentifier;
                    break;

                // FactionChat
                case 0x12C3:
                    uniqueIdentifier = packet.payload.offset(2).readInt32BE();
                    storageKey = '0x12C3_' + uniqueIdentifier;
                    break;

                // PrivateChat
                case 0x60:
                    let channel = packet.payload.readUInt8();
                    let emotion = packet.payload.readUInt8();
                    let src_name = packet.payload.readPwString();
                    uniqueIdentifier = packet.payload.readInt32BE();
                    let dst_name = packet.payload.readPwString();
                    let dstroleid = packet.payload.readInt32BE();
                    storageKey = '0x60_' + channel + '_' + uniqueIdentifier + '_' + dstroleid;
                    if ('' === src_name) {
                        banlist[uniqueIdentifier] = true;
                    }
                    break;

                // ChatRoomSpeak
                case 0xE3:
                    uniqueIdentifier = packet.payload.offset(3).offset(packet.payload.readCUInt()).readInt32BE();
                    storageKey = '0xE3_' + uniqueIdentifier;
                    break;

                // TradeStart
                case 0xFA1:
                    uniqueIdentifier = packet.payload.readInt32BE();
                    storageKey = '0xFA1_' + uniqueIdentifier;
                    break;

                // AddFriend
                case 0xCA:
                    uniqueIdentifier = packet.payload.readInt32BE();
                    storageKey = '0xCA_' + uniqueIdentifier;
                    break;

                // ChatRoomInvite
                case 0xDD:
                    uniqueIdentifier = packet.payload.offset(6).readInt32BE();
                    storageKey = '0xDD_' + uniqueIdentifier;
                    break;

                // BattleGetMap
                case 0x352:
                    uniqueIdentifier = packet.payload.readInt32BE();
                    storageKey = '0x352_' + uniqueIdentifier;
                    break;

                // MatrixPasswdArg
                case 0x226:
                    packet.payload.offset(4); // localsid
                    packet.payload.offset(packet.payload.readCUInt()); // account
                    packet.payload.offset(packet.payload.readCUInt()); // challenge
                    uniqueIdentifier = [
                        packet.payload.readUInt8(),
                        packet.payload.readUInt8(),
                        packet.payload.readUInt8(),
                        packet.payload.readUInt8()
                    ].reverse().join('.');
                    storageKey = '0x226_' + uniqueIdentifier;
                    break;

                // Other
                default:
                    return next();
            }

            packet.payload.setPointer(0);

            if (options.whitelist.indexOf(uniqueIdentifier) > -1) {
                return next();
            }

            if (banlist[uniqueIdentifier]) {
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
                    console.log('Name:', PACKET_LIST[packet.opcode]);
                    console.log('Storage key:', storageKey);
                    console.log('Ban unique identifier:', uniqueIdentifier);
                    banlist[uniqueIdentifier] = true;
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
