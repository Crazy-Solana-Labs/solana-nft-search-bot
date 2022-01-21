require('dotenv').config(); //initialize dotenv
const { getParsedAccountByMint } = require('@nfteyez/sol-rayz');
const { Connection } = require('@solana/web3.js');
const { Client, Intents, MessageEmbed } = require('discord.js'); //import discord.js
const { searchMetaTokenByParam, decodeNftsMetadata, getSingleNftMeta } = require('./search');
const { API_SOLANA } = require('./solana');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
let connection = new Connection(API_SOLANA);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const prefix = '+';

client.on('messageCreate', async function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift().toLowerCase();
  const text = args.join(' ');

  if (command === 'ping') {
    // Just for tests
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
  } else if (command === 'search') {
    message.reply(`Processing take 1 min, relax and drink water or beer`);
    //
    const searchRes = await searchMetaTokenByParam(text);
    if (searchRes?.length) {
      message.reply(`Founded ${searchRes?.length.toString()} NFTs that contains that text in name. Showing first...`);
    } else {
      message.reply(`Not found anything, try to use exact name for nft or not plural name for collection`);
      return;
    }

    const decodedNfts = await decodeNftsMetadata(searchRes);
    // find exact match first
    const exactMatch = decodedNfts.find(({ data }) => data?.name?.replace(/\0/g, '') === text);
    // in case if no exact match was found use first item in array
    const currToken = exactMatch ?? decodedNfts[0];
    const meta = await getSingleNftMeta(exactMatch ?? decodedNfts[0]);
    const mintAddress = currToken?.mint.toString();
    // get account to find owner of token
    const accountInfo = await getParsedAccountByMint({
      mintAddress,
      connection,
    });
    const owner = accountInfo?.account?.data?.parsed?.info?.owner;

    const updateAuthority = currToken?.updateAuthority?.toString();
    const royalty = (currToken?.data?.sellerFeeBasisPoints / 100).toString();

    const exampleEmbed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(meta?.data?.name)
      .setURL(`https://nfteyez.global/accounts/${owner}/sol/${mintAddress}`)
      .setAuthor({
        name: meta?.data?.collection?.name || meta?.data?.symbol || 'Unknown Collection',
      })
      .setDescription(meta?.data?.description)
      .setThumbnail('https://pbs.twimg.com/profile_images/1451104410688438272/wo_HgYLq_400x400.jpg')
      .addField('Owner', `[${owner}](https://nfteyez.global/accounts/${owner})`, true)
      .addField('Royalty', `${royalty}%`)
      .addField('Update authority', updateAuthority)
      .setImage(meta?.data?.image)
      .setTimestamp()
      .setFooter({
        text: `NftEyez`,
        iconURL: 'https://pbs.twimg.com/profile_images/1451104410688438272/wo_HgYLq_400x400.jpg',
      });

    message.reply({ embeds: [exampleEmbed] });
  }
});

//make sure this line is the last line
client.login(process.env.CLIENT_TOKEN); //login bot using token
