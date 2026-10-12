import "server-only";

import mongoose from "mongoose";
import { getServerEnv } from "@/lib/env";

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __saadAgentMongoose?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__saadAgentMongoose ??= {
  connection: null,
  promise: null,
});

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.connection) {
    return cache.connection;
  }

  if (!cache.promise) {
    const { MONGODB_URI } = getServerEnv();

    mongoose.set("strictQuery", true);

    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10_000,
      })
      .then((connection) => {
        cache.connection = connection;
        return connection;
      })
      .catch((error: unknown) => {
        cache.promise = null;
        throw error;
      });
  }

  return cache.promise;
}
