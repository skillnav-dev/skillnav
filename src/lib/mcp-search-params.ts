import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
} from "nuqs/server";

export const mcpSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  sort: parseAsString.withDefault(""),
  tier: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const mcpParamsCache = createSearchParamsCache(mcpSearchParams);

export const MCP_PAGE_SIZE = 24;
