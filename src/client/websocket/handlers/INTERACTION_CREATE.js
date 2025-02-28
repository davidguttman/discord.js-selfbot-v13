'use strict';
const { Events } = require('../../../util/Constants');

/**
 * @typedef {Object} InteractionResponseBody
 * @property {Snowflake} id maybe id of this event (???) (documentation needed)
 * @property {Snowflake} nonce nonce in POST /interactions
 */

module.exports = (client, packet) => {
  if (client.user.bot) client.actions.InteractionCreate.handle(packet.d);
  /**
   * Emitted whenever client user send interaction
   * @event Client#interactionSuccess
   * @param {InteractionResponseBody} data InteractionResponseBody
   */ else client.emit(Events.INTERACTION_CREATE, packet.d);
};
