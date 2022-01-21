const bs58 = require('bs58');
const web3 = require('@solana/web3.js');
const { decodeTokenMetadata } = require('@nfteyez/sol-rayz');
const axios = require('axios');
const Promise = require('bluebird');
const { METADATA_PROGRAM, API_SOLANA } = require('./solana');

// using mainnet beta
let connection = new web3.Connection(API_SOLANA);

async function getJsonFromUrl(src) {
  //simple function that return json from link
  try {
    const res = await axios.get(src);
    return res;
  } catch (err) {
    return undefined;
  }
}

const searchMetaTokenByParam = async text => {
  const bytes = bs58.encode(Buffer.from(text));
  const metaPubKey = new web3.PublicKey(METADATA_PROGRAM);
  try {
    const res = await connection.getProgramAccounts(metaPubKey, {
      commitment: 'confirmed',
      encoding: 'base64',
      filters: [
        {
          memcmp: {
            // offset determine what we will you search
            // for example 1 means that you will start from 2nd symbol and will check next n bytes,
            // and from 1 till 32 stored update authority, in that case you will get all tokens with that authority
            // in most cases it will mean whole collection. In this case 1 + 32 + 32 + 4 means name of the token
            offset: 1 + 32 + 32 + 4,
            bytes,
          },
        },
      ],
    });
    return res;
  } catch (err) {
    //
  }
};

const decodeNftsMetadata = async nfts => {
  try {
    const decodedArray = await Promise.all(nfts.map(acc => decodeTokenMetadata(acc?.account?.data)));
    return decodedArray;
  } catch (err) {
    //
  }
};

const getSingleNftMeta = async nft => {
  try {
    const jsonUri = nft?.data?.uri?.replace(/\0/g, '');

    const fetchedJsonNft = await getJsonFromUrl(jsonUri);

    return fetchedJsonNft;
  } catch (err) {
    //
  }
};

module.exports = {
  searchMetaTokenByParam,
  decodeNftsMetadata,
  getSingleNftMeta,
};
