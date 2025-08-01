import { createClient } from 'redis';
import { DATABASE_URL } from '../config/env';

const redisClient = createClient({ url: DATABASE_URL });

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
})();

export interface IUser {
  walletAddress: string;
  username: string;
  createdAt: Date;
  lastLogin: Date;
}

export const User = {
  async findOne({ walletAddress }: { walletAddress: string }): Promise<IUser | null> {
    const userJson = await redisClient.get(`user:${walletAddress.toLowerCase()}`);
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  },

  async create(userData: { walletAddress: string; username: string }): Promise<IUser> {
    const { walletAddress, username } = userData;
    const lowerCaseUsername = username.toLowerCase();
    const lowerCaseWalletAddress = walletAddress.toLowerCase();
    const usernameKey = `username:${lowerCaseUsername}`;
    const userKey = `user:${lowerCaseWalletAddress}`;

    await redisClient.watch(usernameKey);
    const ownerAddress = await redisClient.get(usernameKey);
    if (ownerAddress) {
      await redisClient.unwatch();
      throw new Error('Username is already taken.');
    }

    const newUser: IUser = {
      ...userData,
      walletAddress: lowerCaseWalletAddress,
      username,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    const multi = redisClient.multi();
    multi.set(usernameKey, lowerCaseWalletAddress);
    multi.set(userKey, JSON.stringify(newUser));
    const result = await multi.exec();

    if (result === null) {
      throw new Error('Username was taken during creation. Please try again.');
    }

    return newUser;
  },

  async save(user: IUser): Promise<IUser> {
    user.lastLogin = new Date();
    const lowerCaseWalletAddress = user.walletAddress.toLowerCase();
    const userKey = `user:${lowerCaseWalletAddress}`;
    const oldUser = await this.findOne({ walletAddress: lowerCaseWalletAddress });

    if (oldUser && oldUser.username.toLowerCase() !== user.username.toLowerCase()) {
      const oldUsernameKey = `username:${oldUser.username.toLowerCase()}`;
      const newUsernameKey = `username:${user.username.toLowerCase()}`;

      await redisClient.watch(newUsernameKey);
      const ownerAddress = await redisClient.get(newUsernameKey);
      if (ownerAddress && ownerAddress !== lowerCaseWalletAddress) {
        await redisClient.unwatch();
        throw new Error('Username is already taken.');
      }

      const multi = redisClient.multi();
      multi.del(oldUsernameKey);
      multi.set(newUsernameKey, lowerCaseWalletAddress);
      multi.set(userKey, JSON.stringify(user));
      const result = await multi.exec();

      if (result === null) {
        throw new Error('Username was taken during update. Please try again.');
      }
    } else {
      await redisClient.set(userKey, JSON.stringify(user));
    }

    return user;
  },

  async findByUsername(username: string): Promise<IUser | null> {
    const usernameKey = `username:${username.toLowerCase()}`;
    const walletAddress = await redisClient.get(usernameKey);
    if (!walletAddress) {
      return null;
    }
    return this.findOne({ walletAddress });
  }
};
