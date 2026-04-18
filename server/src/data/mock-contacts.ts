// server/src/data/mock-contacts.ts
// Mock land parcel owner contacts — route-specific, illustrative only.
// All data is fictional. Keyed by route ID for PDF export.

export interface MockContact {
  ownerName: string;
  county: string;
  acreage: number;
  parcelType: string;
  phone: string;
  email: string;
}

export const mockContacts: Record<'A' | 'B' | 'C', MockContact[]> = {
  A: [
    { ownerName: 'Reeves County Ranch Holdings LLC', county: 'Reeves', acreage: 4280, parcelType: 'Private Ranch', phone: '(432) 555-0181', email: 'land@rcranch.example' },
    { ownerName: 'Pecos Basin Agricultural Trust', county: 'Reeves', acreage: 1840, parcelType: 'Agricultural', phone: '(432) 555-0142', email: 'trust@pbagri.example' },
    { ownerName: 'Ward County Grazing Association', county: 'Ward', acreage: 6100, parcelType: 'Grazing Lease', phone: '(432) 555-0193', email: 'ward.grazing@example.com' },
    { ownerName: 'R.D. Fielder Family Partnership', county: 'Ward', acreage: 920, parcelType: 'Agricultural', phone: '(432) 555-0167', email: 'rdfielder@example.com' },
    { ownerName: 'Winkler Energy Lands Inc.', county: 'Winkler', acreage: 2350, parcelType: 'Industrial/Energy', phone: '(432) 555-0128', email: 'landmgmt@winklerenergy.example' },
    { ownerName: 'Crane County Livestock LLC', county: 'Crane', acreage: 3760, parcelType: 'Livestock', phone: '(432) 555-0109', email: 'crane.livestock@example.com' },
    { ownerName: 'McCulloch County Timberland Partners', county: 'McCulloch', acreage: 1120, parcelType: 'Timberland', phone: '(325) 555-0174', email: 'mcp@example.com' },
    { ownerName: 'Upton County Land & Cattle', county: 'Upton', acreage: 5020, parcelType: 'Ranch/Cattle', phone: '(432) 555-0136', email: 'uptonland@example.com' },
    { ownerName: 'State of Texas General Land Office — Pecos Parcel', county: 'Pecos', acreage: 8800, parcelType: 'State Land', phone: '(512) 463-5001', email: 'glo@example.state.tx.us' },
  ],
  B: [
    { ownerName: 'Midland Basin Properties LLC', county: 'Midland', acreage: 1480, parcelType: 'Private Ranch', phone: '(432) 555-0212', email: 'mbp@midlandbasin.example' },
    { ownerName: 'Ector County Ranchlands', county: 'Ector', acreage: 2640, parcelType: 'Agricultural', phone: '(432) 555-0233', email: 'ector.ranch@example.com' },
    { ownerName: 'Andrews Energy Partners', county: 'Andrews', acreage: 3190, parcelType: 'Industrial/Energy', phone: '(432) 555-0256', email: 'land@andrewsenergy.example' },
    { ownerName: 'Dawson County Farm Bureau Trust', county: 'Dawson', acreage: 760, parcelType: 'Agricultural', phone: '(806) 555-0217', email: 'dawsonfbt@example.com' },
    { ownerName: 'Nolan County Agricultural Holdings', county: 'Nolan', acreage: 5480, parcelType: 'Agricultural', phone: '(325) 555-0228', email: 'nolan.ag@example.com' },
    { ownerName: 'T&P Land Survey Block 42 Partnership', county: 'Nolan', acreage: 2880, parcelType: 'Private Ranch', phone: '(325) 555-0245', email: 'tpblock42@example.com' },
    { ownerName: 'Mitchell County Cattlemen Inc.', county: 'Mitchell', acreage: 4100, parcelType: 'Livestock', phone: '(325) 555-0261', email: 'mitchellcattle@example.com' },
    { ownerName: 'State of Texas General Land Office — Permian Parcel', county: 'Midland', acreage: 7200, parcelType: 'State Land', phone: '(512) 463-5001', email: 'glo@example.state.tx.us' },
  ],
  C: [
    { ownerName: 'Edwards Plateau Ranch Holdings', county: 'Edwards', acreage: 6820, parcelType: 'Private Ranch', phone: '(830) 555-0312', email: 'eprh@example.com' },
    { ownerName: 'Sutton County Land & Wildlife Trust', county: 'Sutton', acreage: 3440, parcelType: 'Conservation Easement', phone: '(325) 555-0327', email: 'sclwt@example.com' },
    { ownerName: 'Kimble County Livestock LLC', county: 'Kimble', acreage: 2180, parcelType: 'Livestock', phone: '(325) 555-0341', email: 'kimble.livestock@example.com' },
    { ownerName: 'Menard County Agricultural Partnership', county: 'Menard', acreage: 1560, parcelType: 'Agricultural', phone: '(325) 555-0358', email: 'menardap@example.com' },
    { ownerName: 'Real County Ranching Inc.', county: 'Real', acreage: 4200, parcelType: 'Ranch/Cattle', phone: '(830) 555-0369', email: 'realranch@example.com' },
    { ownerName: 'Bandera County Hill Country Properties', county: 'Bandera', acreage: 890, parcelType: 'Private Ranch', phone: '(830) 555-0384', email: 'bchcp@example.com' },
    { ownerName: 'Kerr County Conservation District', county: 'Kerr', acreage: 2760, parcelType: 'Conservation', phone: '(830) 555-0397', email: 'kccd@example.com' },
    { ownerName: 'Gillespie County Agricultural Trust', county: 'Gillespie', acreage: 1340, parcelType: 'Agricultural', phone: '(830) 555-0413', email: 'gcagri@example.com' },
    { ownerName: 'State of Texas General Land Office — Edwards Parcel', county: 'Edwards', acreage: 9600, parcelType: 'State Land', phone: '(512) 463-5001', email: 'glo@example.state.tx.us' },
    { ownerName: 'Mason County Ranching Partners', county: 'Mason', acreage: 3080, parcelType: 'Ranch/Cattle', phone: '(325) 555-0426', email: 'masonranch@example.com' },
  ],
};
