export function formatDateBR(isoDate) {
  if (!isoDate) return '-'
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function toInputDate(brDate) {
  if (!brDate) return ''
  const [day, month, year] = brDate.split('/')
  return `${year}-${month}-${day}`
}

export function fromInputDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function getColumns(isAdmin) {
  const base = [
    { key: "date", label: "Data" },
    { key: "account_id", label: "Conta" },
    { key: "campaign_id", label: "Campanha" },
    { key: "impressions", label: "Impressões" },
    { key: "clicks", label: "Cliques" },
    { key: "conversions", label: "Conversões" },
    { key: "interactions", label: "Interações" },
  ]
  return isAdmin ? [...base, { key: "cost_micros", label: "Custo (micros)" }] : base
}