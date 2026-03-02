
Every tsx file in tabs (excluding _layout) is a page, each of them needs to have this code, but only index needs the extra login information that it has

# INSTRUCTIONS ON HOW TO USE THE SPOTIFY API IN A PAGE


paste the following code into your page file. you can use it to convert the response sample from the spotify api website to an object VALUE. 


# IMPORTANT!!!! ONLY COPY WHATS INSIDE OF THE ```js, ``` BRACKETS


[-----------------------------------------------------------]
#	IMPORT STATEMENTS:
```js
import React, { useEffect , useState } from "react";
import { useSpotify } from "../../context/SpotifyContext";


//the following import statements only need to be in index (so you dont need 
// them), but i'm just putting them here for documentation
import { useSpotifyAuth } from "../../auth/spotifyAuth";
import { exchangeCodeForToken, getUserProfile} from "../../services/spotifyApi";

```
[-----------------------------------------------------------]
# EXPORT STATEMENTS:
	
these go right at the top of the "export default function [pagename]()" 
functions. any time it says VALUE, change that to the name of the object 
you are getting

```js
	const { token, setToken } = useSpotify(); //retrieves the token
	const [VALUE, setVALUE] = useState<any | null>(null); 

	useEffect(() => {
		if (!token) return; //returns if there is no token

		fetch('INSERT URL SHOWN IN REQUEST SAMPLE', {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(async res => {
				if (res.status === 204) return null;
				return res.json();
			})
			.then(data => setVALUE(data)) //set object
			.catch(err => console.error(err));
	}, [token]);
```
[---------------------------------------------------------]
# TYPES:
[optional]
if you want to define only specific parts of the object (or if you get the error caused by using 'any' instead of a defined Type)

```js
	type typeName = {
		value1: type,
		value2: type,
		value3: {
			value3A: type,
			value3B: type,
		}
	}
```
this reflects the structure of the response sample on the api website (you can actually even copy/paste it, but you need to remove all the quotations "")
