declare const gql: (parts: TemplateStringsArray) => unknown;
declare const client: { query(options: { query: unknown; variables: { id: string } }): unknown };
declare const userId: string;
const document = gql`
  query UserQuery($id: ID!) {
    user(id: $id) { id name }
  }
`;
export const result = client.query({ query: document, variables: { id: userId } });
