This software is my Thesis for the Department of Electrical And Computer Engineering at the University Of Thessaly

Title of Thesis :
Υλοποίηση και οπτικοποίηση βασικών αλγορίθμων
για εκπομπή, ομαδοποίηση κόμβων και έλεγχο
τοπολογίας σε ασύρματα ad hoc δίκτυα

Implementation and visualization of algorithms
for broadcasting, clustering and topology control
in wireless ad hoc networks

Software Purpose :
Visually aid the professor's teaching and students' studying of 
the Ad Hoc Wireless Networks algorithms. The algorithms supported are:
* Wu & Li
* Multipoint Relays
* DCA clusters
* Max Min D Cluster
* MIS (Maximal Independent Set)
* LMST graph
* RNG graph
* GG graph
These algorithms are based on the papers mentioned in "References" below.

Functionality :
The users can construct a wireless network represented by
a graph, with graph manipulating tools. Then, they can choose
from a list of algorithms and execute them on the network that
they created. The results of each step will be represented both 
by visual changes in the graph and explanatory text. They will
have the ability to save the created network and load it again
when they wish. 

Technical :
This is a Node.js/Express.js Web App with Handlebars as the templating engine. The graphs are made with Joint.js
The app starts by executing the adHocEd.js file with Node's command: "node adHocEd.js" (or "nodejs adHocEd.js" for some systems)
The server runs on localhost:3000. For setup, appropriate changes should be made in the /Client/JavaScript/server_url.js file
Use the "npm install" command to automatically install the dependencies
    - Code Structure : The code is divided in the Client code and the Server code, in
        their respective folders.
        The Client code has the html templates with their Css, the
        JavaScript folder which contains .js files that handle user interaction
        with the web page and the Images and Fonts folders.
        The Server code has the Algorithm related files in a corresponding
        folder, to separate them from its core files. 
    - Databases : 
        There are two databases, one for the app and one for sessions, that can be recreated by
        simply running the /Database/create_db.sql script. The table where the sessions are stored is automatically 
        created when the application starts from within the app, if it doesn’t already exist. To change the settings 
        of the connection to these two databases, edit the dbConfig object in /Database/queries.js for the users and 
        the sessionStoreConfig object in /Database/sessions.js for the sessions.

Algorithm References :
* Wu & Li algorithm : "On Calculating Connected Dominating Set for Efficient Routing in Ad Hoc Wireless Networks"
by Jie Wu and Hailan Li
* Multipoint Relays : "Computing connected dominated sets with multipoint relays" by Cedric Adjih, Philippe Jacquet, 
Laurent Viennot
* DCA clusters : "On the Complexity of Clustering Multi-Hop Wireless Networks" by Stefano Basagni
* Max-Min D-Cluster : "Max-Min D-Cluster Formation in Wireless Ad Hoc Networks" by Alan D. Amis, Ravi Prakash, 
Thai H.P. Vuong, Dung T. Huynh 
and "On multihop clusters in wireless sensor networks" by Alexandre Delye, Michel Marot and Monique Becker
* Maximal Independent Set : "Distributed Construction of Connected Dominating Set in Wireless Ad Hoc Networks" by
Peng-Jun Wan, Khaled M. Alzoubi, Ophir Frieder
and "Propagation and Leader Election in a Multihop Broadcast Environment" by Israel Cidon and Osnat Mokryn
* LMST : "Design and Analysis of an MST-Based Topology Control Algorithm" by Ning Li, Jennifer C. Hou, Lui Sha
* RNG : "Localized LMST and RNG based minimum-energy broadcast protocols in ad hoc networks" by 
Julien Cartigny, Francois Ingelrest, David Simplot-Ryl, Ivan Stojmenovic
* GG : "Distributed Topology Control in Wireless Ad Hoc Networks using β-Skeletons" by Manvendu Bhardwaj, Satyajayant Misra and Guoliang Xue