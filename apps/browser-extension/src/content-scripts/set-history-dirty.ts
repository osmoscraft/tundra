export default function () {
  document._tinykb ??= {};

  const { _tinykb } = document;
  if (!_tinykb.isHistoryDirty) {
    _tinykb.isHistoryDirty = true;
  }
}
