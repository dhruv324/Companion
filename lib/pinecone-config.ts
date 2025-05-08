import { PineconeConfiguration } from "@pinecone-database/pinecone";

export interface PineconeCustomConfig extends PineconeConfiguration {
  environment: string;
}