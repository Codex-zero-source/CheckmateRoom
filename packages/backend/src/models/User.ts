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
    const newUser: IUser = {
      ...userData,
      walletAddress: userData.walletAddress.toLowerCase(),
      createdAt: new Date(),
      lastLogin: new Date(),
    };
    await redisClient.set(`user:${newUser.walletAddress}`, JSON.stringify(newUser));
    return newUser;
  },

  async save(user: IUser): Promise<IUser> {
    user.lastLogin = new Date();
    await redisClient.set(`user:${user.walletAddress.toLowerCase()}`, JSON.stringify(user));
    return user;
  }
};
