N-tier - folder structure

worker
  - all heavy CPU processing that might block the screen 
    - Machine Learning processing
    - Data processing
    - for loops, crypto
    - also can call the service layer to process business rules!

service 
  - all external APIs, Database connections, everything that goes online (outside)
  - all business rules
view
  - all interation with the DOM. The only one that can change interface
controller 
  - intermediates the communication between business rules (services layer, or workers layer, if avaible) and presentation (views layer)
index.js
  - it's who can import modules
  - creates instances and calls the "initialize" function
  - it's the startup!