# gopro-sync
A Node.js utility for syncing photos and videos from a WiFi-enabled GoPro unit. Uses ```http.get``` to download every entry found on the GoPro's local web server (fixed IP of ```10.5.5.9```), and removes them from the unit if everything succeded.