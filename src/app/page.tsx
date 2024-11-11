'use client'
import { stringify } from 'querystring';
import { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation'
import { Router } from 'next/router';
import { handleSpotifyAuth } from '@/src/utils';
import 'dotenv/config';
import { GetAccessToken, GetQueue } from '../database/db';

export default function Home() {
  const [guestCode, setGuestCode] = useState(""); // Can be set as Next.js cookie and passed into server side session/[id]/page.tsx
  const [username, setUsername] = useState(""); // Can be set as Next.js cookie and passed into server side session/[id]/page.tsx
  const [sessions, setSessions] = useState<{ session_id: string }[]>([]);

  const router = useRouter();

  
  
  useEffect(() => {
 
    const getSessions = () => {
        console.log("getting sids");
      
        fetch('http://localhost:3000/api/sessionDB/getSessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error(response.statusText);
            }
            return response.json();
          })
          .then((data) => {
            console.log("sids:", data);
            setSessions(data);
          })
          .catch((error) => {
            console.error("error:", error);
          });
      };
    
  getSessions();

  }, []); // Empty dependency array ensures the effect runs only once on mount
  
  return (
    <main className="background flex min-h-screen flex-col items-center justify-between p-24">
      <img src="GMJ-emblem-color.svg" alt="" />
      <div className="options">
        <div className="hostoptions">
            <h1>I'm a host:</h1>
            <form data-testid="host-form">
                <input type="text" placeholder='Username' maxLength={6} name="username" onChange={(e) => setUsername(e.target.value)}/>
            </form>
            <button className="SubmitButton" onClick={() => {
                sessionStorage.setItem("username", username); // change this to a nextjs cookie (server-side)
                sessionStorage.setItem("isHost", "true"); // change this to a nextjs cookie (server-side)
                const client_id : string | undefined = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID; // Spotify developer client id for API calls
                const redirect_uri : string = `http://localhost:3000/api/spotify/getToken`
                const scope : string = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
                handleSpotifyAuth(client_id, redirect_uri, scope);
                }}>
                Host a Jam
            </button>
        </div>
        <div className="divideDiv">
        <hr className="divider"></hr>
        </div>
        
        <div className="guestoptions">
            <h1>I'm a guest:</h1>
            <form data-testid="guest-form">
                <input type="text" placeholder='Guest Code' maxLength={8} name="guestcode"  onChange={(e) => setGuestCode(e.target.value.toUpperCase())}/>
                <input type="text" placeholder='Username' maxLength={25} name="username" onChange={(e) => setUsername(e.target.value)}/>
            </form>
            <button className="SubmitButton" onClick={() => {
                sessionStorage.setItem("username", username);
                sessionStorage.setItem("isHost", "false");
                connectToSession(guestCode, username, router)}}>
                    Join
            </button>
        </div>
        <div className="guestoptions">
          {/* change this css later just used the guestoptions for now */}
          <h1>Available Sessions</h1>
          <ul>
            {sessions.map((sessions, index) => (
              <li key={index} onClick={()=>{
                sessionStorage.setItem("username", "available sessions test");
                sessionStorage.setItem("isHost", "true");
                connectToSession(sessions.session_id, "available sessions test", router)
              }}>{sessions.session_id}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

async function connectToSession(guestCode : string, username : string, router : any) : Promise<void> { 
  try {
    await fetch('api/sessionDB/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
          guestCode: guestCode,
          username: username
      }),
    }).then((response) => {
        if(!response.ok)
            throw Error(response.statusText);

        return response.json();
    }).then((data) => {
        const url = data.url;
        router.push(url);
    })
  }
  catch(e){
    // TODO: Add some error message to user saying that wrong code was entered
    console.error(e);
  }
}

