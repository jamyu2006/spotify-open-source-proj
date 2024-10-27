/* API endpoint for connecting to a session */
import { CreateUser, GetSessions, VerifyGuestCode } from '../../../../database/db'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server';
import 'dotenv/config'
import { SymbolDisplayPartKind } from 'typescript';

export async function POST(req: Request) {
    let sids;
    try {
        sids = await GetSessions();
    } catch (e) {
        return NextResponse.json(
            { status: 500, error: 'Failed to retrieve sessions' },
            { status: 500 }
        );
    }

    console.log("database recieved sids: ", sids);
    
    // Return sids wrapped in a JSON response
    return NextResponse.json(sids);
}