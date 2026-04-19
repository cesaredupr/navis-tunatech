'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  Plus, 
  Upload, 
  MapPin,
  Calendar,
  Ship,
  Fish,
  Search,
  Eye,
  FileText,
  X
} from 'lucide-react'
import { logEntries, vessels, type LogEntry } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const LogLocationMap = dynamic(() => import('@/components/log-location-map').then(mod => mod.LogLocationMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
      <span className="text-muted-foreground">Cargando mapa...</span>
    </div>
  ),
})

export default function BitacorasPage() {
  const [entries, setEntries] = useState(logEntries)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    vesselId: '',
    catchAmount: '',
    species: '',
    notes: '',
    lat: '',
    lng: ''
  })

  const filteredEntries = entries.filter(entry =>
    entry.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.notes.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddEntry = () => {
    const vessel = vessels.find(v => v.id === newEntry.vesselId)
    if (!vessel || !newEntry.catchAmount || !newEntry.species) return

    const entry: LogEntry = {
      id: `L${String(entries.length + 1).padStart(3, '0')}`,
      date: newEntry.date,
      vesselId: newEntry.vesselId,
      vesselName: vessel.name,
      location: {
        lat: parseFloat(newEntry.lat) || vessel.position.lat,
        lng: parseFloat(newEntry.lng) || vessel.position.lng
      },
      catchAmount: parseFloat(newEntry.catchAmount),
      species: newEntry.species,
      notes: newEntry.notes
    }

    setEntries([entry, ...entries])
    setShowAddForm(false)
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      vesselId: '',
      catchAmount: '',
      species: '',
      notes: '',
      lat: '',
      lng: ''
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Simulate CSV parsing
      alert(`Archivo "${file.name}" cargado. En una implementación real, esto procesaría el CSV.`)
    }
  }

  return (
    <DashboardLayout title="Bitácoras de Pesca" subtitle="Registro y consulta de capturas">
      <div className="space-y-6">
        {/* Actions Bar */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por embarcación, especie o notas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Registro
                </Button>

                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button variant="secondary" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Cargar CSV
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Entry Form */}
        {showAddForm && (
          <Card className="bg-card border-border border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Nuevo Registro de Captura
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Fecha</label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Embarcación</label>
                  <select
                    value={newEntry.vesselId}
                    onChange={(e) => setNewEntry({ ...newEntry, vesselId: e.target.value })}
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                  >
                    <option value="">Seleccionar...</option>
                    {vessels.map((vessel) => (
                      <option key={vessel.id} value={vessel.id}>
                        {vessel.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Captura (ton)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={newEntry.catchAmount}
                    onChange={(e) => setNewEntry({ ...newEntry, catchAmount: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Especie</label>
                  <select
                    value={newEntry.species}
                    onChange={(e) => setNewEntry({ ...newEntry, species: e.target.value })}
                    className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Atún Aleta Amarilla">Atún Aleta Amarilla</option>
                    <option value="Atún Patudo">Atún Patudo</option>
                    <option value="Atún Barrilete">Atún Barrilete</option>
                    <option value="Atún Albacora">Atún Albacora</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Coordenadas (opcional)</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Latitud"
                      value={newEntry.lat}
                      onChange={(e) => setNewEntry({ ...newEntry, lat: e.target.value })}
                      className="bg-secondary border-border"
                    />
                    <Input
                      type="text"
                      placeholder="Longitud"
                      value={newEntry.lng}
                      onChange={(e) => setNewEntry({ ...newEntry, lng: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Notas</label>
                  <Input
                    type="text"
                    placeholder="Observaciones adicionales..."
                    value={newEntry.notes}
                    onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleAddEntry}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  Guardar Registro
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Registros de Captura
                <span className="text-sm font-normal text-muted-foreground">
                  ({filteredEntries.length} registros)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Embarcación</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Especie</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Captura</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={cn(
                          'border-b border-border/50 transition-colors cursor-pointer',
                          selectedEntry?.id === entry.id
                            ? 'bg-primary/10'
                            : 'hover:bg-secondary/50'
                        )}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{entry.date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Ship className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{entry.vesselName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-foreground">{entry.species}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-medium text-success">{entry.catchAmount} ton</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEntry(entry)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detail Panel */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Detalle del Registro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEntry ? (
                <div className="space-y-4">
                  <LogLocationMap 
                    height="200px" 
                    location={selectedEntry.location}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">Fecha</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{selectedEntry.date}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Ship className="h-4 w-4" />
                        <span className="text-xs">Embarcación</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{selectedEntry.vesselName}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Fish className="h-4 w-4" />
                        <span className="text-xs">Especie</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{selectedEntry.species}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Fish className="h-4 w-4" />
                        <span className="text-xs">Captura</span>
                      </div>
                      <p className="text-sm font-medium text-success">{selectedEntry.catchAmount} ton</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs">Ubicación</span>
                    </div>
                    <p className="text-sm font-mono text-foreground">
                      {selectedEntry.location.lat.toFixed(4)}°, {selectedEntry.location.lng.toFixed(4)}°
                    </p>
                  </div>

                  {selectedEntry.notes && (
                    <div className="p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs">Notas</span>
                      </div>
                      <p className="text-sm text-foreground">{selectedEntry.notes}</p>
                    </div>
                  )}
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
