# Quick Links:
- [Interaction](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Message.md#interaction)
- [Embed](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/Message.md#messageembed-)
- [Slash command demo](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/SlashCommand.md)

## Interaction
<details open>
<summary>Fetch Commands data</summary>

```js
/* Save to cache */
// In guild (Opcode 24)
const res = await guild.searchInteraction(
	{
		limit: 100, // default: 1
		query: 'ping', // optional
		type: 'CHAT_INPUT', // default: 'CHAT_INPUT'
		offset: 0, // default: 0
		botId: 'botid1'
	}
);
// With `type` && `BotId`: Return ApplicationCommand; else return undefined
// Fetch all commands (1 bot) Shouldn't be used
await bot.applications.fetch(
	{
		guildId: 'guild id to search', // optional
		force: false, // Using cache or createDMs to bot
	}
);
```
</details>
<details open>
<summary>Button Click</summary>

```js
await Button.click(Message);
//
await message.clickButton(buttonID);
```
</details>
<details open>
<summary>Message Select Menu</summary>

```js
await MessageSelectMenu.select(Message, options); // (v1)
// value: ['value1', 'value2' , ...]
await message.selectMenu(menuID, options) // If message has >= 2 menu
await message.selectMenu(options) // If message has 1 menu
```
</details>
<details open>
<summary>Slash Command</summary>

<strong>[Demo](https://github.com/aiko-chan-ai/discord.js-selfbot-v13/blob/main/Document/SlashCommand.md)</strong>

```js
// v2
await Channel.sendSlash(botID, commandName, 'option1', 123, true, new MessageAttachment(buffer, 'test.png'));
// Eg /addrole roleID: 12345678987654321 userID: 98765432123456789
// => await Channel.sendSlash(botID, 'addrole', ['12345678987654321', '98765432123456789']);
// Command group
await Channel.sendSlash(botID, commandName, 'sub command', 'option1', 'option2');
// Eg: /role add roleID: 12345678987654321 userID: 98765432123456789
// => await Channel.sendSlash(botID, 'role', ['add', '12345678987654321', '98765432123456789']);
```
</details>
<details open>
<summary>Message Context Command</summary>

```js
await message.contextMenu(botID, commandName);
```
</details>
<details open>
<summary>Issue ?</summary>

- It has some minor bugs.
> DiscordAPIError [20012] You are not authorized to perform this action on this application
> 
> Fix it: creating 1 DMs with bot
> 
> In this way, all Slash commands can be obtained
- <strong>Now to get more secure interaction commands you need to use guild.searchInteraction() (using gateway)</strong>
- With REST: update soon.
</details>

## MessageEmbed ?
- Because Discord has removed the ability to send Embeds in its API, that means MessageEmbed is unusable. But I have created a constructor that uses oEmbed with help [from this site](https://www.reddit.com/r/discordapp/comments/82p8i6/a_basic_tutorial_on_how_to_get_the_most_out_of/)

<details open>
<summary><strong>Click to show</strong></summary>


Code:
```js
const Discord = require('discord.js-selfbot-v13');
const w = new Discord.WebEmbed({
  shorten: true,
  hidden: false // if you send this embed with MessagePayload.options.embeds, it must set to false
})
	.setAuthor({ name: 'hello', url: 'https://google.com' })
	.setColor('RED')
	.setDescription('description uh')
	.setProvider({ name: 'provider', url: 'https://google.com' })
	.setTitle('This is Title')
        .setURL('https://google.com')
	.setImage(
		'https://cdn.discordapp.com/attachments/820557032016969751/959093026695835648/unknown.png',
	)
	.setVideo(
		'https://cdn.discordapp.com/attachments/877060758092021801/957691816143097936/The_Quintessential_Quintuplets_And_Rick_Astley_Autotune_Remix.mp4',
	);
message.channel.send({ content: `Hello world`, embeds: [w] }) // Patched :)

```
### Features & Issues
- <strong>Only works with Discord Web and Discord Client (no custom theme installed)</strong>
- No Timestamp, Footer, Fields, Author iconURL
- Video with Embed working
- Can only choose between image and thumbnail
- Description limit 350 characters
- If you use hidden mode you must make sure your custom content is less than 1000 characters without nitro (because hidden mode uses 1000 characters + URL)

</details>
