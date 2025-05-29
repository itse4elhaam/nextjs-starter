export function getLocalStorage<T>(key: string): T | null {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) return null;
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error("Error getting item from localStorage", error);
    return null;
  }
}

export function setLocalStorage(key: string, value: unknown): void {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error("Error setting item in localStorage", error);
  }
}

export function getSessionStorage<T>(key: string): T | null {
  try {
    const serializedValue = sessionStorage.getItem(key);
    if (serializedValue === null) return null;
    return JSON.parse(serializedValue) as T;
  } catch (error) {
    console.error("Error getting item from sessionStorage", error);
    return null;
  }
}

export function setSessionStorage(key: string, value: unknown): void {
  try {
    const serializedValue = JSON.stringify(value);
    sessionStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error("Error setting item in sessionStorage", error);
  }
}
