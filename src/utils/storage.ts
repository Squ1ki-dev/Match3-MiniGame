
class StorageWrapper {
    public getString(key: string) {
        return localStorage.getItem(key) ?? undefined;
    }

    public setString(key: string, value: string) {
        localStorage.setItem(key, value);
    }

    public getNumber(key: string) {
        const str = this.getString(key) ?? undefined;
        const value = Number(str);
        return isNaN(value) ? null : value;
    }

    public setNumber(key: string, value: number) {
        this.setString(key, String(value));
    }

    public getBool(key: string) {
        const bool = localStorage.getItem(key);
        return bool ? Boolean(bool.toLowerCase()) : undefined;
    }

    public setBool(key: string, value: boolean) {
        localStorage.setItem(key, String(value));
    }

    public getObject(key: string) {
        const str = this.getString(key);
        if (!str) return undefined;
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn(e);
            return undefined;
        }
    }

    public setObject(key: string, value: Record<string, unknown>) {
        this.setString(key, JSON.stringify(value));
    }
}

export const storage = new StorageWrapper();
