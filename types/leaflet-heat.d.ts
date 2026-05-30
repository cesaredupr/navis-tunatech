import * as L from 'leaflet'

declare module 'leaflet' {
  interface HeatLayerOptions {
    minOpacity?: number
    maxZoom?: number
    max?: number
    radius?: number
    blur?: number
    gradient?: Record<number, string>
  }

  interface HeatLayer extends L.Layer {
    setOptions(options: HeatLayerOptions): this
    addLatLng(latlng: L.LatLngExpression): this
    setLatLngs(latlngs: L.LatLngExpression[]): this
    redraw(): this
  }

  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: HeatLayerOptions
  ): HeatLayer
}

declare module 'leaflet.heat' {
  // Module augments leaflet
}
