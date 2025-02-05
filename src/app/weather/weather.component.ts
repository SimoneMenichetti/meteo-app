import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './weather.component.html',
  styleUrls: ['./weather.component.css']
})
export class WeatherComponent {
  cityName: string = '';
  weatherData: any;
  errorMessage: string = '';
  loading: boolean = false;
  citySuggestions: string[] = [];
  citySuggestionsVisible: boolean = false;  // Variabile per gestire la visibilità dei suggerimenti

  private searchSubject = new Subject<string>();

  constructor(private http: HttpClient) {
    // Ascolta le modifiche all'input della città con debounce per evitare troppe richieste
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(city => this.getCitySuggestions(city))
    ).subscribe(suggestions => {
      this.citySuggestions = suggestions;
      this.citySuggestionsVisible = suggestions.length > 0;  // Mostra i suggerimenti solo se ci sono
    });
  }

  // Funzione per gestire l'input dell'utente e avviare la ricerca dei suggerimenti
  onCityInput() {
    if (this.cityName.length > 2) {
      this.searchSubject.next(this.cityName);
    } else {
      this.citySuggestions = [];
      this.citySuggestionsVisible = false;  // Nascondi i suggerimenti
    }
  }

  // Funzione per gestire la selezione della città e disabilitare i suggerimenti
  selectCity(city: string) {
    this.cityName = city;
    this.citySuggestions = [];
    this.citySuggestionsVisible = false;  // Nascondi i suggerimenti quando si seleziona una città
    this.getWeather();
  }

  // Funzione per ottenere i dati meteo
  getWeather() {
    if (!this.cityName) return;

    const apiKey = environment.weatherApiKey;
    this.loading = true;
    this.errorMessage = '';

    this.http.get(`https://api.openweathermap.org/data/2.5/weather?q=${this.cityName}&appid=${apiKey}&units=metric`)
      .subscribe({
        next: (data) => {
          this.weatherData = data;
          this.loading = false;
        },
        error: (err) => {
          this.errorMessage = 'Errore nel recupero dei dati meteo: ' + err.message;
          this.loading = false;
        }
      });
  }

  // Funzione per ottenere i suggerimenti delle città tramite API
  getCitySuggestions(city: string) {
    return this.http.get<any>(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${city}&limit=5`, {
      headers: {
        'X-RapidAPI-Key': environment.xrapidApiKey, // variabile API per RapidAPI
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    }).pipe(
      switchMap(response => {
        return [response.data.map((result: any) => result.city)];
      })
    );
  }

  // Funzione per nascondere i suggerimenti quando si preme il tasto Enter
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.citySuggestionsVisible = false;  // Nascondi i suggerimenti
      this.getWeather();  // Esegui la ricerca meteo
    }
  }
}
