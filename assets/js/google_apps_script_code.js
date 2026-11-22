/**
 * GOOGLE APPS SCRIPT - MEMORY GAME BACKEND API
 * 
 * PANDUAN DEPLOYMENT (PENTING!):
 * 1. Buka spreadsheet Google Sheets Anda.
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus SELURUH kode yang ada di editor 'Code.gs' lalu tempelkan (paste) SEMUA isi file ini.
 * 4. Klik ikon Save (Simpan) / tekan Ctrl+S atau Cmd+S.
 * 5. TERAPKAN VERSI BARU (Wajib agar Web App /exec membaca kode terbaru):
 *    - Klik tombol biru 'Deploy' (Terapkan) di kanan atas.
 *    - Pilih 'Manage deployments' (Kelola penerapan).
 *    - Klik ikon Pensil (Edit) di samping penerapan Web App aktif Anda.
 *    - Pada dropdown 'Version' (Versi), pilih 'New version' (Versi baru).
 *    - Klik tombol 'Deploy' (Terapkan).
 * 6. Selesai! Web App URL Anda sekarang langsung mengirimkan SELURUH pemain (tanpa batas, boleh melebihi 50 atau 100 pemain).
 */

function parseTimeValue(val) {
  if (typeof val === "number") {
    return isNaN(val) ? 0 : val;
  }
  var str = String(val || "").trim();
  if (!str) return 0;
  if (str.indexOf(":") !== -1) {
    var parts = str.split(":");
    if (parts.length === 2) {
      var m = parseInt(parts[0], 10) || 0;
      var s = parseInt(parts[1], 10) || 0;
      return m * 60 + s;
    }
    if (parts.length === 3) {
      var h = parseInt(parts[0], 10) || 0;
      var m = parseInt(parts[1], 10) || 0;
      var s = parseInt(parts[2], 10) || 0;
      return h * 3600 + m * 60 + s;
    }
  }
  var num = Number(str);
  return isNaN(num) ? 0 : num;
}

function doGet(e) {
  try {
    const sheet = getOrCreateLeaderboardSheet();

    // Endpoint khusus untuk reset total leaderboard (jika dipanggil via GET ?resetLeaderboard=true)
    if (e && e.parameter && e.parameter.resetLeaderboard === 'true') {
      const resetMsg = resetLeaderboard();
      return createJsonResponse({ success: true, message: resetMsg });
    }

    // Endpoint khusus untuk seed/isi 50 atau 100 pemain langsung via browser GET (?seed50=true atau ?seed100=true)
    if (e && e.parameter && (e.parameter.seed50 === 'true' || e.parameter.populate50 === 'true')) {
      populate50Players();
    }
    if (e && e.parameter && (e.parameter.seed100 === 'true' || e.parameter.populate100 === 'true')) {
      populate100Players();
    }
    if (e && e.parameter && (e.parameter.cleanDuplicates === 'true' || e.parameter.clean === 'true')) {
      const cleanMsg = cleanDuplicates();
      return createJsonResponse({ success: true, message: cleanMsg });
    }

    // 1. GUNAKAN getLastRow() UNTUK MENGETAHUI JUMLAH SELURUH BARIS DATA TERAKHIR
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    Logger.log("[doGet] Memeriksa sheet. Baris terakhir (lastRow): " + lastRow + ", kolom: " + lastCol);

    // Jika sheet kosong atau hanya berisi baris 1 (header)
    if (lastRow <= 1) {
      Logger.log("[doGet] Sheet kosong atau hanya baris header. Mengembalikan array kosong [].");
      return createJsonResponse([]);
    }

    // 2. AMBIL SELURUH BARIS DARI BARIS 1 SAMPAI lastRow (TANPA BATASAN 10 BARIS!)
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    Logger.log("[doGet] Berhasil membaca seluruh baris data: " + (data.length - 1) + " pemain ditemukan di sheet.");

    // Identifikasi indeks kolom berdasarkan header di baris 1
    const headers = data[0].map(h => String(h || '').trim().toLowerCase());
    
    let idIdx = headers.indexOf('player id');
    if (idIdx === -1) idIdx = headers.indexOf('id');

    let nameIdx = headers.indexOf('nama');
    if (nameIdx === -1) nameIdx = headers.indexOf('nama pemain');
    if (nameIdx === -1) nameIdx = headers.indexOf('name');
    if (nameIdx === -1) nameIdx = headers.indexOf('player');
    if (nameIdx === -1) nameIdx = 0; // Fallback jika header tidak standar

    let timeIdx = headers.indexOf('waktu');
    if (timeIdx === -1) timeIdx = headers.indexOf('waktu terbaik');
    if (timeIdx === -1) timeIdx = headers.indexOf('time');
    if (timeIdx === -1) timeIdx = headers.indexOf('seconds');
    if (timeIdx === -1) timeIdx = 1; // Fallback

    let movesIdx = headers.indexOf('langkah');
    if (movesIdx === -1) movesIdx = headers.indexOf('langkah terbaik');
    if (movesIdx === -1) movesIdx = headers.indexOf('moves');
    if (movesIdx === -1) movesIdx = headers.indexOf('steps');
    if (movesIdx === -1) movesIdx = 2; // Fallback

    let dateIdx = headers.indexOf('tanggal');
    if (dateIdx === -1) dateIdx = headers.indexOf('tanggal terakhir bermain');
    if (dateIdx === -1) dateIdx = headers.indexOf('date');

    // Endpoint khusus untuk cek ketersediaan nama: ?checkName=Lulu&playerId=PID-xxx
    if (e && e.parameter && e.parameter.checkName) {
      const checkNorm = normalizePlayerName(e.parameter.checkName);
      const reqPlayerId = String(e.parameter.playerId || '').trim();
      let isTaken = false;

      for (let i = 1; i < data.length; i++) {
        const rowName = normalizePlayerName(data[i][nameIdx]);
        const rowId = idIdx !== -1 ? String(data[i][idIdx] || '').trim() : '';
        const rowTime = parseTimeValue(data[i][timeIdx]);

        // Hanya baris yang ada di leaderboard (waktu > 0) yang dianggap sudah dipakai!
        if (rowTime > 0 && rowName === checkNorm) {
          if (reqPlayerId && rowId && rowId === reqPlayerId) {
            continue;
          }
          isTaken = true;
          break;
        }
      }
      return createJsonResponse({ name: e.parameter.checkName, taken: isTaken });
    }

    // 3. PROSES & DEDUPLIKASI SELURUH BARIS PEMAIN
    const playersMap = {};

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const nama = String(row[nameIdx] || '').trim();
      if (!nama) continue;

      const waktu = parseTimeValue(row[timeIdx]);
      if (waktu <= 0) continue; // Abaikan baris yang belum menyelesaikan game

      const langkah = parseInt(row[movesIdx], 10) || 0;
      const tanggal = (dateIdx !== -1 && row[dateIdx]) ? String(row[dateIdx]) : '';
      const playerId = idIdx !== -1 ? String(row[idIdx] || '').trim() : '';

      // Kunci unik: NAMA DINORMALISASI (Satu nama hanya boleh memiliki satu entri di leaderboard)
      const key = normalizePlayerName(nama);

      if (!playersMap[key]) {
        playersMap[key] = {
          playerId: playerId,
          nama: nama,
          waktu: waktu,
          langkah: langkah,
          tanggal: tanggal
        };
      } else {
        // Jika terdapat entri ganda untuk nama yang sama, ambil skor terbaik (waktu tercepat, lalu langkah tersedikit)
        const curr = playersMap[key];
        const isBetter = (waktu < curr.waktu) || (waktu === curr.waktu && langkah < curr.langkah);
        if (isBetter) {
          playersMap[key] = {
            playerId: playerId || curr.playerId,
            nama: curr.nama,
            waktu: waktu,
            langkah: langkah,
            tanggal: tanggal || curr.tanggal
          };
        }
      }
    }

    const leaderboard = Object.values(playersMap);

    // 4. URUTKAN SELURUH PEMAIN BERDASARKAN ATURAN RANKING:
    // 1. Waktu tercepat (ascending)
    // 2. Langkah paling sedikit (ascending)
    // 3. Tanggal rekor paling awal (siapa yang mencetak skor lebih dulu)
    // 4. Nama A-Z (alfabetis ascending)
    leaderboard.sort((a, b) => {
      if (a.waktu !== b.waktu) return a.waktu - b.waktu;
      if (a.langkah !== b.langkah) return a.langkah - b.langkah;

      const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
      const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeA - timeB;
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      const nameA = String(a.nama || '').trim().toLowerCase();
      const nameB = String(b.nama || '').trim().toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);

      const idA = String(a.playerId || '');
      const idB = String(b.playerId || '');
      return idA.localeCompare(idB);
    });

    // 5. AMBIL SELURUH DATA PEMAIN TANPA BATASAN (BISA MELEBIHI 50, 100, DST.)
    const maxPlayers = leaderboard.length;
    const topPlayers = [];

    for (let idx = 0; idx < maxPlayers; idx++) {
      const item = leaderboard[idx];
      topPlayers.push({
        rank: idx + 1,
        playerId: item.playerId,
        nama: item.nama,
        waktu: item.waktu,
        langkah: item.langkah,
        tanggal: item.tanggal
      });
    }

    Logger.log("[doGet] Jumlah baris data di Sheet: " + (lastRow - 1) + 
               " | Pemain sah setelah deduplikasi: " + leaderboard.length + 
               " | Data dikirim ke website (seluruh pemain): " + topPlayers.length);

    return createJsonResponse(topPlayers);
  } catch (err) {
    Logger.log("[doGet Error] " + err.toString());
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Kunci proses selama 10 detik agar tidak ada race condition saat multiple request
    lock.waitLock(10000);
    const sheet = getOrCreateLeaderboardSheet();
    const bodyText = e.postData ? e.postData.contents : '';
    let payload = {};
    try {
      payload = JSON.parse(bodyText);
    } catch (parseErr) {
      return createJsonResponse({ success: false, error: 'Invalid JSON payload' });
    }

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn() || 5;
    const data = lastRow > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [];
    const headers = data.length > 0 ? data[0].map(h => String(h || '').trim().toLowerCase()) : [];

    let idIdx = headers.indexOf('player id');
    if (idIdx === -1) idIdx = headers.indexOf('id');
    if (idIdx === -1) idIdx = 0;

    let nameIdx = headers.indexOf('nama');
    if (nameIdx === -1) nameIdx = headers.indexOf('nama pemain');
    if (nameIdx === -1) nameIdx = headers.indexOf('name');
    if (nameIdx === -1) nameIdx = headers.indexOf('player');
    if (nameIdx === -1) nameIdx = 1;

    let timeIdx = headers.indexOf('waktu');
    if (timeIdx === -1) timeIdx = headers.indexOf('waktu terbaik');
    if (timeIdx === -1) timeIdx = headers.indexOf('time');
    if (timeIdx === -1) timeIdx = headers.indexOf('seconds');
    if (timeIdx === -1) timeIdx = 2;

    let movesIdx = headers.indexOf('langkah');
    if (movesIdx === -1) movesIdx = headers.indexOf('langkah terbaik');
    if (movesIdx === -1) movesIdx = headers.indexOf('moves');
    if (movesIdx === -1) movesIdx = headers.indexOf('steps');
    if (movesIdx === -1) movesIdx = 3;

    let dateIdx = headers.indexOf('tanggal');
    if (dateIdx === -1) dateIdx = headers.indexOf('tanggal terakhir bermain');
    if (dateIdx === -1) dateIdx = headers.indexOf('date');
    if (dateIdx === -1) dateIdx = 4;

    const action = String(payload.action || '').trim().toLowerCase();

    // =========================================================================
    // AKSI 0: RESET TOTAL LEADERBOARD (Endpoint POST)
    // =========================================================================
    if (action === 'reset' || action === 'resetleaderboard') {
      const resetMsg = resetLeaderboard();
      return createJsonResponse({ success: true, message: resetMsg });
    }

    if (action === 'seed50' || action === 'populate50') {
      const seedMsg = populate50Players();
      return createJsonResponse({ success: true, message: seedMsg });
    }

    if (action === 'seed100' || action === 'populate100') {
      const seedMsg = populate100Players();
      return createJsonResponse({ success: true, message: seedMsg });
    }

    // =========================================================================
    // AKSI 1: PENDAFTARAN PEMAIN BARU
    // =========================================================================
    if (action === 'register') {
      const rawName = String(payload.nama || payload.name || '').trim().substring(0, 20);
      if (!rawName) {
        return createJsonResponse({ success: false, error: 'Nama wajib diisi' });
      }
      if (rawName.length < 2) {
        return createJsonResponse({ success: false, error: 'Nama minimal 2 karakter' });
      }

      // Validasi duplikasi nama (abaikan huruf besar/kecil dan spasi berlebih)
      // ATURAN: HANYA NAMA YANG ADA DI LEADERBOARD (waktu > 0) YANG DIANGGAP SUDAH DIPAKAI!
      const checkNorm = normalizePlayerName(rawName);
      let existingUnplayedRowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        const rowName = normalizePlayerName(data[i][nameIdx]);
        const rowTime = parseTimeValue(data[i][timeIdx]);

        if (rowName === checkNorm) {
          if (rowTime > 0) {
            return createJsonResponse({ success: false, error: 'Nama sudah dipakai, pilih nama lain', taken: true });
          } else {
            existingUnplayedRowIndex = i + 1;
          }
        }
      }

      // Buat Player ID baru yang unik
      const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
      const ts = Date.now().toString(36).toUpperCase();
      const newPlayerId = `PID-${ts}-${rand}`;
      const nowIso = new Date().toISOString();

      if (existingUnplayedRowIndex !== -1) {
        sheet.getRange(existingUnplayedRowIndex, idIdx + 1).setValue(newPlayerId);
        sheet.getRange(existingUnplayedRowIndex, nameIdx + 1).setValue(rawName);
        sheet.getRange(existingUnplayedRowIndex, timeIdx + 1).setValue(0);
        sheet.getRange(existingUnplayedRowIndex, movesIdx + 1).setValue(0);
        sheet.getRange(existingUnplayedRowIndex, dateIdx + 1).setValue(nowIso);
      } else {
        const newRow = [];
        newRow[idIdx] = newPlayerId;
        newRow[nameIdx] = rawName;
        newRow[timeIdx] = 0;
        newRow[movesIdx] = 0;
        newRow[dateIdx] = nowIso;
        sheet.appendRow(newRow);
      }

      return createJsonResponse({
        success: true,
        action: 'register',
        playerId: newPlayerId,
        nama: rawName
      });
    }

    // =========================================================================
    // AKSI 2: RENAME PEMAIN
    // =========================================================================
    if (action === 'rename') {
      const playerId = String(payload.playerId || '').trim();
      const oldName = String(payload.oldName || '').trim();
      const newName = String(payload.newName || payload.nama || payload.name || '').trim().substring(0, 20);

      if (!playerId && !oldName) {
        return createJsonResponse({ success: false, error: 'Identitas pemain tidak valid' });
      }
      if (!newName) {
        return createJsonResponse({ success: false, error: 'Nama tidak boleh kosong' });
      }
      if (newName.length < 2) {
        return createJsonResponse({ success: false, error: 'Nama minimal 2 karakter' });
      }

      // Validasi duplikasi nama terhadap baris lain di Leaderboard
      const checkNorm = normalizePlayerName(newName);
      const oldNorm = normalizePlayerName(oldName);

      for (let i = 1; i < data.length; i++) {
        const rowName = normalizePlayerName(data[i][nameIdx]);
        const rowId = String(data[i][idIdx] || '').trim();
        const rowTime = parseTimeValue(data[i][timeIdx]);

        if (rowTime > 0 && rowName === checkNorm) {
          if ((playerId && rowId && rowId === playerId) || (oldNorm && rowName === oldNorm)) {
            continue; // Nama sendiri
          }
          return createJsonResponse({ success: false, error: 'Nama sudah dipakai, pilih nama lain', taken: true });
        }
      }

      // Cari baris pemain berdasarkan Player ID, atau fallback ke oldName
      let targetRowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][idIdx] || '').trim();
        const rowName = normalizePlayerName(data[i][nameIdx]);

        if (playerId && rowId && rowId === playerId) {
          targetRowIndex = i + 1;
          break;
        } else if (oldNorm && rowName === oldNorm) {
          targetRowIndex = i + 1;
          break;
        }
      }

      if (targetRowIndex !== -1) {
        if (playerId) {
          sheet.getRange(targetRowIndex, idIdx + 1).setValue(playerId);
        }
        sheet.getRange(targetRowIndex, nameIdx + 1).setValue(newName);
      } else {
        const newRow = [];
        newRow[idIdx] = playerId;
        newRow[nameIdx] = newName;
        newRow[timeIdx] = 0;
        newRow[movesIdx] = 0;
        newRow[dateIdx] = new Date().toISOString();
        sheet.appendRow(newRow);
      }

      return createJsonResponse({
        success: true,
        action: 'rename',
        playerId: playerId,
        nama: newName
      });
    }

    // =========================================================================
    // AKSI 3: SUBMIT SKOR (PENYIMPANAN SKOR PEMAIN)
    // =========================================================================
    const playerId = String(payload.playerId || '').trim();
    const nama = String(payload.nama || payload.name || '').trim().substring(0, 20);
    const waktu = parseTimeValue(payload.waktu !== undefined ? payload.waktu : payload.seconds);
    const langkah = parseInt(payload.langkah !== undefined ? payload.langkah : payload.moves, 10) || 0;
    const tanggal = payload.tanggal || new Date().toISOString();

    if (!nama) {
      return createJsonResponse({ success: false, error: 'Nama wajib diisi' });
    }

    // 1. Setelah pemain menyelesaikan permainan, sistem mengecek apakah nama pemain sudah terdaftar di Google Sheets.
    // Pencarian dilakukan secara case-insensitive dan spasi dinormalisasi.
    const targetNorm = normalizePlayerName(nama);

    let targetRowIndex = -1;
    let existingWaktu = Infinity;
    let existingLangkah = Infinity;
    const duplicateRowIndices = [];

    for (let i = 1; i < data.length; i++) {
      const rowName = normalizePlayerName(data[i][nameIdx]);
      if (rowName === targetNorm) {
        const rowTime = parseTimeValue(data[i][timeIdx]);
        const rowSteps = parseInt(data[i][movesIdx], 10) || 0;

        if (targetRowIndex === -1) {
          targetRowIndex = i + 1; // Baris 1-based di Google Sheets
          existingWaktu = rowTime > 0 ? rowTime : Infinity;
          existingLangkah = rowTime > 0 ? rowSteps : Infinity;
        } else {
          // Jika terdapat baris duplikat nama yang sama dari sesi lama, catat untuk dihapus
          duplicateRowIndices.push(i + 1);
          if (rowTime > 0) {
            const isRowBetter = (rowTime < existingWaktu) || (rowTime === existingWaktu && rowSteps < existingLangkah);
            if (isRowBetter) {
              existingWaktu = rowTime;
              existingLangkah = rowSteps;
            }
          }
        }
      }
    }

    // Bersihkan baris duplikat lama untuk nama ini jika ada (hapus dari bawah ke atas)
    for (let d = duplicateRowIndices.length - 1; d >= 0; d--) {
      sheet.deleteRow(duplicateRowIndices[d]);
      if (targetRowIndex > duplicateRowIndices[d]) {
        targetRowIndex--;
      }
    }

    // Aturan penilaian:
    // - Waktu lebih cepat menjadi prioritas utama.
    // - Jika waktu sama, jumlah langkah lebih sedikit menjadi prioritas berikutnya.
    const isBetter = (existingWaktu === Infinity) ||
                     (waktu < existingWaktu) ||
                     (waktu === existingWaktu && langkah < existingLangkah);

    if (targetRowIndex !== -1) {
      // 3. Jika nama sudah terdaftar:
      // PENTING: Satu nama hanya boleh memiliki satu entri. JANGAN MEMBUAT BARIS BARU!
      if (isBetter) {
        // 4. Jika hasil terbaru lebih baik, perbarui data pada baris pemain yang sama.
        sheet.getRange(targetRowIndex, timeIdx + 1).setValue(waktu);
        sheet.getRange(targetRowIndex, movesIdx + 1).setValue(langkah);
        sheet.getRange(targetRowIndex, dateIdx + 1).setValue(tanggal);
        sheet.getRange(targetRowIndex, nameIdx + 1).setValue(nama);
        if (playerId) {
          sheet.getRange(targetRowIndex, idIdx + 1).setValue(playerId);
        }
      }
      // 5. Jika hasil terbaru lebih buruk, pertahankan skor sebelumnya tanpa membuat perubahan.

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        action: 'update_score',
        isNewBest: isBetter,
        isRegistered: true,
        nama: nama,
        waktu: isBetter ? waktu : existingWaktu,
        langkah: isBetter ? langkah : existingLangkah
      });
    } else {
      // 2. Jika nama belum terdaftar, tambahkan sebagai pemain baru.
      const newRow = [];
      newRow[idIdx] = playerId;
      newRow[nameIdx] = nama;
      newRow[timeIdx] = waktu;
      newRow[movesIdx] = langkah;
      newRow[dateIdx] = tanggal;
      sheet.appendRow(newRow);

      SpreadsheetApp.flush();

      return createJsonResponse({
        success: true,
        action: 'insert_score',
        isNewBest: true,
        isRegistered: false,
        nama: nama,
        waktu: waktu,
        langkah: langkah
      });
    }
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateLeaderboardSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Leaderboard');
  if (!sheet) {
    sheet = ss.getSheets()[0];
  }

  // Jika sheet kosong, inisialisasi header kolom resmi
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Player ID', 'Nama Pemain', 'Waktu Terbaik', 'Langkah Terbaik', 'Tanggal Terakhir Bermain']);
    sheet.getRange('A1:E1').setFontWeight('bold');
  }
  return sheet;
}

function normalizePlayerName(nama) {
  return String(nama || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeText(str) {
  return normalizePlayerName(str);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * PEMBERSIHAN DATA GANDA DI GOOGLE SHEETS (Fungsi sekali pakai)
 * Untuk setiap Player ID yang sama, fungsi ini hanya menyisakan baris dengan skor terbaik
 * (waktu tercepat, lalu langkah tersedikit) dan menghapus baris duplikat lainnya.
 */
function cleanDuplicates() {
  const sheet = getOrCreateLeaderboardSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn() || 5;

  if (lastRow <= 1) {
    Logger.log("Leaderboard kosong atau hanya berisi baris header.");
    return "Leaderboard kosong.";
  }

  const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = data[0].map(h => String(h || '').trim().toLowerCase());
  const idIdx = headers.indexOf('player id') !== -1 ? headers.indexOf('player id') : 0;
  const nameIdx = headers.indexOf('nama') !== -1 ? headers.indexOf('nama') : (headers.indexOf('nama pemain') !== -1 ? headers.indexOf('nama pemain') : 1);
  const timeIdx = headers.indexOf('waktu') !== -1 ? headers.indexOf('waktu') : (headers.indexOf('waktu terbaik') !== -1 ? headers.indexOf('waktu terbaik') : 2);
  const movesIdx = headers.indexOf('langkah') !== -1 ? headers.indexOf('langkah') : (headers.indexOf('langkah terbaik') !== -1 ? headers.indexOf('langkah terbaik') : 3);
  const dateIdx = headers.indexOf('tanggal') !== -1 ? headers.indexOf('tanggal') : (headers.indexOf('tanggal terakhir bermain') !== -1 ? headers.indexOf('tanggal terakhir bermain') : 4);

  const bestByName = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const playerId = String(row[idIdx] || '').trim();
    const nama = String(row[nameIdx] || '').trim();
    const waktu = parseTimeValue(row[timeIdx]);
    const langkah = parseInt(row[movesIdx], 10) || 0;

    if (waktu <= 0 || !nama) continue;

    // Satu nama hanya boleh memiliki satu entri di leaderboard
    const key = normalizePlayerName(nama);

    if (!bestByName[key]) {
      bestByName[key] = row;
    } else {
      const existingRow = bestByName[key];
      const existingWaktu = parseTimeValue(existingRow[timeIdx]);
      const existingLangkah = parseInt(existingRow[movesIdx], 10) || 0;

      let isBetter = false;
      if (existingWaktu <= 0 && waktu > 0) {
        isBetter = true;
      } else if (waktu > 0 && existingWaktu > 0) {
        if (waktu < existingWaktu) {
          isBetter = true;
        } else if (waktu === existingWaktu && langkah < existingLangkah) {
          isBetter = true;
        }
      }

      if (isBetter) {
        bestByName[key] = row;
      }
    }
  }

  const cleanedRows = [data[0]]; // Header
  const playerRows = Object.values(bestByName);
  for (let i = 0; i < playerRows.length; i++) {
    cleanedRows.push(playerRows[i]);
  }

  const removedCount = data.length - cleanedRows.length;

  if (removedCount > 0) {
    sheet.clearContents();
    sheet.getRange(1, 1, cleanedRows.length, cleanedRows[0].length).setValues(cleanedRows);
    SpreadsheetApp.flush();
    Logger.log("Pembersihan berhasil! Menghapus " + removedCount + " baris duplikat nama.");
    return "Pembersihan berhasil! Dihapus " + removedCount + " baris duplikat nama.";
  } else {
    Logger.log("Tidak ditemukan baris duplikat nama.");
    return "Tidak ada baris duplikat nama.";
  }
}

/**
 * FUNGSI RESET TOTAL LEADERBOARD (Sekali pakai)
 * Menghapus SEMUA data pemain dari baris 2 ke bawah di Google Sheets,
 * dan hanya menyisakan baris 1 (Header resmi).
 */
function resetLeaderboard() {
  const sheet = getOrCreateLeaderboardSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    Logger.log("Leaderboard berhasil di-reset! Semua baris pemain telah dihapus.");
    return "Leaderboard berhasil di-reset total. Hanya baris header yang tersisa.";
  } else {
    Logger.log("Leaderboard sudah kosong (hanya header).");
    return "Leaderboard sudah bersih.";
  }
}

/**
 * FUNGSI ISI 50 PEMAIN KE GOOGLE SHEETS
 * Menulis 50 pemain ke Google Sheets agar Leaderboard langsung terisi 50 baris data resmi.
 */
function populate50Players() {
  const sheet = getOrCreateLeaderboardSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  const samplePlayers = [
    { nama: 'Lulu', waktu: 43, langkah: 26 },
    { nama: 'ridwan', waktu: 43, langkah: 26 },
    { nama: 'amel', waktu: 43, langkah: 26 },
    { nama: 'amel23', waktu: 43, langkah: 26 },
    { nama: 'zaki', waktu: 43, langkah: 26 },
    { nama: 'tomas', waktu: 43, langkah: 26 },
    { nama: 'thomas', waktu: 43, langkah: 26 },
    { nama: 'thomas14', waktu: 43, langkah: 26 },
    { nama: 'ulul23', waktu: 43, langkah: 26 },
    { nama: 'Dimas', waktu: 45, langkah: 27 },
    { nama: 'Sarah', waktu: 46, langkah: 28 },
    { nama: 'Fajar', waktu: 47, langkah: 28 },
    { nama: 'Nabila', waktu: 49, langkah: 29 },
    { nama: 'Kevin', waktu: 50, langkah: 30 },
    { nama: 'Jessica', waktu: 52, langkah: 31 },
    { nama: 'Budi', waktu: 53, langkah: 31 },
    { nama: 'Anita', waktu: 55, langkah: 32 },
    { nama: 'Rizky', waktu: 56, langkah: 33 },
    { nama: 'Putri', waktu: 58, langkah: 34 },
    { nama: 'Daniel', waktu: 59, langkah: 34 },
    { nama: 'Maya', waktu: 61, langkah: 35 },
    { nama: 'Andre', waktu: 63, langkah: 36 },
    { nama: 'Cindy', waktu: 65, langkah: 36 },
    { nama: 'Hendra', waktu: 66, langkah: 37 },
    { nama: 'Tiara', waktu: 68, langkah: 38 },
    { nama: 'Rian', waktu: 70, langkah: 39 },
    { nama: 'Bella', waktu: 72, langkah: 40 },
    { nama: 'Agung', waktu: 74, langkah: 40 },
    { nama: 'Dinda', waktu: 76, langkah: 41 },
    { nama: 'Eko', waktu: 78, langkah: 42 },
    { nama: 'Nadia', waktu: 80, langkah: 43 },
    { nama: 'Gilang', waktu: 82, langkah: 44 },
    { nama: 'Fitri', waktu: 85, langkah: 45 },
    { nama: 'Arif', waktu: 87, langkah: 46 },
    { nama: 'Vina', waktu: 90, langkah: 47 },
    { nama: 'Surya', waktu: 92, langkah: 48 },
    { nama: 'Intan', waktu: 95, langkah: 49 },
    { nama: 'Bayu', waktu: 98, langkah: 50 },
    { nama: 'Clarissa', waktu: 100, langkah: 51 },
    { nama: 'Rendy', waktu: 103, langkah: 52 },
    { nama: 'Ratna', waktu: 106, langkah: 53 },
    { nama: 'Ilham', waktu: 109, langkah: 54 },
    { nama: 'Tari', waktu: 112, langkah: 55 },
    { nama: 'Bagas', waktu: 115, langkah: 56 },
    { nama: 'Wulan', waktu: 118, langkah: 57 },
    { nama: 'Doni', waktu: 122, langkah: 59 },
    { nama: 'Siska', waktu: 126, langkah: 60 },
    { nama: 'Wahyu', waktu: 130, langkah: 62 },
    { nama: 'Tania', waktu: 135, langkah: 64 },
    { nama: 'Yudi', waktu: 140, langkah: 66 }
  ];

  const nowIso = new Date().toISOString();
  const rows = samplePlayers.map(function(p, idx) {
    return [
      'PID-SMP-' + (idx + 1),
      p.nama,
      p.waktu,
      p.langkah,
      nowIso
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log("Berhasil mengisi 50 pemain ke Google Sheets!");
  return "Berhasil mengisi 50 pemain ke Leaderboard.";
}

/**
 * FUNGSI ISI 100 PEMAIN KE GOOGLE SHEETS
 * Menulis 100 pemain ke Google Sheets agar Leaderboard langsung terisi 100 baris data resmi.
 */
function populate100Players() {
  const sheet = getOrCreateLeaderboardSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  const sampleNames = [
    'Lulu', 'ridwan', 'amel', 'amel23', 'zaki', 'tomas', 'thomas', 'thomas14', 'ulul23', 'Dimas',
    'Sarah', 'Fajar', 'Nabila', 'Kevin', 'Jessica', 'Budi', 'Anita', 'Rizky', 'Putri', 'Daniel',
    'Maya', 'Andre', 'Cindy', 'Hendra', 'Tiara', 'Rian', 'Bella', 'Agung', 'Dinda', 'Eko',
    'Nadia', 'Gilang', 'Fitri', 'Arif', 'Vina', 'Surya', 'Intan', 'Bayu', 'Clarissa', 'Rendy',
    'Ratna', 'Ilham', 'Tari', 'Bagas', 'Wulan', 'Doni', 'Siska', 'Wahyu', 'Tania', 'Yudi',
    'Aldo', 'Bertha', 'Chandra', 'Dewi', 'Erik', 'Farah', 'Gery', 'Hany', 'Irfan', 'Jovita',
    'Kiki', 'Lukman', 'Mira', 'Niko', 'Olivia', 'Pandu', 'Qory', 'Rangga', 'Sherly', 'Taufik',
    'Umar', 'Vicky', 'Wawan', 'Xenia', 'Yoga', 'Zulfa', 'Alfi', 'Bima', 'Citra', 'David',
    'Erna', 'Ferry', 'Gita', 'Hadi', 'Ika', 'Joko', 'Kartika', 'Leo', 'Mega', 'Nova',
    'Oki', 'Prima', 'Qori', 'Riko', 'Sari', 'Tommy', 'Ulfa', 'Vino', 'Widya', 'Zainal'
  ];

  const now = Date.now();
  const rows = [];
  for (let i = 0; i < 100; i++) {
    const nama = sampleNames[i] || ('Pemain-' + (i + 1));
    const waktu = 20 + Math.floor(i * 1.2);
    const langkah = 14 + Math.floor(i * 0.5);
    const dateIso = new Date(now - (100 - i) * 60000).toISOString();
    rows.push([
      'PID-SMP-' + (i + 1),
      nama,
      waktu,
      langkah,
      dateIso
    ]);
  }

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  Logger.log("Berhasil mengisi 100 pemain ke Google Sheets!");
  return "Berhasil mengisi 100 pemain ke Leaderboard.";
}
