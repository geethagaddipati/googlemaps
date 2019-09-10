# Install Node.js
To get Node.js, go to nodejs.org.

# Install the Angular CLI
To install the CLI using npm, open a terminal/console window and enter the following command:
npm install -g @angular/cli
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.9.

# Clone the code from GIT
open a terminal/console window and enter the following command:
git clone https://github.com/geethagaddipati/googlemaps.git

# After clone the code from GIT run the below command for node_modules folder
npm install 

# To Run this Application Register and enable the Google Maps APIs first using following link
1. https://developers.google.com/maps/documentation/javascript/get-api-key
2. Open the above link and follow the instructions in it.
3. Login with your gmail account and enable services Maps JavaScript API, Geocoding API, Places API,Distance Matrix API,Directions API,Gelocation API
4. Set the generated key in "app.module.ts" file and "app.component.ts" for key 'apiKey'

## Development server
1Run `ng serve --proxy-config proxy.conf.json` for a dev server(Run with proxy configuration). Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


## Build
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.


NOTE: Check your locations including pincode address.

