export interface NavPointRow {
  timestamp: string;
  navBtcPerStratWad: string;
  // Null until the pool has a full TWAP window.
  marketBtcPerStratWad: string | null;
}

export interface NavHistoryResponse {
  navPoints: NavPointRow[];
}

export const GET_NAV_HISTORY = `
  query GetNavHistory($first: Int!, $skip: Int!) {
    navPoints(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: asc
    ) {
      timestamp
      navBtcPerStratWad
      marketBtcPerStratWad
    }
  }
`;
