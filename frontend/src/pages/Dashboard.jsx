import React, { useEffect, useState } from 'react'
import { formatDateBR, fromInputDate, toInputDate, getColumns } from '../utils/formatter'

export default function Dashboard({ token, role, onLogout }) {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, page_size: 15 })
  const [startDate, setStartDate] = useState('') 
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [order, setOrder] = useState('asc')

  const isAdmin = role === 'admin'

  const fetchData = async (page = pagination.page) => {
    const params = new URLSearchParams()
    params.append('page', page)
    params.append('page_size', pagination.page_size)
    if (startDate) params.append('start_date', toInputDate(startDate))
    if (endDate) params.append('end_date', toInputDate(endDate))
    if (sortBy) params.append('sort_by', sortBy)
    if (order) params.append('order', order)

    const res = await fetch('http://localhost:8000/metrics?' + params.toString(), {
      headers: { 'Authorization': 'Bearer ' + token }
    })

    if (!res.ok) {
      if (res.status === 401) return onLogout()
      return
    }

    const json = await res.json()
    setData(json.data)
    setPagination(json.pagination)
  }

  useEffect(() => { fetchData(1) }, [sortBy, order, startDate, endDate])

  const handleSort = (col) => {
    if (sortBy === col) setOrder(order === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setOrder('asc') }
  }

  const columns = getColumns(isAdmin)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Painel</h1>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Sair
        </button>
      </header>
      <div className="bg-white rounded-2xl shadow p-6 mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-600">Data inicial</label>
          <input
            type="date"
            value={startDate ? toInputDate(startDate) : ''}
            onChange={e => setStartDate(fromInputDate(e.target.value))}
            className="border rounded-lg px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Data final</label>
          <input
            type="date"
            value={endDate ? toInputDate(endDate) : ''}
            onChange={e => setEndDate(fromInputDate(e.target.value))}
            className="border rounded-lg px-3 py-2 mt-1"
          />
        </div>  
      </div>
        <div className="overflow-x-auto bg-white rounded-2xl shadow">
          <table className="w-full border-collapse text-center">
            <thead className="bg-indigo-600 text-white sticky top-0">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="p-3 cursor-pointer select-none hover:bg-indigo-700 transition-colors"
                  >
                    {col.label}
                    {sortBy === col.key && <span>{order === "asc" ? " ↑" : " ↓"}</span>}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center p-4 text-gray-500">
                    Sem dados
                  </td>
                </tr>
              ) : (
                data.map((r, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-3">{formatDateBR(r.date)}</td>
                    <td className="p-3">{r.account_id}</td>
                    <td className="p-3">{r.campaign_id}</td>
                    <td className="p-3">{r.impressions}</td>
                    <td className="p-3">{r.clicks}</td>
                    <td className="p-3">{r.conversions}</td>
                    <td className="p-3">{r.interactions}</td>
                    {isAdmin && <td className="p-3">{r.cost_micros ?? '-'}</td>}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={columns.length} className="p-4 bg-gray-50">
                  <div className="flex flex-col md:flex-row justify-center items-center gap-4 w-full">
                    <div className="flex items-center gap-4 justify-center">
                      <button
                        disabled={pagination.page <= 1}
                        onClick={() => fetchData(pagination.page - 1)}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                      >
                        ← Anterior
                      </button>
                      <span className="text-sm text-gray-700">
                        Página {pagination.page} de {pagination.pages}
                      </span>
                      <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => fetchData(pagination.page + 1)}
                        className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                      >
                        Próxima →
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
    </div>
  )
}