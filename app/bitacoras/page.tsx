'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Plus, MapPin, Calendar, Ship, Fish, Search, Eye, FileText, X, Database } from 'lucide-react'
import { useFlotilla } from '@/hooks/useFlotilla'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const LogLocationMap = dynamic(() => import('@/components/log-location-map').then(mod => mod.LogLocationMap), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center"><span className="text-muted-foreground">Cargando mapa...</span></div>,
})

interface BitacoraEntry {
  id: number
  codigo: string
  embarcacion_nombre: string
  embarcacion_id: number
  lat: number | null
  lon: number | null
  captura_kg: number | null
  especie: string | null
  estado_mar: string | null
  observaciones: string | null
  fecha_hora: string
  origen: string
}

export default function BitacorasPage() {
  const { barcos } = useFlotilla()
  const [entries, setEntries] = useState<BitacoraEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<BitacoraEntry | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newEntry, setNewEntry] = useState({
    embarcacion_id: '',
    captura_kg: '',
    especie: '',
    estado_mar: 'Moderado',
    observaciones: '',
    lat: '',
    lon: ''
  })

  useEffect(() => {
    fetch('/api/bitacoras')
      .then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filteredEntries = entries.filter(e =>
    (e.embarcacion_nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.especie || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.observaciones || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddEntry = async () => {
    if (!newEntry.embarcacion_id || !newEntry.captura_kg || !newEntry.especie) return
    setSaving(true)
    try {
      const res = await fetch('/api/bitacoras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embarcacion_id: parseInt(newEntry.embarcacion_id),
          lat: parseFloat(newEntry.lat) || null,
          lon: parseFloat(newEntry.lon) || null,
          captura_kg: parseFloat(newEntry.captura_kg),
          especie: newEntry.especie,
          estado_mar: newEntry.estado_mar,
          observaciones: newEntry.observaciones,
        })
      })
      if (res.ok) {
        const saved = await res.json()
        const barco = barcos.find(b => b.id === parseInt(newEntry.embarcacion_id))
        const newRow: BitacoraEntry = {
          id: saved.id,
          codigo: barco?.codigo || '',
          embarcacion_nombre: barco?.nombre || '',
          embarcacion_id: parseInt(newEntry.embarcacion_id),
          lat: parseFloat(newEntry.lat) || barco?.lat || null,
          lon: parseFloat(newEntry.lon) || barco?.lon || null,
          captura_kg: parseFloat(newEntry.captura_kg),
          especie: newEntry.especie,
          estado_mar: newEntry.estado_mar,
          observaciones: newEntry.observaciones,
          fecha_hora: saved.fecha_hora,
          origen: 'MANUAL',
        }
        setEntries([newRow, ...entries])
        setShowAddForm(false)
        setNewEntry({ embarcacion_id: '', captura_kg: '', especie: '', estado_mar: 'Moderado', observaciones: '', lat: '', lon: '' })
      }
    } finally { setSaving(false) }
  }

  return (
    <DashboardLayout title="Bitácoras de Pesca" subtitle="Registro real en PostgreSQL/PostGIS">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-success/10 text-success border-success/30"><Database className="h-3 w-3 mr-1" />PostGIS</Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">{entries.length} registros en BD</Badge>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por embarcación, especie..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-secondary border-border" />
              </div>
              <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/80 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />Nuevo Registro
              </Button>
            </div>
          </CardContent>
        </Card>

        {showAddForm && (
          <Card className="bg-card border-border border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" />Nuevo Registro — PostGIS</span>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}><X className="h-4 w-4" /></Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Embarcación</label>
                  <select value={newEntry.embarcacion_id} onChange={(e) => setNewEntry({ ...newEntry, embarcacion_id: e.target.value })}
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground">
                    <option value="">Seleccionar...</option>
                    {barcos.map(b => <option key={b.id} value={b.id}>{b.codigo} — {b.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Captura (kg)</label>
                  <Input type="number" placeholder="0" value={newEntry.captura_kg}
                    onChange={(e) => setNewEntry({ ...newEntry, captura_kg: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Especie</label>
                  <select value={newEntry.especie} onChange={(e) => setNewEntry({ ...newEntry, especie: e.target.value })}
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground">
                    <option value="">Seleccionar...</option>
                    {['Atún Aleta Amarilla','Atún Patudo','Atún Barrilete','Atún Albacora'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Estado del mar</label>
                  <select value={newEntry.estado_mar} onChange={(e) => setNewEntry({ ...newEntry, estado_mar: e.target.value })}
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground">
                    {['Calmo','Poco agitado','Moderado','Agitado','Muy agitado'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Lat / Lon (opcional)</label>
                  <div className="flex gap-2">
                    <Input type="text" placeholder="Lat" value={newEntry.lat}
                      onChange={(e) => setNewEntry({ ...newEntry, lat: e.target.value })} className="bg-secondary border-border" />
                    <Input type="text" placeholder="Lon" value={newEntry.lon}
                      onChange={(e) => setNewEntry({ ...newEntry, lon: e.target.value })} className="bg-secondary border-border" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Observaciones</label>
                  <Input type="text" placeholder="Notas adicionales..." value={newEntry.observaciones}
                    onChange={(e) => setNewEntry({ ...newEntry, observaciones: e.target.value })} className="bg-secondary border-border" />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={handleAddEntry} disabled={saving} className="bg-primary hover:bg-primary/80">
                  {saving ? 'Guardando...' : 'Guardar en PostGIS'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Registros de Captura — PostGIS
                <span className="text-sm font-normal text-muted-foreground">({filteredEntries.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground p-4">Cargando desde PostGIS...</p>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No hay registros aún. Agrega el primero.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Embarcación</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Especie</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Captura</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Ver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} onClick={() => setSelectedEntry(entry)}
                          className={cn('border-b border-border/50 cursor-pointer transition-colors',
                            selectedEntry?.id === entry.id ? 'bg-primary/10' : 'hover:bg-secondary/50')}>
                          <td className="py-3 px-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{new Date(entry.fecha_hora).toLocaleDateString('es-GT')}</span></div></td>
                          <td className="py-3 px-4"><div className="flex items-center gap-2"><Ship className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{entry.codigo} — {entry.embarcacion_nombre}</span></div></td>
                          <td className="py-3 px-4"><span className="text-sm">{entry.especie || '–'}</span></td>
                          <td className="py-3 px-4 text-right"><span className="text-sm font-medium text-success">{entry.captura_kg ? `${entry.captura_kg} kg` : '–'}</span></td>
                          <td className="py-3 px-4 text-center"><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedEntry(entry) }}><Eye className="h-4 w-4" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Detalle</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEntry ? (
                <div className="space-y-4">
                  {selectedEntry.lat && selectedEntry.lon && (
                    <LogLocationMap height="200px" location={{ lat: selectedEntry.lat, lng: selectedEntry.lon }} />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Calendar, label: 'Fecha', value: new Date(selectedEntry.fecha_hora).toLocaleDateString('es-GT') },
                      { icon: Ship,     label: 'Barco', value: `${selectedEntry.codigo}` },
                      { icon: Fish,     label: 'Especie', value: selectedEntry.especie || '–' },
                      { icon: Fish,     label: 'Captura', value: selectedEntry.captura_kg ? `${selectedEntry.captura_kg} kg` : '–' },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1"><Icon className="h-4 w-4" /><span className="text-xs">{label}</span></div>
                        <p className="text-sm font-medium text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                  {selectedEntry.lat && <div className="p-3 rounded-lg bg-secondary/50"><div className="flex items-center gap-2 text-muted-foreground mb-1"><MapPin className="h-4 w-4" /><span className="text-xs">Ubicación PostGIS</span></div><p className="text-sm font-mono">{selectedEntry.lat?.toFixed(4)}°N, {selectedEntry.lon?.toFixed(4)}°W</p></div>}
                  {selectedEntry.observaciones && <div className="p-3 rounded-lg bg-secondary/50"><p className="text-xs text-muted-foreground mb-1">Observaciones</p><p className="text-sm">{selectedEntry.observaciones}</p></div>}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">Selecciona un registro para ver detalles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
