import { Client, Users, Databases } from "node-appwrite";

const adminClient = new Client();

adminClient
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const adminUsers = new Users(adminClient);
export const adminDatabases = new Databases(adminClient);
export { adminClient };