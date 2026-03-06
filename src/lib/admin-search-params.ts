import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const adminArticlesSearchParams = {
  status: parseAsString.withDefault(""),
  source: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const adminArticlesParamsCache = createSearchParamsCache(
  adminArticlesSearchParams,
);
