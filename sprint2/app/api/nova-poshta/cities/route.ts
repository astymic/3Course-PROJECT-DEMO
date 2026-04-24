import { NextRequest, NextResponse } from 'next/server'

const NP_API = 'https://api.novaposhta.ua/v2.0/json/'
const API_KEY = process.env.NP_API_KEY ?? ''
const HAS_KEY = API_KEY && API_KEY !== 'YOUR_NP_API_KEY_HERE'

// Mock cities for demo when no API key configured
const MOCK_CITIES: { Ref: string; Description: string }[] = [
    { Ref: 'mock-kyiv', Description: 'Київ' },
    { Ref: 'mock-kharkiv', Description: 'Харків' },
    { Ref: 'mock-odesa', Description: 'Одеса' },
    { Ref: 'mock-lviv', Description: 'Львів' },
    { Ref: 'mock-dnipro', Description: 'Дніпро' },
    { Ref: 'mock-zaporizhzhia', Description: 'Запоріжжя' },
    { Ref: 'mock-vinnytsia', Description: 'Вінниця' },
    { Ref: 'mock-poltava', Description: 'Полтава' },
    { Ref: 'mock-sumy', Description: 'Суми' },
    { Ref: 'mock-kherson', Description: 'Херсон' },
]

export async function GET(request: NextRequest) {
    const q = (request.nextUrl.searchParams.get('q') ?? '').toLowerCase()

    if (!HAS_KEY) {
        // Return mock cities filtered by query
        const filtered = q.length >= 2
            ? MOCK_CITIES.filter(c => c.Description.toLowerCase().startsWith(q))
            : MOCK_CITIES
        return NextResponse.json(filtered)
    }

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
        })
        const data = await res.json()
        return NextResponse.json(data.data ?? [])
    } catch {
        return NextResponse.json(MOCK_CITIES.filter(c => c.Description.toLowerCase().startsWith(q)))
    }
}
