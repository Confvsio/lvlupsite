import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// Fetch channels from a specific guild (server)
async function fetchChannels(guildId: string) {
  const guild = await client.guilds.fetch(guildId);
  const channels = guild.channels.cache.map(channel => ({
    id: channel.id,
    name: channel.name,
    type: channel.type,
  }));
  return channels;
}

// Login with your bot token
client.login(process.env.DISCORD_BOT_TOKEN);