import { NextRequest, NextResponse } from 'next/server'

const NP_API = 'https://api.novaposhta.ua/v2.0/json/'
const API_KEY = process.env.NP_API_KEY ?? ''
const HAS_KEY = API_KEY && API_KEY !== 'YOUR_NP_API_KEY_HERE'

// Mock warehouses per city for demo mode
const MOCK_WAREHOUSES: Record<string, { Ref: string; Number: string; Description: string }[]> = {
    'mock-kyiv': [
        { Ref: 'wh-kyiv-1', Number: '1', Description: 'вул. Хрещатик, 22' },
        { Ref: 'wh-kyiv-2', Number: '2', Description: 'вул. Велика Васильківська, 100' },
        { Ref: 'wh-kyiv-3', Number: '3', Description: 'просп. Перемоги, 67' },
        { Ref: 'wh-kyiv-4', Number: '4', Description: 'вул. Антоновича, 176' },
        { Ref: 'wh-kyiv-5', Number: '5', Description: 'вул. Борщагівська, 145' },
        { Ref: 'wh-kyiv-6', Number: '6', Description: 'просп. Відрадний, 95' },
        { Ref: 'wh-kyiv-7', Number: '7', Description: 'вул. Оболонська, 34' },
        { Ref: 'wh-kyiv-8', Number: '8', Description: 'вул. Дніпровська набережна, 19' },
    ],
    'mock-kharkiv': [
        { Ref: 'wh-kh-1', Number: '1', Description: 'вул. Сумська, 82' },
        { Ref: 'wh-kh-2', Number: '2', Description: 'вул. Клочківська, 192' },
        { Ref: 'wh-kh-3', Number: '3', Description: 'просп. Московський, 271' },
        { Ref: 'wh-kh-4', Number: '4', Description: 'вул. Героїв Праці, 5а' },
    ],
    'mock-odesa': [
        { Ref: 'wh-od-1', Number: '1', Description: 'вул. Рішельєвська, 15' },
        { Ref: 'wh-od-2', Number: '2', Description: 'просп. Небесної Сотні, 48' },
        { Ref: 'wh-od-3', Number: '3', Description: 'вул. Академіка Корольова, 96' },
    ],
    'mock-lviv': [
        { Ref: 'wh-lv-1', Number: '1', Description: 'вул. Городоцька, 189' },
        { Ref: 'wh-lv-2', Number: '2', Description: 'вул. Шевченка, 312' },
        { Ref: 'wh-lv-3', Number: '3', Description: 'просп. Чорновола, 37' },
    ],
}

function getMockWarehouses(cityRef: string, q: string) {
    const whs = MOCK_WAREHOUSES[cityRef] ?? [
        { Ref: `wh-${cityRef}-1`, Number: '1', Description: 'вул. Центральна, 1' },
        { Ref: `wh-${cityRef}-2`, Number: '2', Description: 'вул. Залізнична, 10' },
        { Ref: `wh-${cityRef}-3`, Number: '3', Description: 'вул. Соборна, 25' },
    ]
    if (!q) return whs
    return whs.filter(w => w.Description.toLowerCase().includes(q.toLowerCase()) || w.Number.includes(q))
}

export async function GET(request: NextRequest) {
    const cityRef = request.nextUrl.searchParams.get('cityRef') ?? ''
    const q = request.nextUrl.searchParams.get('q') ?? ''

    if (!cityRef) return NextResponse.json([])

    if (!HAS_KEY) {
        return NextResponse.json(getMockWarehouses(cityRef, q))
    }

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
                    Limit: 500,
                },
            }),
        })
        const data = await res.json()
        const results = data.data ?? []
        if (results.length === 0) return NextResponse.json(getMockWarehouses(cityRef, q))
        return NextResponse.json(results)
    } catch {
        return NextResponse.json(getMockWarehouses(cityRef, q))
    }
}
