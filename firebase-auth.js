// firebase-auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { firebaseConfig } from "./config-data.js"; // کنفیگریشن یہاں امپورٹ کر رہے ہیں

const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

window.firebaseDb = db;
window.firebaseAuth = auth;

const authContainer = document.getElementById('auth-container');
const appLayout = document.getElementById('app-layout');
const btnGoogleLogin = document.getElementById('btn-google-login');
const btnAuthAction = document.getElementById('btn-auth-action');
const btnToggleAuth = document.getElementById('btn-toggle-auth');
const btnForgotPass = document.getElementById('btn-forgot-password');
const btnLogout = document.getElementById('btn-logout');

const emailInput = document.getElementById('auth-email');
const passInput = document.getElementById('auth-password');
const repassInput = document.getElementById('auth-re-password');
const repassContainer = document.getElementById('re-password-container');
const toastEl = document.getElementById('toast');

let isSignUp = false;

function showAuthToast(msg) {
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toastEl.classList.add('translate-y-24', 'opacity-0'), 3000);
}

if(btnToggleAuth) {
    btnToggleAuth.addEventListener('click', () => {
        isSignUp = !isSignUp;
        if(isSignUp) {
            repassContainer.classList.remove('hidden');
            btnAuthAction.textContent = 'Sign Up';
            btnToggleAuth.textContent = 'Already have an account? Login';
        } else {
            repassContainer.classList.add('hidden');
            btnAuthAction.textContent = 'Login';
            btnToggleAuth.textContent = 'Create an account';
        }
    });
}

if(btnAuthAction) {
    btnAuthAction.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passInput.value;
        if(!email || !password) return showAuthToast("Please enter email and password.");

        if(isSignUp) {
            const repass = repassInput.value;
            if(password !== repass) return showAuthToast("Passwords do not match!");
            btnAuthAction.textContent = 'Loading...';
            createUserWithEmailAndPassword(auth, email, password)
                .then(() => showAuthToast("Account created successfully!"))
                .catch(err => { showAuthToast(err.message); btnAuthAction.textContent = 'Sign Up'; });
        } else {
            btnAuthAction.textContent = 'Loading...';
            signInWithEmailAndPassword(auth, email, password)
                .then(() => showAuthToast("Logged in successfully!"))
                .catch(err => { showAuthToast("Login failed: " + err.message); btnAuthAction.textContent = 'Login'; });
        }
    });
}

if(btnGoogleLogin) {
    btnGoogleLogin.addEventListener('click', () => {
        signInWithPopup(auth, provider).then(() => showAuthToast("Logged in with Google!")).catch(err => showAuthToast("Google Login failed: " + err.message));
    });
}

if(btnForgotPass) {
    btnForgotPass.addEventListener('click', () => {
        const email = emailInput.value;
        if(!email) return showAuthToast("Please enter your email first to reset password.");
        sendPasswordResetEmail(auth, email).then(() => showAuthToast("Password reset email sent!")).catch(err => showAuthToast(err.message));
    });
}

if(btnLogout) {
    btnLogout.addEventListener('click', () => {
        if(confirm("Are you sure you want to logout? All unsaved data will be kept in cloud if synced.")) {
            signOut(auth).then(() => showAuthToast("Logged out successfully.")).catch(() => showAuthToast("Error logging out."));
        }
    });
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if(authContainer) authContainer.classList.add('hidden');
        if(appLayout) appLayout.classList.remove('hidden');
        if(btnAuthAction) btnAuthAction.textContent = isSignUp ? 'Sign Up' : 'Login';
        window.dispatchEvent(new Event('auth-ready'));
    } else {
        if(authContainer) authContainer.classList.remove('hidden');
        if(appLayout) appLayout.classList.add('hidden');
        if(emailInput) emailInput.value = '';
        if(passInput) passInput.value = '';
        if(repassInput) repassInput.value = '';
    }
});
