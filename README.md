Privacy Butler

Privacy Butler is a research project at the Oxford Internet Institute. The tool is designed to give privacy predictively, based on past actions and actions of similar users. The Privacy Butler client is a modified version of Electronic Frontier Foundation's Privacy Badger, which is a modified version of Adblock PLus.  Following Privacy Badger's heurstic blocking, the tool first sends Do-Not-Track request headers and then evaluates the probability that the third party script is disregarding it. If the likelihood, determine by the algorithm, is sufficiently high, the tool blocks the tracker. Additionally, EFF also maintains a whitelist of domains that are known to add useful functions to web sites, and in cases where blocking is likely to result in broken features, the tool limits itself to blocking the cookies.

Privacy Butler modifies EFF's code in two ways. First, it implements a different UI that emphasizes the choices the user makes about how much privacy they want on each website. Unlike other tools, it's focus is on the data (which may or may not be "sensitive") and not on the trackers. It gives the user four choices to indicate levels of concern ("Don't care", "Fine, but no tracking", "No one should know", and "NO ONE") and then implements gradations of privacy protection in response.

If the user chooses "Don't Care," Privacy Butler allows tracking to occur. If the user chooses "Fine, but no tracking", Privacy Butler runs Privacy Badger as originally implemented in the alpha version. If the user chooses "No one should know", Privacy BUtler runs a modified version that blocks all third party domains. Last, if the user chooses "NO ONE", Privacy BUtler runs Badger and warns the user to use a VPN.


Privacy Butler saves the user's choices and sends them to a prediction server under an anonymous user if, which currently only saves the data in a SQL database. As more data is gathered, a model will be trained and the user will have the choice to receive predicted privacy protection, in addition to the ones they set themselves.


Technical Notes:

At it's heart, Privacy Butler is Adblock Plus, focused around adblockplus.lib, run with EFF's heuristic blocking, found in heuristicblocking.js and webrequest.js, which implements the actual blocking. Privacy Butler modifications can be found in background.js and popup,js, where the user choice is implemented via the logic above. These choices are saved, retrieved, and sent to the server in userchoices.js.


##License
Privacy Butler is licensed under the GPLv3, as are Privacy Badger and Adblock PLus, which also hold licenses.
