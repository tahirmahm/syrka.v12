import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

export async function storeData(collection: string, data: any) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  let existing: any[] = [];
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    existing = JSON.parse(content);
  } catch (e) {
    // File doesn't exist
  }
  existing.push({ ...data, timestamp: new Date().toISOString() });
  await fs.writeFile(filePath, JSON.stringify(existing, null, 2));
}

export async function getData(collection: string) {
  const filePath = path.join(DATA_DIR, `${collection}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return [];
  }
}
