Lakers Basketball Court – HW05

Team Members

Ilai Meyer — student ID 307927921

##How to Run:

There are two options to run the program. The first option is clearly easier but make sure to have good internet connection and usually works best on chrome.
1) Run in pages on GitHub, enter the URL into the browser - https://ilaimeyer.github.io/Basketball-Court/
2) Clone the repository and run a local server.
   a) Clone the repository.
   b) On the root folder run node index.js (make sure you have node installed).
   c) after the server is running and listening to port 8000 go to the browser and enter URL - http://localhost:8000.

##Additional Features Implemented:

In addition to the baseline requirements from HW05, the following extras were implemented:

Realistic net – The net uses intermediate rings and multiple strands rather than simple lines, preparing it for realistic animation.
Camera presets – Pressing C cycles through four predetermined viewpoints (overhead, opposite baseline and behind each basket), regardless of orbit‑control state.
Lakers‑themed environment – Purple sidelines, blue bases, and Lakers logos on alternating court halves.
Improved lighting – Multiple directional lights are placed symmetrically to better simulate arena lighting, in addition to ambient light.
Full court markings - all the key markings and free throw lines are implemented in the court.
Textures - the court itself and the basketball have textures imported, the basketball uses bump mapping to get the normals for the basketball itself.

##Known Issues / Limitations:

External textures required – The basketball uses a colour map and bump map that must be placed in the project directory (basketball.png and basketballBump.png). Without these files, the ball will appear untextured.
also the Lakers logos and the wooden court floor are textures and their files are in the repository, without them it will look missing.
Score and controls UI are placeholders – The score display and controls hint containers are created and styled but do not update during HW05. Interactive ball movement, scoring logic, and net animation will be implemented in HW06.

##External Assets Used:

Wood floor texture – Sourced from a free texture website (loaded as wood.jpg) and tiled on the court surface. URL for website - https://ambientcg.com.
Lakers logo – Taken from a general web image search (loaded as Laker.PNG) on google.
Basketball diffuse and bump maps – From carloschapeton.com as referenced in a CSUB project page
cs.csubak.edu and saved locally as basketball.png and basketballBump.png. These textures provide the orange coloration and bump pattern for the ball.
