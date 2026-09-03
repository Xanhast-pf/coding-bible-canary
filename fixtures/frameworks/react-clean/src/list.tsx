type Item = { id: string; label: string };
export const List = ({ items }: { items: readonly Item[] }) => (
  <ul>{items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
);
