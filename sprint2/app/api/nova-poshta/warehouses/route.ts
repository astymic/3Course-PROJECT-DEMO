import { NextRequest, NextResponse } from 'next/server'

const NP_API = 'https://api.novaposhta.ua/v2.0/json/'
const API_KEY = process.env.NP_API_KEY ?? ''

export async function GET(request: NextRequest) {
    const cityRef = request.nextUrl.searchParams.get('cityRef') ?? ''
    const q = request.nextUrl.searchParams.get('q') ?? ''

    if (!cityRef) return NextResponse.json([])

    try {
        const res = await fetch(NP_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey: API_KEY,
                modelName: 'AddressGeneral',
                calledMethod: 'getWarehouses',
                methodProperties: {
                    CityRef: cityRef,
                    FindByString: q,
                    Limit: 50,
                    TypeOfWarehouseRef: '841339c7-591a-42e2-8233-7a0a00f7a000', // Відділення (не поштомат)
                },
            }),
            next: { revalidate: 300 },
        })
        const data = await res.json()
        return NextResponse.json(data.data ?? [])
    } catch {
        return NextResponse.json([])
    }
}
