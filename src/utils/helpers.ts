export const serializeTags = (tags: string[]) => JSON.stringify(tags);

export const deserializeTags = (tagsString: string): string[] => JSON.parse(tagsString);

// Helper function to hash password using PBKDF2
export const hashPassword = async (password: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Import the password as a key
  const key = await crypto.subtle.importKey("raw", data, { name: "PBKDF2" }, false, ["deriveBits"]);

  // Derive the hash
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // 100k iterations for security
      hash: "SHA-256"
    },
    key,
    256 // 256 bits = 32 bytes
  );

  // Combine salt and hash
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64 string
  return btoa(String.fromCharCode(...combined));
};

// Helper function to verify password
export const verifyPassword = async (password: string, hashedPassword: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Decode the stored hash
  const combined = new Uint8Array(
    atob(hashedPassword)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  // Extract salt (first 16 bytes) and hash (remaining bytes)
  const salt = combined.slice(0, 16);
  const storedHash = combined.slice(16);

  // Import the password as a key
  const key = await crypto.subtle.importKey("raw", data, { name: "PBKDF2" }, false, ["deriveBits"]);

  // Derive the hash with the same salt
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );

  const newHash = new Uint8Array(hashBuffer);

  // Compare hashes
  if (newHash.length !== storedHash.length) return false;

  let result = 0;
  for (let i = 0; i < newHash.length; i++) {
    result |= newHash[i] ^ storedHash[i];
  }

  return result === 0;
};
