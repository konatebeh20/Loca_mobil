  import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { Platform } from '@ionic/angular';

import * as L from 'leaflet';
import * as tf from '@tensorflow/tfjs';
import * as Papa from 'papaparse';
import Long from 'long';


// import { PreprocessingService } from '../services/preprocessing.service';



interface PreprocessingService {
  normalize(features: number[]): number[];
}


interface TrafficSegment {
  coordinates: L.LatLng[];
  properties: {
    nombre_voitures: number;
    vitesse_moyenne: number;
    longitude_end: number;
    latitude_end: number;
    latitude_start: number;
    longitude_start: number;
    distance_km: number;
    incident_signalé: boolean;
    jour_semaine: number;
    segment_end: string;
    mois: number;
    gravité: number;
    météo: string;
    humidité: number;
    segment_start: string;
    température: number;
    type_incident: string;
  };
}


interface PredictionResult {
  status: string;
  probability: number;
}



@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class MapPage implements OnInit, AfterViewInit {

  map!: L.Map;
  trafficData: TrafficSegment[] = [];
  activeFilters: any = {};
  filterOptions: any = {};
  isFilterMenuOpen = false;
  isPredictionModalOpen = false;
  currentPrediction: PredictionResult | null = null;
  predictionModel: tf.LayersModel | null = null;


  // preprocessing service implementation
  private preprocessingService: PreprocessingService = {
    normalize: (features: number[]): number[] => {
      // Simple min-max normalization
      const min = Math.min(...features);
      const max = Math.max(...features);
      const range = max - min;
      
      if (range === 0) return features.map(() => 0);
      
      return features.map(value => (value - min) / range);
    }
  };

  constructor(private platform: Platform) { }

  async ngOnInit() {
    await this.loadModel();
    this.loadCSVData();
  }

  ngAfterViewInit() {
    // this.loadMap();
  }

  ionViewDidEnter() {
    this.initMap();
  }

  async loadModel() {
    try {
      this.predictionModel = await tf.loadLayersModel('assets/models/best_lstm_model/model_2.json');
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  loadCSVData() {
    Papa.parse('assets/data/Dataset_Trafic_Routier.csv', {
      download: true,
      header: true,
      complete: (result) => {
        this.processCSVData(result.data);
      }
    });
  }

  processCSVData(rawData: any[]) {
    console.log('Raw CSV data sample:', rawData.slice(0, 3));
    
    this.trafficData = rawData
      .filter(item => { 
        const isValid = item?.latitude_start && item?.longitude_start; 
        if(!isValid) console.warn('Invalid item:', item);
        return isValid;
      })
      .map(item => ({
        coordinates: [
          L.latLng(parseFloat(item.latitude_start), parseFloat(item.longitude_start)),
          L.latLng(parseFloat(item.latitude_end), parseFloat(item.longitude_end))
        ],
        properties: {
          nombre_voitures: parseInt(item.nombre_voitures) || 0,
          vitesse_moyenne: parseFloat(item.vitesse_moyenne) || 0,
          longitude_end: parseFloat(item.longitude_end) || 0,
          latitude_end: parseFloat(item.latitude_end) || 0,
          latitude_start: parseFloat(item.latitude_start) || 0,
          longitude_start: parseFloat(item.longitude_start) || 0,
          distance_km: parseFloat(item.distance_km) || 0,
          incident_signalé: item.incident_signalé === 'true' || item.incident_signalé === true,
          jour_semaine: parseInt(item.jour_semaine) || 0,
          segment_end: item.segment_end || '',
          mois: parseInt(item.mois) || 0,
          gravité: parseInt(item.gravité) || 0,
          météo: item.météo || '',
          humidité: parseFloat(item.humidité) || 0,
          segment_start: item.segment_start || '',
          température: parseFloat(item.température) || 0,
          type_incident: item.type_incident || '',
        }
      }));
    
    console.log(`Processed ${this.trafficData.length} traffic segments`);
    this.updateMap();
  }

  private mapContainer!: HTMLElement;

  initMap() {
    this.mapContainer = document.getElementById('map')!;

    if(!this.mapContainer) {
      console.error('Map container not found!');
      return;
    }


    this.map = L.map(this.mapContainer).setView([5.3599, -4.0083], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Map click handler for route selection
    this.map.on('click', (e: L.LeafletMouseEvent) => this.handleMapClick(e));
  }

  async predictTraffic(segment: TrafficSegment): Promise<PredictionResult> {

    if (!this.predictionModel) {
      console.warn('Prediction model not loaded');
      return { status: 'Modèle non disponible', probability: 0 };
    }

    try { 
      const input = this.prepareModelInput(segment);
      const prediction = this.predictionModel.predict(input) as tf.Tensor;
      const predictionData = await prediction.data();

      const dataArray = Array.from(predictionData);
      const [status, probability] = this.interpretPrediction(dataArray);

      input.dispose();
      prediction.dispose();
      
      const result = { status, probability };
      this.currentPrediction = result;
      this.isPredictionModalOpen = true;

      return result;

    } catch (error) {
      console.error('Error during prediction:', error);
      return { status: 'Erreur de prédiction', probability: 0 };
    }

    
  }

  prepareModelInput(segment: TrafficSegment): tf.Tensor {
    const features = [
      segment.properties.nombre_voitures,
      segment.properties.vitesse_moyenne,
      segment.properties.longitude_end,
      segment.properties.latitude_end,
      segment.properties.latitude_start,
      segment.properties.longitude_start,
      segment.properties.distance_km,
      segment.properties.incident_signalé ? 1 : 0,
      segment.properties.jour_semaine,
      segment.properties.mois,
      segment.properties.gravité,
      segment.properties.humidité,
      segment.properties.température
    ];
    
    const normalizedFeatures = this.preprocessingService.normalize(features);

    const data = new Float32Array(normalizedFeatures);
    return tf.tensor3d(data, [1, 1, normalizedFeatures.length]);
  }
  
  interpretPrediction(predictionData: number[]): [string, number] {
    const probability = predictionData[0] || 0;
    let status = 'Fluide';

    if (probability > 0.7) {
      status = 'Congestionné';
    } else if (probability > 0.4) {
      status = 'Risque de congestion';
    }
    return [status, Math.round(probability * 100)];
  }

  updateMap() {
    if (!this.map) return;

    // Clear existing polylines
    this.map.eachLayer((layer: L.Layer) => {
      if (layer instanceof L.Polyline && !(layer instanceof L.TileLayer)) { 
        this.map.removeLayer(layer);
      };
    });

    // Draw new segments
    this.trafficData.forEach(segment => {
      if (segment.coordinates.length >= 2) { 
        const line = L.polyline(segment.coordinates, {
          color: this.getSegmentColor(segment),
          weight: 5,
          opacity: 0.7
        }).addTo(this.map);

        // Add click handler for predictions
        line.on('click', async (e: L.LeafletMouseEvent) => { 
          L.DomEvent.stopPropagation(e);
          await this.predictTraffic(segment);
        });

        const popupContent = `
          <div>
            <strong>Segment:</strong> ${segment.properties.segment_start} → ${segment.properties.segment_end}<br>
            <strong>Vitesse moyenne:</strong> ${segment.properties.vitesse_moyenne} km/h<br>
            <strong>Nombre de voitures:</strong> ${segment.properties.nombre_voitures}<br>
            <strong>Distance:</strong> ${segment.properties.distance_km} km<br>
            <strong>Incident:</strong> ${segment.properties.incident_signalé ? 'Oui' : 'Non'}
          </div>
        `;
        line.bindPopup(popupContent);
      }
    });
  }

  getSegmentColor(segment: TrafficSegment): string {
    if (segment.properties.incident_signalé) return '#ff0000';
    if (segment.properties.vitesse_moyenne < 30) return '#ffa500';
    return '#00ff00';
  }

  toggleFilterMenu() {
    this.isFilterMenuOpen = !this.isFilterMenuOpen;
  }

  closePredictionModal() {
    this.isPredictionModalOpen = false;
    this.currentPrediction = null;
  }
  
  async calculateOptimalRoute(start: L.LatLng, end: L.LatLng) {
    try {
      const routeSegments = await this.findRouteSegments(start, end);
      const predictions = await Promise.all(
        routeSegments.map(seg => this.predictTraffic(seg))
      );
      this.displayRouteWithPredictions(routeSegments, predictions);
    } catch (error) {
      console.error('Error calculating optimal route:', error);
    }
  }

  private displayRouteWithPredictions(segments: TrafficSegment[], predictions: PredictionResult[]) {
    segments.forEach((seg, i) => {

      if (seg.coordinates.length >= 2) { 
        L.polyline(seg.coordinates, {
          color: this.getColorFromPrediction(predictions[i]),
          weight: 6,
          opacity: 0.8
        }).addTo(this.map);
      }
      
    });
  }

  private getColorFromPrediction(prediction: PredictionResult): string {
    if (prediction.status === 'Congestionné') return '#ff0000';
    if (prediction.status === 'Risque de congestion') return '#ffa500';
    return '#00ff00';
  }

  // Route planning state
  private routeStartPoint: L.LatLng | null = null;
  private routeEndPoint: L.LatLng | null = null;
  private startMarker: L.Marker | null = null;
  private endMarker: L.Marker | null = null;
  private routePolyline: L.Polyline | null = null;
  private isRouteMode = false;

  private handleMapClick(e: L.LeafletMouseEvent) {
    if (!this.isRouteMode) return;

    const clickedPoint = e.latlng;
    console.log('Map clicked at:', clickedPoint);

    if (!this.routeStartPoint) {
      // Set start point
      this.routeStartPoint = clickedPoint;
      
      // Remove existing start marker
      if (this.startMarker) {
        this.map.removeLayer(this.startMarker);
      }
      
      // Add start marker
      this.startMarker = L.marker(clickedPoint, {
        icon: L.divIcon({
          className: 'custom-marker start-marker',
          html: '<div style="background-color: #4CAF50; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">A</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(this.map);
      
      this.startMarker.bindPopup('Point de départ').openPopup();
      
    } else if (!this.routeEndPoint) {
      // Set end point
      this.routeEndPoint = clickedPoint;
      
      // Remove existing end marker
      if (this.endMarker) {
        this.map.removeLayer(this.endMarker);
      }
      
      // Add end marker
      this.endMarker = L.marker(clickedPoint, {
        icon: L.divIcon({
          className: 'custom-marker end-marker',
          html: '<div style="background-color: #F44336; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">B</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(this.map);
      
      this.endMarker.bindPopup('Point d\'arrivée').openPopup();
      
      this.calculateOptimalRoute(this.routeStartPoint, this.routeEndPoint);
      
    } else {
      this.clearRoute();
      this.routeStartPoint = clickedPoint;
      
      this.startMarker = L.marker(clickedPoint, {
        icon: L.divIcon({
          className: 'custom-marker start-marker',
          html: '<div style="background-color: #4CAF50; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">A</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(this.map);
      
      this.startMarker.bindPopup('Point de départ').openPopup();
    }
  }

  private async findRouteSegments(start: L.LatLng, end: L.LatLng): Promise<TrafficSegment[]> {
    console.log('Finding route from', start, 'to', end);

    const relevantSegments: TrafficSegment[] = [];
    const searchRadius = 0.01; // ~1km radius

    // Step 1: Find segments near start point
    const startSegments = this.trafficData.filter(segment => {
      const startPoint = segment.coordinates[0];
      return this.calculateDistance(start, startPoint) < searchRadius;
    });
    
    // Step 2: Find segments near end point
    const endSegments = this.trafficData.filter(segment => {
      const endPoint = segment.coordinates[segment.coordinates.length - 1];
      return this.calculateDistance(end, endPoint) < searchRadius;
    });
    
    // Step 3: Find intermediate segments using simple pathfinding
    const pathSegments = this.findPathBetweenSegments(startSegments, endSegments);

    return pathSegments;
  }

   private findPathBetweenSegments(startSegments: TrafficSegment[], endSegments: TrafficSegment[]): TrafficSegment[] {
    if (startSegments.length === 0 || endSegments.length === 0) {
      return [];
    }
    
    // Simple greedy pathfinding - connect segments that are close to each other
    const path: TrafficSegment[] = [];
    const visited = new Set<string>();
    const connectionRadius = 0.005; // ~500m radius for segment connections
    
    // Start with the first available start segment
    let currentSegment = startSegments[0];
    path.push(currentSegment);
    visited.add(this.getSegmentId(currentSegment));
    
    // Try to reach an end segment
    let attempts = 0;
    const maxAttempts = 20; // Prevent infinite loops
    
    while (attempts < maxAttempts) {
      attempts++;
      
      // Check if we've reached an end segment
      const reachedEnd = endSegments.some(endSeg => 
        !visited.has(this.getSegmentId(endSeg)) &&
        this.segmentsAreConnected(currentSegment, endSeg, connectionRadius)
      );
      
      if (reachedEnd) {
        const endSegment = endSegments.find(endSeg => 
          !visited.has(this.getSegmentId(endSeg)) &&
          this.segmentsAreConnected(currentSegment, endSeg, connectionRadius)
        );
        if (endSegment) {
          path.push(endSegment);
        }
        break;
      }
      
      // Find next connected segment
      const nextSegment = this.findNextConnectedSegment(currentSegment, visited, connectionRadius);
      
      if (!nextSegment) {
        break; // No more connected segments found
      }
      
      path.push(nextSegment);
      visited.add(this.getSegmentId(nextSegment));
      currentSegment = nextSegment;
    }
    
    return path;
  }

  private findNextConnectedSegment(currentSegment: TrafficSegment, visited: Set<string>, radius: number): TrafficSegment | null {
    const currentEnd = currentSegment.coordinates[currentSegment.coordinates.length - 1];
    
    // Find unvisited segments that connect to the current segment
    const candidates = this.trafficData.filter(segment => {
      const segmentId = this.getSegmentId(segment);
      if (visited.has(segmentId)) return false;
      
      const segmentStart = segment.coordinates[0];
      return this.calculateDistance(currentEnd, segmentStart) < radius;
    });
    
    // Prefer segments with better traffic conditions
    candidates.sort((a, b) => {
      const scoreA = this.getSegmentScore(a);
      const scoreB = this.getSegmentScore(b);
      return scoreB - scoreA; // Higher score is better
    });
    
    return candidates[0] || null;
  }

  private segmentsAreConnected(seg1: TrafficSegment, seg2: TrafficSegment, radius: number): boolean {
    const seg1End = seg1.coordinates[seg1.coordinates.length - 1];
    const seg2Start = seg2.coordinates[0];
    return this.calculateDistance(seg1End, seg2Start) < radius;
  }

  private getSegmentScore(segment: TrafficSegment): number {
    let score = 100;
    
    // Penalize slow traffic
    if (segment.properties.vitesse_moyenne < 30) score -= 30;
    else if (segment.properties.vitesse_moyenne < 50) score -= 15;
    
    // Penalize incidents
    if (segment.properties.incident_signalé) score -= 50;
    
    // Penalize high traffic volume
    if (segment.properties.nombre_voitures > 100) score -= 20;
    
    // Consider weather
    if (segment.properties.météo === 'pluie') score -= 10;
    
    return Math.max(0, score);
  }

  private getSegmentId(segment: TrafficSegment): string {
    return `${segment.properties.segment_start}-${segment.properties.segment_end}`;
  }

  private calculateDistance(point1: L.LatLng, point2: L.LatLng): number {
    return point1.distanceTo(point2) / 1000; // Convert to kilometers
  }

  applyFilters(filters: any) {
    this.activeFilters = { ...filters };

     // Filter traffic data based on active filters
    let filteredData = [...this.trafficData];
    
    // Filter by speed
    if (filters.minSpeed !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.vitesse_moyenne >= filters.minSpeed
      );
    }
    
    if (filters.maxSpeed !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.vitesse_moyenne <= filters.maxSpeed
      );
    }
    
    // Filter by traffic volume
    if (filters.minTraffic !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.nombre_voitures >= filters.minTraffic
      );
    }
    
    if (filters.maxTraffic !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.nombre_voitures <= filters.maxTraffic
      );
    }
    
    // Filter by incidents
    if (filters.showIncidents !== undefined) {
      if (!filters.showIncidents) {
        filteredData = filteredData.filter(segment => 
          !segment.properties.incident_signalé
        );
      }
    }
    
    // Filter by weather
    if (filters.weather && filters.weather.length > 0) {
      filteredData = filteredData.filter(segment => 
        filters.weather.includes(segment.properties.météo)
      );
    }
    
    // Filter by day of week
    if (filters.dayOfWeek !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.jour_semaine === filters.dayOfWeek
      );
    }
    
    // Filter by month
    if (filters.month !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.mois === filters.month
      );
    }
    
    // Filter by severity
    if (filters.minSeverity !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.gravité >= filters.minSeverity
      );
    }
    
    // Filter by temperature range
    if (filters.minTemperature !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.température >= filters.minTemperature
      );
    }
    
    if (filters.maxTemperature !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.température <= filters.maxTemperature
      );
    }
    
    // Filter by humidity range
    if (filters.minHumidity !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.humidité >= filters.minHumidity
      );
    }
    
    if (filters.maxHumidity !== undefined) {
      filteredData = filteredData.filter(segment => 
        segment.properties.humidité <= filters.maxHumidity
      );
    }
    
    // Update displayed data
    const originalData = this.trafficData;
    this.trafficData = filteredData;
    this.updateMap();
    
    console.log(`Filtered ${originalData.length} segments to ${filteredData.length} segments`);
  }

  enableRouteMode() {
    this.isRouteMode = true;
    this.clearRoute();
    console.log('Route planning mode enabled. Click on the map to set start and end points.');
  }

  disableRouteMode() {
    this.isRouteMode = false;
    this.clearRoute();
    console.log('Route planning mode disabled.');
  }

  clearRoute() {
    // Remove markers
    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
      this.startMarker = null;
    }
    
    if (this.endMarker) {
      this.map.removeLayer(this.endMarker);
      this.endMarker = null;
    }
    
    // Remove route polyline
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    
    // Reset route points
    this.routeStartPoint = null;
    this.routeEndPoint = null;
  }

  // Filter management methods
  getAvailableFilterOptions() {
    const options = {
      weather: [...new Set(this.trafficData.map(s => s.properties.météo))].filter(w => w),
      incidentTypes: [...new Set(this.trafficData.map(s => s.properties.type_incident))].filter(t => t),
      speedRange: {
        min: Math.min(...this.trafficData.map(s => s.properties.vitesse_moyenne)),
        max: Math.max(...this.trafficData.map(s => s.properties.vitesse_moyenne))
      },
      trafficRange: {
        min: Math.min(...this.trafficData.map(s => s.properties.nombre_voitures)),
        max: Math.max(...this.trafficData.map(s => s.properties.nombre_voitures))
      },
      temperatureRange: {
        min: Math.min(...this.trafficData.map(s => s.properties.température)),
        max: Math.max(...this.trafficData.map(s => s.properties.température))
      },
      humidityRange: {
        min: Math.min(...this.trafficData.map(s => s.properties.humidité)),
        max: Math.max(...this.trafficData.map(s => s.properties.humidité))
      }
    };
    
    this.filterOptions = options;
    return options;
  }

  resetFilters() {
    this.activeFilters = {};
    this.updateMap();
  }


}
