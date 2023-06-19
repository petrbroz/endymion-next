export async function loadShares(container, urn) {
    try {
        const resp = await fetch(`/shares/${urn}`);
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const secrets = await resp.json();
        container.innerHTML = `
            <ul>
                ${secrets.map(secret => `
                    <li>
                        <a href="${window.location.origin}/shares/${urn}/${secret}">${secret}</a>
                        <button class="copy-link" data-urn="${urn}" data-secret="${secret}">Copy Link</button>
                        <button class="remove" data-urn="${urn}" data-secret="${secret}">Delete</button>
                    </li>
                `).join('')}
            </ul>
            <button id="add-share">New Share</button>
        `;
        container.querySelector('#add-share').onclick = async () => {
            try {
                const share = await createShare(urn);
                console.log('Created share', share);
                loadShares(container, urn);
            } catch (err) {
                alert('Could not create new share. See the console for more details.');
                console.error(err);
            }
        };
        for (const el of container.querySelectorAll('.remove')) {
            el.onclick = async () => {
                const { urn, secret } = el.dataset;
                await deleteShare(el.dataset.urn, el.dataset.secret);
                console.log('Removed share', urn, secret);
                loadShares(container, urn);
            };
        }
        for (const el of container.querySelectorAll('.copy-link')) {
            el.onclick = async () => {
                const { urn, secret } = el.dataset;
                navigator.clipboard.writeText(`${window.location.origin}/shares/${urn}/${secret}`);
            };
        }
    } catch (err) {
        alert('Could not obtain list of shares. See the console for more details.');
        console.error(err);
    }
}

async function createShare(urn) {
    const resp = await fetch(`/shares/${urn}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urn })
    });
    if (!resp.ok) {
        throw new Error(await resp.text());
    }
    const share = await resp.json();
    return share;
}

async function deleteShare(urn, secret) {
    const resp = await fetch(`/shares/${urn}/${secret}`, {
        method: 'delete'
    });
    if (!resp.ok) {
        throw new Error(await resp.text());
    }
}
