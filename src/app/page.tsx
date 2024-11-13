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
  const [sessions, setSessions] = useState<{
    session_id: string;
    host_name: string;
    user_count: number;
    users: { user_id: string; username: string }[];
  }[]>([]);

  const router = useRouter();

  useEffect(() => {

    const getSessions = () => {
      console.log("getting sids and hosts");

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
          console.log("sids and hosts:", data);

          //this is so cool holy shit :OOOOOO
          const sessiondata = data.map((sidrow : any) => ({
            ...sidrow,
            users: sidrow.users ?? [] // If users is null, it will be replaced with an empty array
          }));

          console.log("updated data: ", sessiondata)
          
          setSessions(sessiondata); 
        })
        .catch((error) => {
          console.error("error:", error);
        });
    };

    getSessions();

    
  }, []); // Empty dependency array ensures the effect runs only once on mount

  const [session, setSession] = useState("");
  const [formusername, setFormUsername] = useState("");
  const [formpassword, setFormPassword] = useState("");

  const handleSessionClick = (sid: any) => {
    setSession(sid);
    setFormUsername("");
    setFormPassword("");
  };

  const handleFormSubmit = (e: any) => {
    e.preventDefault();
    if(session !== formpassword){
      console.log("not the right password")
      setSession("");
      return
    }
    sessionStorage.setItem("username", formusername);
    //always set this to false because the form only applies to joining an existing session
    sessionStorage.setItem("isHost", "false");
    connectToSession(session, formusername, router);

    setSession("");
  };

  const [hoverSessionId, setHoverSessionId] = useState("");

  const handleMouseEnter = (event : any, sid : string) => {
    setHoverSessionId(sid); // displays the popup for that sid
  };

  const handleMouseLeave = () => {
    setHoverSessionId("");
  };

  return (
    <main className="background flex min-h-screen flex-col items-center justify-between p-24">
      <img src="GMJ-emblem-color.svg" alt="" />
      <div className="options">
        <div className="hostoptions">
          <h1>I'm a host:</h1>
          <form data-testid="host-form">
            <input type="text" placeholder='Username' maxLength={6} name="username" onChange={(e) => setUsername(e.target.value)} />
          </form>
          <button className="SubmitButton" onClick={() => {
            sessionStorage.setItem("username", username); // change this to a nextjs cookie (server-side)
            sessionStorage.setItem("isHost", "true"); // change this to a nextjs cookie (server-side)
            const client_id: string | undefined = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID; // Spotify developer client id for API calls
            const redirect_uri: string = 'http://localhost:3000/api/spotify/getToken'
            const scope: string = 'user-read-currently-playing user-read-playback-state user-modify-playback-state';
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
            <input type="text" placeholder='Guest Code' maxLength={8} name="guestcode" onChange={(e) => setGuestCode(e.target.value.toUpperCase())} />
            <input type="text" placeholder='Username' maxLength={25} name="username" onChange={(e) => setUsername(e.target.value)} />
          </form>
          <button className="SubmitButton" onClick={() => {
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("isHost", "true");
            connectToSession(guestCode, username, router) //stand in password until implemeneted
          }}>
            Join
          </button>
        </div>


        <div className="guestoptions">
          <h1>Available Sessions</h1>
          <ul>
            {sessions.map((session, index) => (
              <div key={index}> {/* figure out later what this would actually look like */}
                <li key={`session-title-${session.session_id}`}
                    onClick={() => handleSessionClick(session.session_id)}
                    style={{ display: 'inline', marginRight: '10px' }}>
                  {/* user count could be set on a session start(session options form?) */}
                  {`${session.host_name}'s session => `}
                </li>
                <li key = {`user-count-${session.session_id}`} 
                    onMouseEnter={(event) => handleMouseEnter(event, session.session_id)}
                    onMouseLeave={() => handleMouseLeave()}
                    style={{ display: 'inline', marginRight: '10px' }}>
                  {`users: ${session.user_count}/10`}
                </li>
                {hoverSessionId===session.session_id && (
                   <div
                   className={`popup-${session.session_id}`}
                   style={{
                     position: 'absolute',
                     top: '',
                     left: `500px`,
                     backgroundColor: 'rgba(0, 0, 0, 0.75)',
                     color: 'white',
                     padding: '20px',
                     borderRadius: '20px',
                     textAlign: 'center',
                   }}
                 >
                  {/* THERE IS DISCREPENCY BETWEEN THE USERS DISCONNECTING AND ACTUAL EXISTING USERS - DATABASE AND BACKEND PROBLEM */}
                    <div>{`host: ${session.host_name}`}</div>
                    {session.users.map((user, index) => (
                      <div key={index}>{`user${user.user_id}: ${user.username}`}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </ul>

          <div style={{ marginTop: '20px' }}> {/*20px gap just because it makes it easier to look at*/}
            {session !== "" && (
              <form onSubmit={handleFormSubmit}>
                <h2>{`Join Session ${session}'s session`}</h2> {/* CHANGE THIS TO NOT BE THE CODE THIS IS ONLY FOR DEBUGGING */}
                <label>
                  <div>
                    Username:
                    <input
                      type="text"
                      value={formusername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      required
                    />
                  </div>
                </label>
                <label>
                  <div>
                    Password:
                    <input
                      type="text"
                      value={formpassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                    />
                  </div>
                </label>
                <button type="submit">Join</button>
              </form>
            )}
          </div>
        </div>


      </div>
    </main>
  );
}

async function connectToSession(guestCode: string, username: string, router: any): Promise<void> {
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
      if (!response.ok) {
        return response.json().then((errorData) => {
            console.error("error:", errorData.message);
        })
      }

      return response.json();
    }).then((data) => {
      const url = data.url;
      router.push(url);
    })
  }
  catch (e) {
    // TODO: Add some error message to user saying that wrong code was entered
    console.error(e);
  }
}

