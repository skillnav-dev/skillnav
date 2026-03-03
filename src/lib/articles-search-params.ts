import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const articlesSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const articlesParamsCache =
  createSearchParamsCache(articlesSearchParams);

export const ARTICLES_PAGE_SIZE = 12;
