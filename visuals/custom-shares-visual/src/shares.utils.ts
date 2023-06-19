export interface IShare {
    urn: string;
    credentials: {
        access_token: string;
        token_type: 'Bearer';
        expires_in: number;
    };
}

export async function getShare(url: string): Promise<IShare> {
    const resp = await fetch(url);
    if (!resp.ok)
        throw new Error(await resp.text());
    const json = await resp.json();
    return json;
}
