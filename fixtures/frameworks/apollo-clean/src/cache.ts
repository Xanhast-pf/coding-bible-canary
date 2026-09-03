type FetchPolicy = "cache-first" | "cache-and-network";
const fetchPolicy: FetchPolicy = "cache-and-network";
export const clientOptions = {
  defaultOptions: { watchQuery: { fetchPolicy } },
  typePolicies: { Product: { keyFields: ["sku"] } },
};
