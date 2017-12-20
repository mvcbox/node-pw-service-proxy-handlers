'use strict';

module.exports = {
    consolePacketLogger: require('./handlers/console-packet-logger'),
    validatePacketGetSavedMsg: require('./handlers/validate-packet-get-saved-msg'),
    validatePacketCreateRole: require('./handlers/validate-packet-create-role'),
    validateChat: require('./handlers/validate-chat'),
    frequencyControl: require('./handlers/frequency-control')
};
