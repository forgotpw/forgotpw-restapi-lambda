const config = require('../config')
const AWS = require('aws-sdk');
const logger = require('../logger')

AWS.config.update({region: config.AWS_REGION});

class SecretAutogenService {
  constructor() {}

  async generate(languageCode, numWords, maxCharsPerWord) {
    logger.info(`Autogenerating ${numWords} word ${languageCode} secret, max ${maxCharsPerWord} chars per word`)

    const s3bucket = config.AUTOGEN_S3_BUCKET;
    const adjectives = await getWords(s3bucket, 'en-us/adjectives.txt', maxCharsPerWord);
    const nouns =  await getWords(s3bucket, 'en-us/nouns.txt', maxCharsPerWord);

    let secret = '';
    let lastChar = '';
    // first words are all adjectives
    for (let i = 0; i<numWords-1; i++) {
      lastChar = secret.charAt(secret.length - 1);
      let randomAdjective = randomStringInArrayNotStartingWith(adjectives, lastChar)
      secret += randomAdjective;
    }
    // last word is always a noun
    lastChar = secret.charAt(secret.length - 1);
    let randomNoun = randomStringInArrayNotStartingWith(nouns, lastChar);
    secret += randomNoun;

    return secret;
  }
}

function randomStringInArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// to prevent concatenating words where the last letter of the prior
// word and the first letter of the next are the same, like specialllama
// because this is harder to read
function randomStringInArrayNotStartingWith(arr, notStartingWithChar) {
  const maxTries = 10;
  let randomString
  for (let i=0; i<maxTries; i++) {
    randomString = randomStringInArray(arr);
    if (randomString.charAt(0) != notStartingWithChar) {
      return randomString;
    }
  }
  logger.warn(`Returned random string not honoring filter after ${maxTries} tries.`)
  return randomString;
}

// obviously this has a memory / file size limitation, good enough for now
async function getWords(s3bucket, s3key, maxCharsPerWord) {
  const text = await getS3File(s3bucket, s3key);
  const allWords = text.split("\n");
  logger.debug(`Loaded ${allWords.length} raw words from s3://${s3bucket}/${s3key}`);
  let cleansedWords = [];
  for (let word of allWords) {
    word = word.trim();
    if (containsOnlyAlphaChars(word) && word.length <= maxCharsPerWord) {
      cleansedWords.push(word);
    }
  }
  logger.debug(`Returning ${cleansedWords.length} cleansed words from s3://${s3bucket}/${s3key}`);
  return cleansedWords;
}

// will also return false if any spaces are included in the string
function containsOnlyAlphaChars(str) {
  return /^[a-zA-Z]*$/.test(str);
}

async function getS3File(s3bucket, s3key) {
  let data
  try {
    const s3 = new AWS.S3();
    logger.debug(`Reading from s3://${s3bucket}/${s3key}`)
    data = await s3.getObject({
      Bucket: s3bucket,
      Key: s3key
    }).promise()
  }
  catch (err) {
    logger.error(err)
    if (err.toString().includes('NoSuchKey')) {
      logger.debug(`S3 Key not found: s3://${s3bucket}/${s3key}`)
      throw err
    }
    logger.error(`Error reading s3://${s3bucket}/${s3key}:`, err)
    throw err
  }
  logger.debug(`Successfully read s3://${s3bucket}/${s3key}`)

  return data.Body.toString();
}

module.exports = SecretAutogenService
