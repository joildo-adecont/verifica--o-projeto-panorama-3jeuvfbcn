import * as XLSX from 'xlsx'

export function testXlsx() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['A', 'B'],
    [1, 2],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Teste')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}
