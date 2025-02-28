'use strict';

const { Collection } = require('@discordjs/collection');
const Invite = require('./Invite');
const User = require('./User');
const { Util } = require('..');
const { HypeSquadOptions, Opcodes, NitroState } = require('../util/Constants');
const DataResolver = require('../util/DataResolver');
/**
 * Represents the logged in client's Discord user.
 * @extends {User}
 */
class ClientUser extends User {
  _patch(data) {
    super._patch(data);

    if ('verified' in data) {
      /**
       * Whether or not this account has been verified
       * @type {boolean}
       */
      this.verified = data.verified;
    }

    if ('mfa_enabled' in data) {
      /**
       * If the bot's {@link ClientApplication#owner Owner} has MFA enabled on their account
       * @type {?boolean}
       */
      this.mfaEnabled = typeof data.mfa_enabled === 'boolean' ? data.mfa_enabled : null;
    } else {
      this.mfaEnabled ??= null;
    }

    if ('token' in data) this.client.token = data.token;

    // Add (Selfbot)
    if ('purchased_flags' in data) this.nitro = NitroState[data.purchased_flags] ?? 'NONE';
    // Key: premium = boolean;
    /**
     * Nitro state of the client user.
     * @type {NitroState}
     * @see https://discord.com/developers/docs/resources/user#user-object-premium-types
     */
    if ('phone' in data) this.phoneNumber = data.phone;
    /**
     * Phone number of the client user.
     * @type {?string}
     */
    if ('nsfw_allowed' in data) this.nsfwAllowed = data.nsfw_allowed;
    /**
     * Whether or not the client user is allowed to send NSFW messages [iOS device].
     * @type {?boolean}
     */
    if ('email' in data) this.emailAddress = data.email;
    /**
     * Email address of the client user.
     * @type {?string}
     */
  }

  /**
   * Patch note
   * @param {Object} data Note data
   * @private
   */
  _patchNote(data) {
    /**
     * The notes cache of the client user.
     * @type {Collection<Snowflake, string>}
     * @private
     */
    this.notes = data ? new Collection(Object.entries(data)) : new Collection();
  }

  /**
   * Represents the client user's presence
   * @type {ClientPresence}
   * @readonly
   */
  get presence() {
    return this.client.presence;
  }

  /**
   * Data used to edit the logged in client
   * @typedef {Object} ClientUserEditData
   * @property {string} [username] The new username
   * @property {?(BufferResolvable|Base64Resolvable)} [avatar] The new avatar
   */

  /**
   * Edits the logged in client.
   * @param {ClientUserEditData} data The new data
   * @returns {Promise<ClientUser>}
   */
  async edit(data) {
    if (typeof data.avatar !== 'undefined') {
      data.avatar = await DataResolver.resolveImage(data.avatar);
    }
    if (typeof data.banner !== 'undefined') {
      data.banner = await DataResolver.resolveImage(data.banner);
    }
    const newData = await this.client.api.users('@me').patch({ data });
    this.client.token = newData.token;
    this.client.password = data?.password ? data?.password : this.client.password;
    const { updated } = this.client.actions.UserUpdate.handle(newData);
    return updated ?? this;
  }

  /**
   * Sets the username of the logged in client.
   * <info>Changing usernames in Discord is heavily rate limited, with only 2 requests
   * every hour. Use this sparingly!</info>
   * @param {string} username The new username
   * @param {string} password The password of the account
   * @returns {Promise<ClientUser>}
   * @example
   * // Set username
   * client.user.setUsername('discordjs')
   *   .then(user => console.log(`My new username is ${user.username}`))
   *   .catch(console.error);
   */
  setUsername(username, password) {
    if (!password && !this.client.password) {
      throw new Error('A password is required to change a username.');
    }
    return this.edit({
      username,
      password: this.client.password ? this.client.password : password,
    });
  }

  /**
   * Sets the avatar of the logged in client.
   * @param {?(BufferResolvable|Base64Resolvable)} avatar The new avatar
   * @returns {Promise<ClientUser>}
   * @example
   * // Set avatar
   * client.user.setAvatar('./avatar.png')
   *   .then(user => console.log(`New avatar set!`))
   *   .catch(console.error);
   */
  setAvatar(avatar) {
    return this.edit({ avatar });
  }
  /**
   * Sets the banner of the logged in client.
   * @param {?(BufferResolvable|Base64Resolvable)} banner The new banner
   * @returns {Promise<ClientUser>}
   * @example
   * // Set banner
   * client.user.setBanner('./banner.png')
   *   .then(user => console.log(`New banner set!`))
   *   .catch(console.error);
   */
  setBanner(banner) {
    if (this.nitroType !== 2) {
      throw new Error('You must be a Nitro Boosted User to change your banner.');
    }
    return this.edit({ banner });
  }

  /**
   * Set HyperSquad House
   * @param {HypeSquadOptions<number|string>} type
   * * `LEAVE`: 0
   * * `HOUSE_BRAVERY`: 1
   * * `HOUSE_BRILLIANCE`: 2
   * * `HOUSE_BALANCE`: 3
   * @returns {Promise<void>}
   * @example
   * // Set HyperSquad HOUSE_BRAVERY
   * client.user.setHypeSquad(1); || client.user.setHypeSquad('HOUSE_BRAVERY');
   * // Leave
   * client.user.setHypeSquad(0);
   */
  async setHypeSquad(type) {
    const id = typeof type === 'string' ? HypeSquadOptions[type] : type;
    if (!id && id !== 0) throw new Error('Invalid HypeSquad type.');
    if (id !== 0) {
      const data = await this.client.api.hypesquad.online.post({
        data: { house_id: id },
      });
      return data;
    } else {
      const data = await this.client.api.hypesquad.online.delete();
      return data;
    }
  }

  /**
   * Set Accent color
   * @param {ColorResolvable} color Color to set
   * @returns {Promise}
   */
  setAccentColor(color = null) {
    return this.edit({ accent_color: color ? Util.resolveColor(color) : null });
  }

  /**
   * Set discriminator
   * @param {User.discriminator} discriminator It is #1234
   * @param {string} password The password of the account
   * @returns {Promise}
   */
  setDiscriminator(discriminator, password) {
    if (!this.nitro) throw new Error('You must be a Nitro User to change your discriminator.');
    if (!password && !this.client.password) {
      throw new Error('A password is required to change a discriminator.');
    }
    return this.edit({
      discriminator,
      password: this.client.password ? this.client.password : password,
    });
  }

  /**
   * Set About me
   * @param {string} bio Bio to set
   * @returns {Promise}
   */
  setAboutMe(bio = null) {
    return this.edit({
      bio,
    });
  }

  /**
   * Change the email
   * @param {Email<string>} email Email to change
   * @param {string} password Password of the account
   * @returns {Promise}
   */
  setEmail(email, password) {
    if (!password && !this.client.password) {
      throw new Error('A password is required to change a email.');
    }
    return this.edit({
      email,
      password: this.client.password ? this.client.password : password,
    });
  }

  /**
   * Set new password
   * @param {string} oldPassword Old password
   * @param {string} newPassword New password to set
   * @returns {Promise}
   */
  setPassword(oldPassword, newPassword) {
    if (!oldPassword && !this.client.password) {
      throw new Error('A password is required to change a password.');
    }
    if (!newPassword) throw new Error('New password is required.');
    return this.edit({
      password: this.client.password ? this.client.password : oldPassword,
      new_password: newPassword,
    });
  }

  /**
   * Disable account
   * @param {string} password Password of the account
   * @returns {Promise}
   */
  async disableAccount(password) {
    if (!password && !this.client.password) {
      throw new Error('A password is required to disable an account.');
    }
    const data = await this.client.api.users['@me'].disable.post({
      data: {
        password: this.client.password ? this.client.password : password,
      },
    });
    return data;
  }

  /**
   * Set selfdeaf (Global)
   * @param {boolean} status Whether or not the ClientUser is deafened
   * @returns {boolean}
   */
  setDeaf(status) {
    if (typeof status !== 'boolean') throw new Error('Deaf status must be a boolean.');
    this.client.ws.broadcast({
      op: Opcodes.VOICE_STATE_UPDATE,
      d: { self_deaf: status },
    });
    return status;
  }

  /**
   * Set selfmute (Global)
   * @param {boolean} status Whether or not the ClientUser is muted
   * @returns {boolean}
   */
  setMute(status) {
    if (typeof status !== 'boolean') throw new Error('Mute status must be a boolean.');
    this.client.ws.broadcast({
      op: Opcodes.VOICE_STATE_UPDATE,
      d: { self_mute: status },
    });
    return status;
  }

  /**
   * Delete account. Warning: Cannot be changed once used!
   * @param {string} password Password of the account
   * @returns {Promise}
   */
  async deleteAccount(password) {
    if (!password && !this.client.password) {
      throw new Error('A password is required to delete an account.');
    }
    const data = await this.client.api.users['@me'].delete.post({
      data: {
        password: this.client.password ? this.client.password : password,
      },
    });
    return data;
  }

  /**
   * Options for setting activities
   * @typedef {Object} ActivitiesOptions
   * @property {string} [name] Name of the activity
   * @property {ActivityType|number} [type] Type of the activity
   * @property {string} [url] Twitch / YouTube stream URL
   */

  /**
   * Data resembling a raw Discord presence.
   * @typedef {Object} PresenceData
   * @property {PresenceStatusData} [status] Status of the user
   * @property {boolean} [afk] Whether the user is AFK
   * @property {ActivitiesOptions[]} [activities] Activity the user is playing
   * @property {number|number[]} [shardId] Shard id(s) to have the activity set on
   */

  /**
   * Sets the full presence of the client user.
   * @param {PresenceData} data Data for the presence
   * @returns {ClientPresence}
   * @example
   * // Set the client user's presence
   * client.user.setPresence({ activities: [{ name: 'with discord.js' }], status: 'idle' });
   */
  setPresence(data) {
    return this.client.presence.set(data);
  }

  /**
   * A user's status. Must be one of:
   * * `online`
   * * `idle`
   * * `invisible`
   * * `dnd` (do not disturb)
   * @typedef {string} PresenceStatusData
   */

  /**
   * Sets the status of the client user.
   * @param {PresenceStatusData} status Status to change to
   * @param {number|number[]} [shardId] Shard id(s) to have the activity set on
   * @returns {ClientPresence}
   * @example
   * // Set the client user's status
   * client.user.setStatus('idle');
   */
  setStatus(status, shardId) {
    return this.setPresence({ status, shardId });
  }

  /**
   * Options for setting an activity.
   * @typedef {Object} ActivityOptions
   * @property {string} [name] Name of the activity
   * @property {string} [url] Twitch / YouTube stream URL
   * @property {ActivityType|number} [type] Type of the activity
   * @property {number|number[]} [shardId] Shard Id(s) to have the activity set on
   */

  /**
   * Sets the activity the client user is playing.
   * @param {string|ActivityOptions} [name] Activity being played, or options for setting the activity
   * @param {ActivityOptions} [options] Options for setting the activity
   * @returns {ClientPresence}
   * @example
   * // Set the client user's activity
   * client.user.setActivity('discord.js', { type: 'WATCHING' });
   */
  setActivity(name, options = {}) {
    if (!name) {
      return this.setPresence({ activities: [], shardId: options.shardId });
    }

    const activity = Object.assign({}, options, typeof name === 'object' ? name : { name });
    return this.setPresence({
      activities: [activity],
      shardId: activity.shardId,
    });
  }

  /**
   * Sets/removes the AFK flag for the client user.
   * @param {boolean} [afk=true] Whether or not the user is AFK
   * @param {number|number[]} [shardId] Shard Id(s) to have the AFK flag set on
   * @returns {ClientPresence}
   */
  setAFK(afk = true, shardId) {
    return this.setPresence({ afk, shardId });
  }

  /**
   * Create an invite [Friend Invites]
   * @param {CreateInviteOptions} [options={}] The options for creating the invite [maxAge and maxUses are available]
   * @returns {Promise<Invite>}
   * @see https://github.com/13-05/hidden-disc-docs#js-snippet-for-creating-friend-invites
   * @example
   * // Create an invite to a selected channel
   * client.user.getInvite({ maxAge: 0, maxUses: 0 });
   *   .then(console.log)
   *   .catch(console.error);
   */
  async getInvite({ maxAge = 86400, maxUses = 0 } = {}) {
    const data = await this.client.api.users['@me'].invites.post({
      data: {
        validate: null,
        max_age: maxAge,
        max_uses: maxUses,
        target_type: 2,
        temporary: false,
      },
    });
    return new Invite(this.client, data);
  }
}

module.exports = ClientUser;
