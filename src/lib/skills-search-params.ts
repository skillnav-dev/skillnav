import {
  createSearchParamsCache,
  parseAsString,
  parseAsInteger,
} from "nuqs/server";

export const skillsSearchParams = {
  q: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  tab: parseAsString.withDefault(""),
  sort: parseAsString.withDefault(""),
  repo: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
};

export const skillsParamsCache = createSearchParamsCache(skillsSearchParams);

export const PAGE_SIZE = 24;
