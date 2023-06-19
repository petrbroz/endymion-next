import { initViewer, loadModel } from './viewer.js';
import { initTree } from './hubs.js';
import { loadShares } from './shares.js';

const login = document.getElementById('login');
try {
    const resp = await fetch('/auth/profile');
    if (resp.ok) {
        const user = await resp.json();
        login.innerText = `Logout (${user.name})`;
        login.onclick = () => window.location.replace('/auth/logout');
        const viewer = await initViewer(document.getElementById('preview'));
        initTree('#hubs', (id) => {
            const urn = window.btoa(id).replace(/=/g, '').replace('/', '_');
            loadModel(viewer, urn);
            loadShares(document.getElementById('shares'), urn);
        });
    } else {
        login.innerText = 'Login';
        login.onclick = () => window.location.replace('/auth/login');
    }
    login.style.visibility = 'visible';
} catch (err) {
    alert('Could not initialize the application. See console for more details.');
    console.error(err);
}
