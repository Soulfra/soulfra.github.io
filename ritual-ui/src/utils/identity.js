export function getOrCreateSoulfraId() {
  const key = "soulfra_id"
  const stored = localStorage.getItem(key)
  if (stored) return stored

  const newId = "soul-" + crypto.randomUUID()
  localStorage.setItem(key, newId)
  return newId
}