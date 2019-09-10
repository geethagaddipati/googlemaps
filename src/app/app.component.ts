//app.component.ts
import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { MapsAPILoader } from '@agm/core';
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title: string = 'AGM project';
  latitude: number; // source latitude 
  longitude: number; // source longitude
  zoom: number;
  address: string; // destination address displaying on html page
  dests: any;
  destinations: any[]; // Array of all destination addresses
  radius: number; // radius within which you want nearby places
  apiKey: string; // googlemaps api key
  currentLocation: string; // source current location from where to start
  duration: string; // duration to travel from source to destination
  distance: string; // distance between source and destination in kms
  origin: any; // origin on agm-direction of html to get the direction
  destination: any; // destination on agm-direction html 

  private geoCoder;

  @ViewChild('insearch')
  public insearchRef: ElementRef;

  constructor(
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone,
    private http: HttpClient
  ) {
    this.dests = [];
    this.radius = 10;
    this.destinations = [];
    this.distance = "";
    this.duration = "";
    this.origin = {};
    this.destination = {};
    this.apiKey = "";
  }
  // On selecting radius within which the user wants the destinations
  selectRange(radius: number) {
    if (radius == NaN) {
      this.radius = 10;
    } else {
      this.radius = radius;
    }
    this.destinations = [];
    // console.log(this.radius * 1000, this.currentLocation)
    this.getDestinations()
  }

  // On change of the destination get the 
  changeDest(dest: string) {
    this.address = dest;
    var target_lat = "";
    var target_lng = "";
    // console.log('source: ', this.latitude, this.longitude);
    // console.log(this.dests)
    for (let idx in this.dests) {//.forEach(element => {
      let element = this.dests[idx];
      if (element['name'] == dest) {
        // console.log(">>>>",element);
        this.distance = element['distance'];
        this.duration = element['duration'];
        target_lat = element['latitude'];
        target_lng = element['longitude'];
        break;
      }
    };
    this.origin = { lat: this.latitude, lng: this.longitude };
    this.destination = { lat: target_lat, lng: target_lng };
  }

  // Get Current Location Coordinates
  private setCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.origin = { lat: this.latitude, lng: this.longitude };
        // console.log(this.origin)
        this.zoom = 8;
        // console.log(position)
        this.getAddress();
      });
    }
  }

  // To get all the destinations from given source
  getDestinations() {
    var url = "?location=" + this.latitude + "," + this.longitude + "&radius=" + (this.radius * 1000) + "&keyword=&key=" + this.apiKey;
    // console.log(url);
    var self = this;
    this.destinations = [];

    // API call to get all the nearby places
    this.http.get("/api" + url).subscribe(response => {
      // on getting successful response from nearby search
      // console.log("---", response);
      response['results'].forEach(loc => {
        this.destinations.push(loc['geometry']['location'])
      });

      // DistanceMatrixService is to find the distance and traveltime
      var service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [this.currentLocation],
          destinations: this.destinations,
          travelMode: google.maps.TravelMode.DRIVING
        }, callback);

      // Success callback
      function callback(response, status) {
        // console.log(response, status);
        self.dests = [{ 'name': '---- Select Your Destiny ----' }];
        // var count = 1;
        // Check if the data exists
        if (response['rows'].length) {
          var dest_elements = response['rows'][0]['elements'];
          for (let idx in dest_elements) {
            if (dest_elements[idx]['status'] == 'OK' && dest_elements[idx]['distance']['value']) {
              // console.log(response['destinationAddresses'][idx], dest_elements[idx])
              self.dests.push({
                'name': response['destinationAddresses'][idx],
                'distance': dest_elements[idx]['distance']['text'],
                'duration': dest_elements[idx]['duration']['text'],
                'latitude': self.destinations[idx]['lat'],
                'longitude': self.destinations[idx]['lng']
              });
              // Break the loop after 7 results
              // if (count == 7) {
              //   break;
              // } else {
              //   count++;
              // }

            }
          }
        }
      }
    },
      err => {
        console.log("Error in google API", err);
        // callback([method, 403, err])
      });
  }

  // Get the address from the given latitude and longitude 
  getAddress() {
    this.destinations = [];
    // Get address based on latitude and longitude
    this.geoCoder.geocode({ 'location': { lat: this.latitude, lng: this.longitude } }, (results, status) => {
      // console.log('>>>>>', results[0].formatted_address, latitude, longitude);
      this.currentLocation = results[0].formatted_address;
      // console.log("++++++", this.currentLocation, results);
      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 12;
          this.getDestinations();
        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }

    });
  }

  ngOnInit() {
    //load Places Autocomplete
    this.mapsAPILoader.load().then(() => {
      this.setCurrentLocation();
      this.geoCoder = new google.maps.Geocoder;
      // var self = this;
      let autocomplete1 = new google.maps.places.Autocomplete(this.insearchRef.nativeElement, {
        types: []
      });

      // On change of the source address which is autocompleted
      autocomplete1.addListener("place_changed", () => {
        this.ngZone.run(() => {

          //get the place result
          let place: google.maps.places.PlaceResult = autocomplete1.getPlace();
          // console.log(place)

          // verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          // Get the source location address, latitude and longitude
          this.currentLocation = place.formatted_address;
          console.log(this.currentLocation, place.geometry.location.lat(), place.geometry.location.lng())
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.getDestinations()

          // this.getGeoLocation(self.currentLocation)

        });
      });
    });
  }

}
