/* API endpoint for creating a session */
import { redirect } from 'next/navigation'
import { CreateSession, CreateUser } from "@/src/database/db";
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';
import 'dotenv/config'

export async function POST(req: Request) {
    
    const data = await req.json();
    const accessToken : string = data.accessToken;
    const refreshToken : string = data.refreshToken;
    const username : string = data.username;
    
    const sid = await CreateSession(accessToken, refreshToken);
    const host = await CreateUser(username, sid, true);
    
    // return status 201
    return NextResponse.json(
        { sid: sid },
        { status: 201 }
    )
}