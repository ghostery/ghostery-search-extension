const PUBLIC_EXP = 65537;
const MIN_TOKENS = 6;

function bnToBase64(bn) {
  return sjcl.codec.base64.fromBits(bn.toBits());
}

function base64ToBn(b64) {
  return sjcl.bn.fromBits(sjcl.codec.base64.toBits(b64));
}

// sjcl biginteger -> Uint8Array (filled with leading zeroes)
function bnToUint8(bn, byteSize = 256 /* assume RSA-2048 */) {
  const bytes = atob(bnToBase64(bn));
  if (bytes.length > byteSize) {
    throw new Error('Integer out of bounds');
  }

  const res = new Uint8Array(byteSize);
  const offset = byteSize - bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    res[offset + i] = bytes.charCodeAt(i);
  }
  return res;
}

// Uint8Array -> sjcl biginteger
function uint8ToBn(arr) {
  return base64ToBn(btoa(String.fromCharCode(...arr)));
}

// Compares numbers represented as arrays of the
// same length (assumption: padded with leading zeros).
//
// In the end, it is a lexicographic comparison.
function isLessThen(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    throw new Error('Assumption violated: sizes of arrays must match');
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] < arr2[i]) {
      return true;
    }
    if (arr1[i] > arr2[i]) {
      return false;
    }
  }
  return false;
}

function concatUint8Arrays(...uint8Arrays) {
  const len = uint8Arrays.map(x => x.length).reduce((x, y) => x + y);
  let offset = 0;
  const res = new Uint8Array(len);
  for (let arr of uint8Arrays) {
    res.set(arr, offset);
    offset += arr.length;
  }
  return res;
}

// Implements a full domain hash (FDH), a hash function that preserves the
// size of the message (https://en.wikipedia.org/wiki/Full_Domain_Hash).
// In our case, the input (and output) will be 2048 bits, as we
// are using RSA-2048.
//
// To the best of our knowledge, there exists no standard yet
// for RSA-FDH. Our current implementation of FDH is reusing the same
// construction as in https://github.com/phayes/rsa-fdh.
// SHA-256 is used as the underlying hash function.
//
// The remaining explanation of the construction is taken
// directly from https://github.com/phayes/rsa-fdh:
//
// ----------------------------------------------------------------------
// A full domain hash (FDH) is constructed as follows:
//
// FDH(M, IV) = H(M ‖ N ‖ IV + 0) ‖ H(M ‖ N ‖ IV + 1) ‖ H(M ‖ N ‖ IV + 2) ...
//
// where:
//
//  M is the message
//  H is any hash function
//  N is the signing key's public modulus
//  IV is a one-byte initialization vector
//
// The message is hashed (along with N and IV + incrementing suffix) in rounds
// until the length of the hash is greater than or equal to the length of N.
// The hash is truncated as needed to produce the digest D with the same
// length as N. D must also be smaller than N, so we increment IV until
// we find a D that is smaller than N.
// ----------------------------------------------------------------------
async function fullDomainHash(message, rsaModulus, bitSize = 2048 /* assume RSA-2048 */) {
  if (bitSize % 256 !== 0) {
    throw new Error('Expected bit sizes to be a multiple to 256 (for sha256)');
  }
  if (message.length != bitSize / 8) {
    throw new Error(`Expected tokens to be a ${bitSize}-bit RSA keys (0 padded)`);
  }
  if (rsaModulus.length != bitSize / 8) {
    throw new Error(`Expected RSA to be a ${bitSize}-bit RSA keys (0 padded)`);
  }

  const result = new Uint8Array(bitSize / 8);
  const blockCount = bitSize / 256; // SHA-256 blocks: 256 bits

  const singleByteToArray = (x) => {
    if (x < 0 || x >= 256) {
      throw new Error('Value out of bounds');
    }
    return new Uint8Array([x]);
  };

  // Assuming the RSA modulus is near the maximum bit size
  // (its highest bit should be set), each iteration will have
  // approximately 50% chances of success, so the chances of
  // failing are about 1/(2^maxAttempts).
  const maxAttempts = 25;

  for (let iv = 0; iv < maxAttempts; iv++) {
    for (let block = 0; block < blockCount; block++) {
      const offset = block * 32;
      const data = concatUint8Arrays(message, rsaModulus, singleByteToArray(iv + block));
      const digest = await crypto.subtle.digest('SHA-256', data);
      result.set(new Uint8Array(digest), block * 32);
    }
    if (isLessThen(result, rsaModulus)) {
      return result;
    }
  }
  throw new Error(`Failed to compute hash. Gave up after ${maxAttempts} attempts.`);
}

async function fullDomainHashBn(message, rsaModulus, bitSize = 2048 /* assume RSA-2048 */) {
  const message_ = bnToUint8(message);
  const rsaModulus_ = bnToUint8(rsaModulus);
  const digest = await fullDomainHash(message_, rsaModulus_, bitSize);
  return uint8ToBn(digest);
}

// Clients acquire tokens, which they can later spend on search requests.
// Tokens have to be signed by the server, but to prevent tracking of
// requests, the server must not see a token in plain text when
// signing it. For that reason, the blind signature scheme from David Chaum
// is used ("Blind signatures for untraceable payments").
// A description can also be found in https://eprint.iacr.org/2001/002.pdf
//
// Our implementation uses FDH-RSA with 2048 bit key sizes.
class TokenPool {
  constructor() {
    this.tokens = [];
  }

  async getToken() {
    if (this.tokens.length === 0) {
      await this.generateTokens();
    } else if (this.tokens.length < MIN_TOKENS) {
      this.generateTokens().catch((e) => {
        console.error('Failed to generate tokens in advance', e);
      });
    }
    return this.tokens.pop();
  }

  async getModulus() {
    if (!this._cachedModulus) {
      const response = await fetch(`${API_BASE_URL}/info`);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const { modulus } = await response.json();
      this._cachedModulus = base64ToBn(modulus);
    }
    return this._cachedModulus;
  }

  async makePretoken(mod) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const token = sjcl.bn.random(mod, /* paranoia */);

      let paddedToken;
      try {
        paddedToken = await fullDomainHashBn(token, mod);
      } catch (e) {
        // In practice, this path should never be reached.
        // Nevertheless, should it happen, retry with another random token.
        console.warn('Unable to compute hash. Retry with a new token...', e);
        continue;
      }

      const blindFactor = sjcl.bn.random(mod, /* paranoia */);
      const blindToken = blindFactor.powermod(PUBLIC_EXP, mod).mulmod(paddedToken, mod);
      return { token, blindFactor, blindToken };
    }
    throw new Error('Giving up, unable to create token');
  }

  async generateTokens() {
    // avoid endless growth of the token pool
    if (this.tokens.length >= MIN_TOKENS) {
      return;
    }

    const accessToken = await AccessToken.get();
    if (!accessToken) {
      return;
    }
    const mod = await this.getModulus();
    const blindTokens = [];
    const pretokens = [];

    for (let i = 0; i < 10; i += 1) {
      const { token, blindFactor, blindToken } = await this.makePretoken(mod);
      blindTokens.push(bnToBase64(blindToken));
      pretokens.push({ token, blindFactor });
    }

    let response = await this._fetchNewTokens(accessToken, blindTokens);
    if (response.status === 401) {
      // try to refresh token and try again if authorization failed
      // as the token technically could have expired by the time the request
      // arives
      const accessToken = await AccessToken.get();
      response = await this._fetchNewTokens(accessToken, blindTokens);
    }
    if (response.ok) {
      const { tokens } = await response.json();
      const res = [];
      await Promise.all(tokens.map(async (_blindToken, i) => {
        const blindToken = base64ToBn(_blindToken);
        const { token, blindFactor } = pretokens[i];
        const sig = blindToken.mulmod(blindFactor.inverseMod(mod), mod);
        const expectedSig = await fullDomainHashBn(token, mod);
        const goodSig = sig.powermod(PUBLIC_EXP, mod).equals(expectedSig);
        if (!goodSig) {
          console.error('Hey, got some invalid tokens, bad bank!!!');
        } else {
          // Now I have a token and a valid RSA signature on it by the server
          res.push({
            token: bnToBase64(token),
            sig: bnToBase64(sig),
          });
        }
      }));
      console.warn(`Adding ${res.length} tokens to acquired pool`);
      this.tokens.push(...res);
    }
  }

  async _fetchNewTokens(accessToken, blindTokens) {
    return fetch(`${API_BASE_URL}/tokens/new`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blindTokens,
      }),
    });
  }
}
