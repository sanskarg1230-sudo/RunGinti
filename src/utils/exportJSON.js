export function exportMatchJSON(match) {
  const data = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    match,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${match.name || 'match'}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAllJSON(matches) {
  const data = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    totalMatches: matches.length,
    matches,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cricket-scorer-backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.matches) resolve(data.matches);
        else if (data.match) resolve([data.match]);
        else reject(new Error('Invalid backup file format'));
      } catch {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
