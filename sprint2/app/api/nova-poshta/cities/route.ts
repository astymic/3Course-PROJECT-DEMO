import { NextRequest, NextResponse } from 'next/server'

const NP_API = 'https://api.novaposhta.ua/v2.0/json/'
const API_KEY = process.env.NP_API_KEY ?? ''

export async function GET(request: NextRequest) {
    const q = request.nextUrl.searchParams.get('q') ?? ''

    try {
        const res = await fetch(NP_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: API_KEY,
                modelName: 'Address',
                calledMethod: 'getCities',
                methodProperties: { FindByString: q, Limit: 10 },
            }),
            next: { revalidate: 300 }, // Cache 5 min
        })
        const data = await res.json()
        return NextResponse.json(data.data ?? [])
    } catch {
        return NextResponse.json([])
    }
}
