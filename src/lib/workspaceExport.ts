export async function exportToGoogleSheets(
  accessToken: string,
  title: string,
  headers: string[],
  rows: any[][]
): Promise<{ spreadsheetUrl: string; spreadsheetId: string }> {
  // Convert standard cells to rowData
  const rowDataList = [
    // Header Row
    {
      values: headers.map(h => ({
        userEnteredValue: { stringValue: h },
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 10, foregroundColor: { red: 1, green: 1, blue: 1 } },
          backgroundColor: { red: 0.08, green: 0.44, blue: 0.23 }, // Forest green
          horizontalAlignment: 'CENTER'
        }
      }))
    },
    // Data Rows
    ...rows.map((row) => ({
      values: row.map(val => {
        const isNum = typeof val === 'number';
        return {
          userEnteredValue: isNum ? { numberValue: val } : { stringValue: String(val) },
          userEnteredFormat: {
            textFormat: { fontSize: 10 },
            horizontalAlignment: isNum ? 'RIGHT' : 'LEFT'
          }
        };
      })
    }))
  ];

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: title
      },
      sheets: [
        {
          properties: {
            title: 'Rekap Laporan'
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: rowDataList
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Sheet');
  }

  const data = await response.json();
  return {
    spreadsheetUrl: data.spreadsheetUrl,
    spreadsheetId: data.spreadsheetId
  };
}

export async function exportToGoogleDocs(
  accessToken: string,
  docTitle: string,
  reportData: {
    className: string;
    schoolName: string;
    type: string;
    totalStudents: number;
    metricsSummary: string;
    details: string[];
  }
): Promise<{ documentId: string; documentUrl: string }> {
  // 1. Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Doc');
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // 2. Build insertion requests
  const textContent = `LAPORAN RESMI PERKEMBANGAN BELAJAR SISWA
${reportData.schoolName}

Kelas: ${reportData.className}
Tipe Laporan: ${reportData.type}
Jumlah Siswa: ${reportData.totalStudents} Siswa
Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

=======================================================

Ringkasan Statistik Kelas:
${reportData.metricsSummary}

Daftar Catatan & Kondisi Detail Siswa:
${reportData.details.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Laporan ini dibuat secara otomatis dari Sistem Informasi SIM-IBU.
`;

  const requests = [
    {
      insertText: {
        location: { index: 1 },
        text: textContent
      }
    }
  ];

  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: requests
    })
  });

  if (!updateRes.ok) {
    const err = await updateRes.json();
    throw new Error(err.error?.message || 'Gagal menyusun konten Google Doc');
  }

  return {
    documentId: documentId,
    documentUrl: `https://docs.google.com/document/d/${documentId}/edit`
  };
}
