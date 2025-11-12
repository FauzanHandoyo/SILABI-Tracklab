import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, status } = body;

    // Validate data
    if (!nama || !status) {
      return NextResponse.json(
        { error: 'Missing nama or status' },
        { status: 400 }
      );
    }

    // Log the received data
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Asset: ${nama}, Status: ${status}`);

    // TODO: Save to database (Supabase, MongoDB, etc.)
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: { 
        nama, 
        status,
        timestamp 
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve asset list
export async function GET() {
  try {
    // TODO: Fetch from database
    const assets = [
      { nama: 'SILABI_reactor', status: 'DI TEMPAT', lastSeen: new Date().toISOString() }
    ];

    return NextResponse.json({
      success: true,
      data: assets
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}