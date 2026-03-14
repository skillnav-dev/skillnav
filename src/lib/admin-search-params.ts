import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const adminArticlesSearchParams = {
  status: parseAsString.withDefault(""),
  source: parseAsString.withDefault(""),
  contentTier: parseAsString.withDefault(""),
  articleType: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminArticlesParamsCache = createSearchParamsCache(
  adminArticlesSearchParams,
);

export const adminSkillsSearchParams = {
  status: parseAsString.withDefault(""),
  source: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminSkillsParamsCache = createSearchParamsCache(
  adminSkillsSearchParams,
);

export const adminMcpSearchParams = {
  status: parseAsString.withDefault(""),
  qualityTier: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  source: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminMcpParamsCache =
  createSearchParamsCache(adminMcpSearchParams);
