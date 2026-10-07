export function toggleSelection(list, id) {
  const index = list.indexOf(id);
  if (index === -1) list.push(id);
  else list.splice(index, 1);
  return list;
}
