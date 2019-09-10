import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { MapsAPILoader, MouseEvent } from '@agm/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title: string = 'AGM project';
  latitude: number;
  longitude: number;
  zoom: number;
  address: string;
  dests: any;
  destinations: any;
  radius: number;
  apiKey: string;
  currentLocation: string;
  duration: string;
  distance: string;
  origin: any;
  destination: any;

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
    this.apiKey = "";//Add your generated API key here
  }

  selectRange(radius: number) {
    if (radius == NaN) {
      this.radius = 10;
    } else {
      this.radius = radius;
    }
    //getted from binding
    // console.log(this.radius * 1000, this.currentLocation)
    this.getGeoLocation(this.currentLocation);
  }

  changeDest(dest: string) {
    this.address = dest;
    var target_lat = "";
    var target_lng = "";
    console.log('source: ', this.latitude, this.longitude);
    // console.log(this.dests)
    // var self = this;
    this.dests.forEach(element => {
      if (element['name'] == dest) {
        // console.log(">>>>",element);
        this.distance = element['distance'];
        this.duration = element['duration'];
        target_lat = element['latitude'];
        target_lng = element['longitude'];
      }
    });
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
        this.getAddress(this.latitude, this.longitude);
      });
    }
  }


  markerDragEnd($event: MouseEvent) {
    // console.log($event);
    this.latitude = $event.coords.lat;
    this.longitude = $event.coords.lng;
    this.getAddress(this.latitude, this.longitude);
  }

  setMarker($event) {
    // console.log("----",$event, this.insearchRef.nativeElement.value);
    this.getGeoLocation($event.target.value);
  }

  getGeoLocation(address: string): void {
    // console.log('Getting address: ', address);
    var geocoder = new google.maps.Geocoder();
    var self = this;
    geocoder.geocode({ 'address': address }, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        self.latitude = results[0].geometry.location.lat();
        self.longitude = results[0].geometry.location.lng();
        // console.log("===",address, results, self.latitude, self.longitude);
        self.getAddress(self.latitude, self.longitude);
      }
    });
  }

  getAddress(latitude, longitude) {
    var self = this;
    this.destinations = [];
    // Get address based on latitude and longitude
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results, status) => {
      // console.log('>>>>>', results[0].formatted_address, latitude, longitude);
      self.currentLocation = results[0].formatted_address;
      // new google.maps.places.PlacesService(MapsAPILoader)
      var url = "?location=" + latitude + "," + longitude + "&radius=" + (self.radius * 1000) + "&keyword=&key=" + this.apiKey;
      console.log(url)
      // API call to get all the nearby places
      this.http.get("/api" + url).subscribe(response => {
        // on getting successful response from nearby search
        // console.log("---", response);
        // self.destinations = [];
        response['results'].forEach(loc => {
          // console.log("loc name:",loc['name'])
          self.destinations.push(loc['geometry']['location'])
        });
        var origin = results[0].formatted_address;

        // DistanceMatrixService is to find the distance and traveltime
        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [origin],
            destinations: self.destinations,
            travelMode: google.maps.TravelMode.DRIVING
          }, callback);

        // Success callback
        function callback(response, status) {
          // console.log(response);
          self.dests = [{ 'name': '---- Select Your Destiny ----' }];
          var count = 1;
          var dest_elements = response['rows'][0]['elements'];
          for (var idx in dest_elements) {
            if (dest_elements[idx]['status'] == 'OK' && dest_elements[idx]['distance']['value']) {
              console.log(response['destinationAddresses'][idx], dest_elements[idx])
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
      },
        err => {
          console.log("POST call in error", err);
          // callback([method, 403, err])
        },
        () => {
          // console.log("The POST observable is now completed.");
        });

      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 12;
          this.address = results[0].formatted_address;
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
      let autocomplete1 = new google.maps.places.Autocomplete(this.insearchRef.nativeElement, {
        types: []
      });
      autocomplete1.addListener("place_changed", () => {
        this.ngZone.run(() => {
          //get the place result
          let place: google.maps.places.PlaceResult = autocomplete1.getPlace();
          //verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }
        });
      });
    });
  }

}
